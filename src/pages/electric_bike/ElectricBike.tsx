import { useState, useRef } from 'react';
import { Zap, Navigation, MapPin, Gauge, Clock, Mountain, MoveRight, User, AlertCircle, ShoppingCart } from 'lucide-react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';

interface BikeModel {
  id: string;
  name: string;
  seats: number;
  baseRange: number;
  battery: string;
  desc: string;
}

const BIKES: BikeModel[] = [
  { id: 's', name: 'Model S', seats: 1, baseRange: 80, battery: '500Wh', desc: 'Agile Commuter' },
  { id: 'm', name: 'Model M', seats: 2, baseRange: 120, battery: '750Wh', desc: 'Urban Cruiser' },
  { id: 'l', name: 'Cargo L', seats: 3, baseRange: 160, battery: '1000Wh', desc: 'Heavy Duty Carrier' },
];

const libraries: ("places")[] = ["places"];
const defaultCenter = { lat: 43.0896, lng: -79.0849 };

// Sleek dark map styles for the planner
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#18181b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#18181b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
];

export default function ElectricBike() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const [selectedBike, setSelectedBike] = useState<BikeModel>(BIKES[0]);
  const [loadCount, setLoadCount] = useState<number>(1);
  const [terrain, setTerrain] = useState<'Flat' | 'Hilly'>('Flat');
  const [distance, setDistance] = useState<number>(35);
  
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  const handleBikeSelect = (bike: BikeModel) => {
    setSelectedBike(bike);
    if (loadCount > bike.seats) {
      setLoadCount(bike.seats);
    }
  };

  const calculateRoute = async () => {
    if (originRef.current?.value === '' || destRef.current?.value === '') {
      return;
    }
    const directionsService = new window.google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: originRef.current!.value,
        destination: destRef.current!.value,
        travelMode: window.google.maps.TravelMode.BICYCLING,
      });
      setDirectionsResponse(results);
      
      const distMeters = results.routes[0]?.legs[0]?.distance?.value || 0;
      setDistance(Math.max(1, Math.round(distMeters / 1000)));

      if (map) {
        map.fitBounds(results.routes[0].bounds);
      }
    } catch (error) {
      console.error("Failed to fetch directions", error);
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    if (originRef.current) originRef.current.value = '';
    if (destRef.current) destRef.current.value = '';
  };

  // Math logic
  const terrainMultiplier = terrain === 'Hilly' ? 0.65 : 1.0;
  const loadMultiplier = 1 - ((loadCount - 1) * 0.15);
  const actualMaxRange = selectedBike.baseRange * terrainMultiplier * loadMultiplier;
  
  const batteryConsumption = (distance / actualMaxRange) * 100;
  const remainingBattery = Math.max(0, 100 - batteryConsumption);
  const isOutOfRange = remainingBattery === 0;

  const avgSpeed = terrain === 'Flat' ? 24 : 18;
  const estimatedTimeHours = distance / avgSpeed;
  const hours = Math.floor(estimatedTimeHours);
  const minutes = Math.round((estimatedTimeHours - hours) * 60);

  const elevationGain = terrain === 'Flat' ? Math.round(distance * 2) : Math.round(distance * 15);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (remainingBattery / 100) * circumference;

  return (
    <div className="w-full bg-[#18181b] text-zinc-100 font-sans selection:bg-[#facc15] selection:text-black pb-20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-12 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#facc15] text-[#18181b] flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Zap size={28} className="fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Volta<span className="font-light text-zinc-400">bikes</span></h1>
              <p className="text-xs text-[#facc15] font-medium tracking-widest uppercase mt-0.5">Range Simulator</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Our Fleet</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Technology</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* MAP COLUMN */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="relative w-full h-[60vh] lg:h-[75vh] rounded-[2rem] overflow-hidden border border-zinc-800/60 bg-[#0E0E10] shadow-2xl isolate">
              
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  zoom={12}
                  center={defaultCenter}
                  onLoad={setMap}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: MAP_STYLES,
                    gestureHandling: 'cooperative', // Fixes scroll trapping issues for the overall page!
                  }}
                >
                  {directionsResponse && (
                    <DirectionsRenderer
                      directions={directionsResponse}
                      options={{
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: '#facc15',
                          strokeOpacity: 0.9,
                          strokeWeight: 6,
                        }
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-bold text-zinc-400">
                   Initializing Maps...
                </div>
              )}

              {/* Summary Stats Overlay */}
              <div className="absolute top-6 left-6 right-6 z-30 pointer-events-none">
                <div className="bg-[#18181b]/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl p-4 sm:p-5 flex gap-4 divide-x divide-zinc-700/60 shadow-2xl pointer-events-auto">
                  
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Navigation size={14} />
                      <span className="text-xs uppercase font-medium tracking-wider">Distance</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{distance}<span className="text-zinc-500 font-medium ml-1 text-sm sm:text-base">km</span></span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Clock size={14} />
                      <span className="text-xs uppercase font-medium tracking-wider">Est. Time</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {hours > 0 && <>{hours}<span className="text-zinc-500 font-medium ml-1 mr-2 text-sm sm:text-base">h</span></>}
                      {minutes}<span className="text-zinc-500 font-medium ml-1 text-sm sm:text-base">m</span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Mountain size={14} />
                      <span className="text-xs uppercase font-medium tracking-wider">Elevation</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">+{elevationGain}<span className="text-zinc-500 font-medium ml-1 text-sm sm:text-base">m</span></span>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* CONTROLS COLUMN */}
          <div className="lg:col-span-5 flex flex-col gap-8 bg-[#18181b] p-2">
            
            {/* Header / Intro */}
            <div>
              <h2 className="text-3xl font-light text-white mb-2">Simulate <span className="font-semibold text-[#facc15]">Your Ride</span></h2>
              <p className="text-zinc-400 text-sm">Design your route and fine-tune variables to safely calculate battery consumption upon arrival.</p>
            </div>

            {/* 1. Route Planning with Google Maps Autocomplete */}
            <div className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">1</span> 
                  Route Route Planning
                </span>
                {directionsResponse && (
                  <button onClick={clearRoute} className="text-[#facc15] hover:underline text-[10px]">Clear</button>
                )}
              </label>

              {isLoaded ? (
                <div className="flex flex-col gap-3">
                  <div className="relative z-50">
                    <Autocomplete>
                      <input 
                        type="text" 
                        ref={originRef} 
                        placeholder="Origin Address" 
                        className="w-full h-12 pl-12 pr-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#facc15] shadow-sm"
                      />
                    </Autocomplete>
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                  <div className="relative z-40">
                    <Autocomplete>
                      <input 
                        type="text" 
                        ref={destRef} 
                        placeholder="Destination Address" 
                        className="w-full h-12 pl-12 pr-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#facc15] shadow-sm"
                      />
                    </Autocomplete>
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                  <button 
                    onClick={calculateRoute}
                    className="w-full py-3.5 mt-1 bg-zinc-800 hover:bg-zinc-700 text-[#facc15] font-bold rounded-xl transition-colors text-sm uppercase tracking-wider shadow-md"
                  >
                     Compute Route
                  </button>
                </div>
              ) : (
                <div className="h-[156px] flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-500 shadow-inner">
                   Loading Google Maps Engine...
                </div>
              )}
            </div>

            {/* 2. Bike Selector */}
            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">2</span> 
                Select Model
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BIKES.map(bike => {
                  const isSelected = selectedBike.id === bike.id;
                  return (
                    <button 
                      key={bike.id}
                      onClick={() => handleBikeSelect(bike)}
                      className={`relative p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 overflow-hidden ${
                        isSelected 
                          ? 'bg-[#27272a] border-[#facc15] shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      {isSelected && <div className="absolute top-0 right-0 w-8 h-8 bg-[#facc15] rounded-bl-2xl opacity-10" />}
                      <span className={`font-semibold ${isSelected ? 'text-[#facc15]' : 'text-zinc-300'}`}>{bike.name}</span>
                      <span className="text-xs text-zinc-500">{bike.seats} {bike.seats === 1 ? 'Seat' : 'Seats'}</span>
                      <span className="text-[10px] text-zinc-600 font-medium mt-1 uppercase tracking-wider">{bike.battery}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Grid for Terrain & Load */}
            <div className="grid grid-cols-2 gap-6 border-t border-zinc-800 pt-6">
              
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">3</span> 
                  Passengers
                </label>
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {[1, 2, 3].map((seatNum) => {
                    const isActive = loadCount >= seatNum;
                    const canSelect = seatNum <= selectedBike.seats;
                    
                    return (
                      <button
                        key={seatNum}
                        disabled={!canSelect}
                        onClick={() => setLoadCount(seatNum)}
                        className={`flex-1 py-3 flex items-center justify-center rounded-lg transition-all duration-200 ${
                          !canSelect 
                            ? 'opacity-20 cursor-not-allowed' 
                            : isActive 
                              ? 'bg-[#facc15] text-[#18181b] shadow-md' 
                              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <User size={18} className={isActive ? 'fill-current' : ''} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">4</span> 
                  Elevation
                </label>
                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button 
                    onClick={() => setTerrain('Flat')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-all duration-200 ${
                      terrain === 'Flat' ? 'bg-[#27272a] text-[#facc15] shadow-sm border border-[#facc15]/30' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <MoveRight size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Flat</span>
                  </button>
                  <button 
                    onClick={() => setTerrain('Hilly')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-all duration-200 ${
                      terrain === 'Hilly' ? 'bg-[#27272a] text-[#facc15] shadow-sm border border-[#facc15]/30' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Mountain size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Hilly</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Distance Adjuster (Override map result if desired) */}
            <div className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">5</span> 
                  Manual Distance Simulate
                </label>
                <div className="text-lg font-bold text-[#facc15] bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 shadow-inner">
                  {distance} km
                </div>
              </div>
              
              <div className="relative mt-2">
                <input 
                  type="range" 
                  min="1" 
                  max="150" 
                  step="1"
                  value={distance} 
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-colors accent-[#facc15] focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-bold tracking-wider mt-2 px-1 uppercase">
                  <span>1 km</span>
                  <span>150 km</span>
                </div>
              </div>
            </div>

            {/* 5. Dynamic Result & CTA */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
              
              <div 
                className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-30 ${isOutOfRange ? 'bg-red-500' : 'bg-[#facc15]'}`} 
              />

              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r={radius} 
                    strokeWidth="10" 
                    fill="transparent" 
                    className="stroke-[#18181b]" 
                  />
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r={radius} 
                    strokeWidth="12" 
                    strokeLinecap="round" 
                    fill="transparent" 
                    stroke={isOutOfRange ? '#ef4444' : '#facc15'}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-in-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-3xl sm:text-4xl font-bold tracking-tighter ${isOutOfRange ? 'text-red-500' : 'text-white'}`}>
                    {Math.round(remainingBattery)}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest font-semibold mt-1">Remaining</span>
                </div>
              </div>

              <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-center relative z-10">
                {isOutOfRange ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-red-500 mb-2">
                      <AlertCircle size={20} />
                      <h3 className="font-bold text-lg">Range Exceeded</h3>
                    </div>
                    <p className="text-zinc-400 text-sm">This trip is too long for the {selectedBike.name} under these precise conditions. Try a lighter load, flatter route, or upgrade to a bigger battery.</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h3 className="text-zinc-300 font-medium mb-1 flex items-center justify-center sm:justify-start gap-2">
                      <Gauge size={18} className="text-[#facc15]" /> Estimated Arrival
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      You will arrive at your destination with exactly 
                      <strong className="text-white font-semibold mx-1">
                        {Math.floor(remainingBattery)}%
                      </strong> 
                      battery left, enough for ~{Math.floor(actualMaxRange * (remainingBattery/100))}km more.
                    </p>
                  </div>
                )}
                
                <button className="w-full mt-auto py-3.5 px-6 rounded-xl bg-[#facc15] hover:bg-yellow-400 text-[#18181b] font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] duration-200 shadow-lg shadow-yellow-500/20">
                  <ShoppingCart size={20} className="fill-current" />
                  Order {selectedBike.name}
                </button>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
