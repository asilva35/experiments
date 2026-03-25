import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, StandaloneSearchBox, Marker } from '@react-google-maps/api';
import { jsPDF } from "jspdf";

interface AddressData {
    street?: string;
    city?: string;
    postcode?: string;
    fullAddress?: string;
}

const containerStyle = { width: '100%', height: '700px' };
const defaultCenter = { lat: 43.0896, lng: -79.0849 }; // Niagara Falls, ON

const ConcreteMapPicker = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: ['drawing', 'geometry', 'places']
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [path, setPath] = useState<any[]>([]);
    const [area, setArea] = useState<number>(0);
    const [thickness, setThickness] = useState<number>(0.1016); // 4 inches default (en metros)
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [mapType, setMapType] = useState<string>('satellite');
    const [address, setAddress] = useState<AddressData | null>(null);
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

    // --- CÁLCULOS DE CONCRETO ---
    const stats = useMemo(() => {
        const volumeM3 = area * thickness;
        const volumeCubicYards = volumeM3 * 1.30795; // Para mercado canadiense/US
        const avgPricePerYard = 150; // Precio estimado
        const totalEstimate = volumeCubicYards * avgPricePerYard;

        return { volumeM3, volumeCubicYards, totalEstimate };
    }, [area, thickness]);

    const generatePDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // Encabezado "Concrete Warriors"
        doc.setFillColor(31, 41, 55); // Dark Gray
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("Concrete Company", 15, 25);

        doc.setFontSize(10);
        doc.text(`Estimate Date: ${date}`, 160, 25);

        doc.setTextColor(17, 17, 17);
        doc.setFontSize(16);
        doc.text("Project Estimate Summary", 15, 55);
        doc.setDrawColor(37, 99, 235); // Blue
        doc.line(15, 60, 80, 60);

        doc.setFontSize(12);
        doc.text(`Location: ${address?.fullAddress || 'Not specified'}`, 15, 75);
        doc.text(`Total Surface: ${area.toFixed(1)} m²`, 15, 85);
        doc.text(`Thickness: ${(thickness * 39.37).toFixed(0)}" inches`, 15, 95);
        doc.text(`Volume Required: ${stats.volumeCubicYards.toFixed(2)} Cubic Yards`, 15, 105);

        doc.setFillColor(243, 244, 246);
        doc.rect(15, 115, 180, 25, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(`TOTAL ESTIMATED COST: USD $${stats.totalEstimate.toLocaleString()}`, 20, 131);

        doc.save(`Concrete_Estimate_ConcreteCompany.pdf`);
    };

    const fetchAddress = useCallback((lat: number, lng: number) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const addr = results[0].address_components;
                setAddress({
                    street: addr.find(c => c.types.includes("route"))?.long_name,
                    city: addr.find(c => c.types.includes("locality"))?.long_name,
                    postcode: addr.find(c => c.types.includes("postal_code"))?.long_name,
                    fullAddress: results[0].formatted_address
                });
            }
        });
    }, []);

    useEffect(() => {
        if (path.length === 1) fetchAddress(path[0].lat, path[0].lng);
    }, [path, fetchAddress]);

    if (!isLoaded) return <div className="p-10 text-center font-bold">Initializing Maps...</div>;

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto bg-[#0f172a] rounded-[40px] overflow-hidden shadow-2xl border border-slate-800">

            <div className="relative flex-1">
                {/* BUSCADOR */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                    <StandaloneSearchBox onLoad={ref => searchBoxRef.current = ref} onPlacesChanged={() => {
                        const loc = searchBoxRef.current?.getPlaces()?.[0].geometry?.location;
                        if (loc && map) { map.panTo(loc); map.setZoom(20); setPath([]); setArea(0); }
                    }}>
                        <input type="text" placeholder="Enter job site address..." className="w-full h-14 px-6 rounded-2xl bg-slate-900/90 border border-slate-700 text-white font-bold outline-none focus:border-blue-500 shadow-2xl" />
                    </StandaloneSearchBox>
                </div>

                {/* CONTROLES */}
                <div className="absolute top-24 left-6 z-50 flex flex-col gap-3">
                    <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`flex items-center gap-3 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl ${isDrawingMode ? 'bg-blue-600 text-white animate-pulse' : 'text-white text-slate-900'}`}>
                        <div className={`w-2 h-2 rounded-full ${isDrawingMode ? 'bg-blue-600 animate-pulse' : 'bg-white'}`} />
                        {isDrawingMode ? 'Marking Area' : 'Start Measuring'}
                    </button>

                    <button style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => { setPath([]); setArea(0); }} className="w-full py-3 text-slate-500 hover:text-white text-[9px] font-bold uppercase transition-all">
                        Reset Map
                    </button>

                    <div className="bg-slate-900/90 p-2 rounded-2xl border border-slate-700 flex flex-col gap-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase px-2">Thickness (Depth)</p>
                        <div className="flex gap-1">
                            <button onClick={() => setThickness(0.1016)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${thickness === 0.1016 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>4"</button>
                            <button onClick={() => setThickness(0.1524)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${thickness === 0.1524 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>6"</button>
                        </div>
                    </div>

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
                    zoom={18}
                    mapTypeId={mapType as any}
                    onLoad={setMap}
                    onClick={(e) => {
                        if (!isDrawingMode || !e.latLng) return;
                        const newPath = [...path, { lat: e.latLng.lat(), lng: e.latLng.lng() }];
                        setPath(newPath);
                        if (newPath.length > 2) {
                            setArea(window.google.maps.geometry.spherical.computeArea(newPath.map(p => new google.maps.LatLng(p.lat, p.lng))));
                        }
                    }}
                    options={{ tilt: 0, disableDefaultUI: true, zoomControl: true, draggableCursor: isDrawingMode ? 'crosshair' : 'grab' }}
                >
                    {path.map((point, index) => (
                        <Marker key={index} position={point} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: "#2563eb", fillOpacity: 1, strokeWeight: 2, strokeColor: "#FFFFFF" }} />
                    ))}
                    {path.length > 2 && <Polygon path={path} options={{ fillColor: "#3b82f6", fillOpacity: 0.4, strokeColor: "#2563eb", strokeWeight: 3 }} />}
                </GoogleMap>
            </div>

            {/* SIDEBAR */}
            <div className="w-full lg:w-80 bg-[#0f172a] p-8 flex flex-col border-l border-slate-800 text-white">
                <div className="mb-8 border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-black italic tracking-tighter">Concrete Company</h2>
                    <p className="text-blue-500 text-[9px] font-bold uppercase">Estimator Pro v2.0</p>
                </div>

                <div className="space-y-6 flex-1">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Surface Area</p>
                        <p className="text-3xl font-black">{area.toFixed(1)} <span className="text-sm text-blue-500 font-normal">m²</span></p>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Volume Required</p>
                        <p className="text-2xl font-black">{stats.volumeCubicYards.toFixed(2)} <span className="text-xs text-slate-400 font-normal">yd³</span></p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">~{stats.volumeM3.toFixed(2)} cubic meters</p>
                    </div>

                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        <p className="text-blue-500 text-[10px] font-bold uppercase mb-1">Estimated Quote</p>
                        <p className="text-3xl font-black italic">${stats.totalEstimate.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 mt-2">*Prices may vary based on finishing and reinforcements.</p>
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <button onClick={generatePDF} disabled={area <= 0} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Get Professional Quote
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConcreteMapPicker;