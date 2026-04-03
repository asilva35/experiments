import React, { useState, useRef, Suspense } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Autocomplete } from '@react-google-maps/api';
import { jsPDF } from 'jspdf';
// Nota: He incluido clases de Tailwind para el diseño elegante
import { MapPin, Wind, Sun, FileText, Share, School, Hospital, ShoppingCart, ChevronRight, VectorSquare } from 'lucide-react';

const MAP_LIBRARIES: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

export default function FaisanEstateIntelligence() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: MAP_LIBRARIES
    });

    const [mapView, setMapView] = useState<'satellite' | 'roadmap'>('roadmap');
    const mapRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [propertyData, setPropertyData] = useState({
        address: 'Selecciona una ubicación',
        area: 0,
        aqi: 'N/A',
        amenities: { schools: 0, hospitals: 0, stores: 0 },
        solarPotential: 'Calcular...',
        isAnalyzing: false
    });

    const [mapSettings, setMapSettings] = useState({
        center: { lat: 10.3005, lng: -85.8409 },
        zoom: 19
    });


    const onPolygonComplete = (poly: google.maps.Polygon) => {
        if (!mapRef.current) return;

        const area = google.maps.geometry.spherical.computeArea(poly.getPath());
        const roundedArea = Math.round(area);
        const center = poly.getPath().getAt(0).toJSON();

        runDeepAnalysis(center, roundedArea);
    };

    const runDeepAnalysis = async (coords: google.maps.LatLngLiteral, areaM2: number) => {
        if (!mapRef.current) return;

        // 💡 GENERAR UNA LLAVE ÚNICA (basada en lat/lng con pocos decimales para agrupar)
        const cacheKey = `faisan_cache_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;

        // 💡 REVISAR SI EXISTE EN LOCALSTORAGE
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            console.log("🚀 Cargando datos desde la Caché Local (Ahorrando créditos)");
            const data = JSON.parse(cachedData);
            setPropertyData(prev => ({
                ...prev,
                area: areaM2, // El área puede variar según el dibujo, la mantenemos dinámica
                aqi: data.aqi,
                solarPotential: (areaM2 * 145).toLocaleString() + ' kWh/año',
                amenities: data.amenities,
                isAnalyzing: false
            }));
            return;
        }

        setPropertyData(prev => ({ ...prev, isAnalyzing: true }));

        try {
            const service = new google.maps.places.PlacesService(mapRef.current);
            const searchNearby = (type: string): Promise<number> => {
                return new Promise((resolve) => {
                    service.nearbySearch({ location: coords, radius: 1500, type }, (res) => resolve(res?.length || 0));
                });
            };

            const [schools, hospitals, stores] = await Promise.all([
                searchNearby('school'),
                searchNearby('hospital'),
                searchNearby('supermarket')
            ]);

            const resultToCache = {
                aqi: '42 - Excelente',
                amenities: { schools, hospitals, stores }
            };

            // 💡 GUARDAR EN CACHÉ PARA LA PRÓXIMA VEZ
            localStorage.setItem(cacheKey, JSON.stringify(resultToCache));

            setPropertyData(prev => ({
                ...prev,
                area: areaM2,
                aqi: resultToCache.aqi,
                solarPotential: (areaM2 * 145).toLocaleString() + ' kWh/año',
                amenities: resultToCache.amenities,
                isAnalyzing: false
            }));
        } catch (error) {
            console.error("Análisis fallido", error);
            setPropertyData(prev => ({ ...prev, isAnalyzing: false }));
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.text("FAISAN ESTATE INTELLIGENCE", 20, 20);
        doc.setFontSize(10);
        doc.text(`Propiedad: ${propertyData.address}`, 20, 35);
        doc.text(`Área: ${propertyData.area} m2`, 20, 45);
        doc.save(`Reporte_Faisan_${Date.now()}.pdf`);
    };

    const onMapLoad = (mapInstance: google.maps.Map) => {
        mapRef.current = mapInstance;

        // 💡 FILTRADO DE FEATURES (Solo funciona con Map ID vectorial)
        // Esto oculta POIs y etiquetas sin matar la geometría 3D
        const featureStyleOptions = {
            // Oculta todos los puntos de interés (iconos de tiendas, etc.)
            'poi': { visibility: 'off' },
            // Oculta los nombres de las calles
            'road.label': { visibility: 'off' },
            // Oculta iconos de transporte
            'transit': { visibility: 'off' }
        };

        // Aplicar estilos dinámicamente
        // Nota: Algunas versiones requieren que esto se configure en el Cloud Style
        // pero puedes forzarlo así:
        mapInstance.setOptions({
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "road",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });
    };

    return isLoaded ? (
        <div className="w-full h-screen relative bg-zinc-950 font-sans text-white overflow-hidden">

            {/* --- HEADER / SEARCH BAR --- */}
            <div className="absolute top-6 left-6 z-20 flex gap-2">
                <div className="w-96 group">
                    <Autocomplete
                        onLoad={(ref) => (autocompleteRef.current = ref)}
                        onPlaceChanged={() => {
                            // 💡 1. Obtenemos la instancia actual desde la referencia
                            const autocomplete = autocompleteRef.current;
                            if (!autocomplete) return;

                            // 💡 2. Obtenemos el lugar seleccionado en este preciso instante
                            const place = autocomplete.getPlace();

                            // 💡 3. Verificamos que tenga geometría y que el mapa esté listo
                            if (place.geometry && place.geometry.location && mapRef.current) {
                                const location = place.geometry.location;
                                const newCenter = { lat: location.lat(), lng: location.lng() };

                                // Actualizar el estado del mapa para moverlo
                                setMapSettings({
                                    center: newCenter,
                                    zoom: 19
                                });

                                // Actualizar el estado con la nueva dirección
                                setPropertyData(prev => ({
                                    ...prev,
                                    address: place.formatted_address || 'Dirección desconocida'
                                }));

                                console.log("Mapa movido a:", place.formatted_address);
                            } else {
                                console.warn("El lugar seleccionado no tiene coordenadas o el mapa no inició.");
                            }

                        }}
                    >
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-blue-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar propiedad o dirección..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl focus:border-blue-500/50 outline-none transition-all text-white"
                            />
                        </div>
                    </Autocomplete>
                </div>
            </div>

            {/* --- MAP VIEW TOGGLE --- */}
            <div className="absolute top-6 left-[25%] z-20 flex gap-2">
                <button
                    onClick={() => setMapView('roadmap')}
                    className={`px-4 py-2 rounded-lg ${mapView === 'roadmap' ? 'bg-blue-500 text-white' : 'bg-black/60 text-white'}`}
                >
                    Roadmap
                </button>
                <button
                    onClick={() => setMapView('satellite')}
                    className={`px-4 py-2 rounded-lg ${mapView === 'satellite' ? 'bg-blue-500 text-white' : 'bg-black/60 text-white'}`}
                >
                    Satellite
                </button>
            </div>

            {/* --- DASHBOARD LATERAL (Elegante) --- */}
            <div className="absolute top-6 right-6 z-20 w-80 flex flex-col gap-4">

                {/* CARD: MÉTRICAS PRINCIPALES */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-6">Property Insights</h2>

                    <div className="space-y-6">
                        <DataRow icon={<Share className="w-4 h-4 text-blue-400" />} label="Superficie" value={`${propertyData.area} m²`} />
                        <DataRow icon={<Wind className="w-4 h-4 text-emerald-400" />} label="Calidad Aire" value={propertyData.aqi} />
                        <DataRow icon={<Sun className="w-4 h-4 text-yellow-400" />} label="Potencial Solar" value={propertyData.solarPotential} />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold mb-4">Amenidades (1.5km)</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <Amenity icon={<School />} count={propertyData.amenities.schools} label="Colegios" />
                            <Amenity icon={<Hospital />} count={propertyData.amenities.hospitals} label="Salud" />
                            <Amenity icon={<ShoppingCart />} count={propertyData.amenities.stores} label="Comercio" />
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <button
                    onClick={generatePDF}
                    className="group flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20"
                >
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-bold">Exportar Reporte</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white p-4 rounded-2xl transition-all"
                >
                    <Share className="w-5 h-5" />
                    <span className="text-sm font-bold">Aerial 3D Drone</span>
                </button>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                <button
                    onClick={() => drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)}
                    className="p-4 hover:bg-white/10 rounded-xl transition-all text-blue-400"
                    title="Dibujar Lote"
                >
                    <VectorSquare className="w-8 h-8" /> {/* Icono grande y nítido */}
                </button>

                <button
                    onClick={() => drawingManagerRef.current?.setDrawingMode(null)}
                    className="p-4 hover:bg-white/10 rounded-xl transition-all text-zinc-400"
                    title="Mover Mapa"
                >
                    <MapPin className="w-8 h-8" />
                </button>
            </div>

            {/* --- MAPA --- */}
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapSettings.center}
                zoom={mapSettings.zoom}
                onLoad={onMapLoad}

                options={{
                    mapTypeId: mapView,
                    mapId: 'c698f208d68ba78b2afa9869',
                    tilt: 90,
                    heading: 0,
                    disableDefaultUI: true,
                    styles: [/* Aquí podrías añadir un estilo oscuro si no fuera satelital */]
                }}
            >
                <DrawingManager
                    onPolygonComplete={onPolygonComplete}
                    options={{
                        drawingControl: false,
                        drawingControlOptions: {
                            position: google.maps.ControlPosition.BOTTOM_CENTER,
                            drawingModes: [google.maps.drawing.OverlayType.POLYGON]
                        },
                        polygonOptions: {
                            fillColor: '#3b82f6',
                            fillOpacity: 0.2,
                            strokeWeight: 3,
                            strokeColor: '#3b82f6',
                            editable: true
                        }
                    }}
                    onLoad={(dm: any) => {
                        drawingManagerRef.current = dm;
                    }}
                />
            </GoogleMap>
        </div>
    ) : <div className="h-screen w-full bg-black flex items-center justify-center text-zinc-500 uppercase tracking-widest text-xs italic">Cargando Faisan Intelligence...</div>;
}

// --- SUB-COMPONENTES PARA LIMPIEZA VISUAL ---

function DataRow({ icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-xs text-zinc-400 font-medium">{label}</span>
            </div>
            <span className="text-sm font-black tabular-nums">{value}</span>
        </div>
    );
}

function Amenity({ icon, count, label }: { icon: any, count: number, label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="text-zinc-400 mb-1">{React.cloneElement(icon, { size: 16 })}</div>
            <span className="text-sm font-black">{count}</span>
            <span className="text-[8px] text-zinc-500 uppercase font-bold">{label}</span>
        </div>
    );
}