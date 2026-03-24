import React, { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, StandaloneSearchBox } from '@react-google-maps/api';

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
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

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
                <div className="absolute top-24 left-6 z-50">
                    <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl ${isDrawingMode
                                ? 'bg-[#E8620A] text-white ring-4 ring-[#E8620A]/20'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isDrawingMode ? 'bg-white animate-pulse' : 'bg-orange-500'}`} />
                        {isDrawingMode ? 'Drawing Active' : 'Start Drawing'}
                    </button>
                </div>

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={19}
                    mapTypeId="satellite"
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
                    {path.length > 0 && (
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

                    {/* Métrica de Ahorro - LA CLAVE PARA EL CLIENTE */}
                    <div className="pt-6 border-t border-zinc-800">
                        <p className="text-[#E8620A] text-[10px] font-black uppercase mb-1">Est. Yearly Savings</p>
                        <p className="text-3xl font-black text-white italic">€{stats.annualSavings.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Based on {stats.annualProduction.toFixed(0)} kWh production</p>
                    </div>
                </div>

                <button
                    onClick={() => { setPath([]); setArea(0); }}
                    className="mt-10 py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all"
                >
                    Clear Design
                </button>
            </div>
        </div>
    );
};

export default SolarMapPicker;