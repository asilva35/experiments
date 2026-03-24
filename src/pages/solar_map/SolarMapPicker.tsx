import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, StandaloneSearchBox, Marker } from '@react-google-maps/api';
import { jsPDF } from "jspdf";

interface AddressData {
    street?: string;
    city?: string;
    postcode?: string;
    fullAddress?: string;
}

const containerStyle = { width: '100%', height: '700px' };
const defaultCenter = { lat: 52.3676, lng: 4.9041 };

const SolarMapPicker = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: ['drawing', 'geometry', 'places']
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [path, setPath] = useState<any[]>([]);
    const [area, setArea] = useState<number>(0);
    const [isDrawingMode, setIsDrawingMode] = useState(false); // Estado del Toggle
    const [mapType, setMapType] = useState<string>('satellite');
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
    const [address, setAddress] = useState<AddressData | null>(null);

    const generatePDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // --- DISEÑO DEL PDF ---
        // Encabezado Naranja
        doc.setFillColor(232, 98, 10); // #E8620A
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("STROHM ENERGY", 15, 25);

        doc.setFontSize(10);
        doc.text(`Date: ${date}`, 160, 25);

        // Cuerpo del documento
        doc.setTextColor(17, 17, 17);
        doc.setFontSize(16);
        doc.text("Solar Quote Summary", 15, 55);

        doc.setDrawColor(232, 98, 10);
        doc.line(15, 60, 60, 60);

        // Datos Técnicos
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Roof surface: ${area.toFixed(1)} m2`, 15, 75);
        doc.text(`Estimated capacity: ${stats.panelCount} Panels (${stats.systemSizeKw.toFixed(1)} kWp)`, 15, 85);

        // Caja de Ahorros
        doc.setFillColor(245, 245, 245);
        doc.rect(15, 95, 180, 30, 'F');

        doc.setFont("helvetica", "bold");
        doc.setTextColor(232, 98, 10);
        doc.text(`ESTIMATED ANNUAL SAVINGS: EUR ${stats.annualSavings.toFixed(0)}`, 20, 113);

        // Disclaimer (Para que Mathieu vea que eres detallista)
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "italic");
        const disclaimer = "This is an estimation based on the area drawn. A certified technician must perform a physical inspection to validate the final viability.";
        doc.text(disclaimer, 15, 140, { maxWidth: 180 });

        // Guardar
        doc.save(`Strohm_Quote_${date.replace(/\//g, '-')}.pdf`);
    };

    // --- FUNCIÓN DE GEOCODIFICACIÓN INVERSA ---
    const fetchAddress = useCallback((lat: number, lng: number) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const addr = results[0].address_components;

                // Extraemos los componentes específicos que Mathieu necesita
                const street = addr.find(c => c.types.includes("route"))?.long_name;
                const number = addr.find(c => c.types.includes("street_number"))?.long_name;
                const city = addr.find(c => c.types.includes("locality"))?.long_name;
                const postcode = addr.find(c => c.types.includes("postal_code"))?.long_name;

                setAddress({
                    street: `${street || ''} ${number || ''}`.trim(),
                    city,
                    postcode,
                    fullAddress: results[0].formatted_address
                });
            }
        });
    }, []);

    // Disparamos la búsqueda de dirección cuando hay al menos un punto
    useEffect(() => {
        if (path.length === 1) {
            fetchAddress(path[0].lat, path[0].lng);
        } else if (path.length === 0) {
            setAddress(null);
        }
    }, [path, fetchAddress]);

    // --- LÓGICA DE CÁLCULO (Basada en Mathieu's Proto) ---
    const stats = useMemo(() => {
        const PANEL_M2 = 1.7;
        const KWP_PER_PANEL = 0.4; // 400W
        const ANNUAL_YIELD = 900;  // kWh por kWp
        const ENERGY_PRICE = 0.30; // €/kWh

        const panelCount = Math.floor(area / PANEL_M2);
        const systemSizeKw = panelCount * KWP_PER_PANEL;
        const annualProduction = systemSizeKw * ANNUAL_YIELD;
        const annualSavings = annualProduction * ENERGY_PRICE;

        return { panelCount, systemSizeKw, annualProduction, annualSavings };
    }, [area]);

    const onPlacesChanged = () => {
        if (searchBoxRef.current && map) {
            const places = searchBoxRef.current.getPlaces();
            if (places && places.length > 0) {
                const location = places[0].geometry?.location;
                if (location) {
                    map.panTo({ lat: location.lat(), lng: location.lng() });
                    map.setZoom(20);
                    setPath([]);
                    setArea(0);
                }
            }
        }
    };

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        // Solo dibujamos si el modo está activo
        if (!isDrawingMode || !e.latLng) return;

        const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        const newPath = [...path, newPoint];
        setPath(newPath);

        if (newPath.length > 2) {
            const areaSqM = window.google.maps.geometry.spherical.computeArea(
                newPath.map(p => new google.maps.LatLng(p.lat, p.lng))
            );
            setArea(areaSqM);
        }
    }, [path, isDrawingMode]);

    if (!isLoaded) return <div className="p-10 text-center font-bold">Cargando...</div>;

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto bg-[#111] rounded-[40px] overflow-hidden shadow-2xl border border-zinc-800">

            {/* ÁREA DEL MAPA */}
            <div className="relative flex-1">
                {/* BUSCADOR */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <StandaloneSearchBox onLoad={ref => searchBoxRef.current = ref} onPlacesChanged={onPlacesChanged}>
                        <input
                            type="text"
                            placeholder="Enter your address..."
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700 shadow-2xl text-white font-bold outline-none focus:border-[#E8620A] transition-all"
                        />
                    </StandaloneSearchBox>
                </div>

                {/* BOTÓN TOGGLE DIBUJAR */}
                <div className="absolute top-24 left-6 z-50 flex flex-row gap-2">
                    <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl ${isDrawingMode
                            ? 'bg-[#E8620A] text-orange-500 ring-4 ring-[#E8620A]/20'
                            : 'bg-white text-white hover:bg-zinc-100'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isDrawingMode ? 'bg-orange-500 animate-pulse' : 'bg-white'}`} />
                        {isDrawingMode ? 'Drawing Active' : 'Start Drawing'}
                    </button>

                    <button
                        onClick={() => { setPath([]); setArea(0); }}
                        style={{ fontSize: '10px' }}
                        className="py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all"
                    >
                        Clear Design
                    </button>

                    {/* Selector de tipo de mapa */}
                    <div className="bg-zinc-900/80 backdrop-blur-md px-5 py-3 rounded-full border border-zinc-700 flex gap-2">
                        {['satellite', 'hybrid', 'roadmap'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setMapType(type)}
                                style={{ fontSize: '10px', padding: '4px 8px' }}
                                className={`px-4 py-2 rounded-full font-black uppercase transition-all ${mapType === type ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={19}
                    mapTypeId={mapType as any}
                    onLoad={setMap}
                    onClick={onMapClick}
                    options={{
                        tilt: 0,
                        disableDefaultUI: true,
                        zoomControl: true,
                        // 🖱️ CAMBIO DE CURSOR DINÁMICO
                        draggableCursor: isDrawingMode ? 'crosshair' : 'grab',
                        draggingCursor: 'grabbing'
                    }}
                >
                    {path.map((point, index) => (
                        <Marker
                            key={index}
                            position={point}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 5,
                                fillColor: "#E8620A",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "#FFFFFF",
                            }}
                        />
                    ))}
                    {path.length > 2 && (
                        <Polygon
                            path={path}
                            options={{
                                fillColor: "#E8620A",
                                fillOpacity: 0.3,
                                strokeColor: "#E8620A",
                                strokeWeight: 3,
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* PANEL LATERAL DE RESULTADOS (SIDEBAR) */}
            <div className="w-full lg:w-80 bg-[#111] p-10 flex flex-col border-l border-zinc-800">
                <div className="mb-10">
                    <h2 className="text-[#E8620A] font-black text-2xl italic leading-none">STROHM</h2>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Roof Analysis</p>
                </div>

                <div className="space-y-8 flex-1">
                    {/* Métrica de Área */}
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total Roof Area</p>
                        <p className="text-4xl font-black text-white italic">{area.toFixed(1)} <span className="text-sm text-[#E8620A]">m²</span></p>
                    </div>

                    {/* Métrica de Paneles */}
                    <div className="pt-6 border-t border-zinc-800">
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Max Panels</p>
                        <p className="text-2xl font-black text-white">{stats.panelCount} <span className="text-xs text-zinc-500">Units</span></p>
                        <p className="text-[10px] text-zinc-600 mt-1">Est. {stats.systemSizeKw.toFixed(1)} kWp System</p>
                    </div>

                    {/* SECCIÓN DE DIRECCIÓN (Auto-capturada) */}
                    <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                        <p className="text-[#E8620A] text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#E8620A] rounded-full animate-pulse" />
                            Location Detected
                        </p>
                        {address ? (
                            <div className="space-y-1">
                                <p className="text-white font-bold text-sm leading-tight">{address.street || 'Selecting street...'}</p>
                                <p className="text-zinc-500 text-xs">{address.postcode} {address.city}</p>
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-xs italic">Draw on roof to capture address...</p>
                        )}
                    </div>

                    {/* Métrica de Ahorro - LA CLAVE PARA EL CLIENTE */}
                    <div className="pt-6 border-t border-zinc-800">
                        <p className="text-[#E8620A] text-[10px] font-black uppercase mb-1">Est. Yearly Savings</p>
                        <p className="text-3xl font-black text-white italic">€{stats.annualSavings.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Based on {stats.annualProduction.toFixed(0)} kWh production</p>
                    </div>
                </div>

                <button
                    onClick={generatePDF}
                    disabled={area <= 0}
                    className={`mt-4 py-4 w-full text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border-2 ${area > 0
                        ? 'border-[#E8620A] text-[#E8620A] hover:bg-[#E8620A] hover:text-white'
                        : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                >
                    Download PDF Quote
                </button>
            </div>
        </div>
    );
};

export default SolarMapPicker;