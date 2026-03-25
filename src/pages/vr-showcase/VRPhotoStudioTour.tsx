import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Billboard, PerspectiveCamera } from '@react-three/drei';

// --- CONFIGURACIÓN DE ESCENAS (Un flujo lógico de 5 estudios) ---
const scenesConfig: any = {
    brown_studio: {
        name: "Brown Photo Studio",
        hdrPath: '/hdri/brown_photostudio_02_2k.hdr',
        hotspots: [
            { position: [5, -1, -3], label: 'To Ferndale Studio 📷', targetScene: 'ferndale_studio' },
            { position: [-5, -1, 4], label: 'To Monochrome Studio 📷', targetScene: 'monochrome_studio' }
        ]
    },
    ferndale_studio: {
        name: "Ferndale Studio",
        hdrPath: '/hdri/ferndale_studio_11_2k.hdr',
        hotspots: [
            { position: [-5, -1, 3], label: '⬅️ Back to Brown Studio', targetScene: 'brown_studio' },
            { position: [4, -1, 5], label: 'To Kominka Studio 📷', targetScene: 'kominka_studio' }
        ]
    },
    monochrome_studio: {
        name: "Monochrome Studio",
        hdrPath: '/hdri/monochrome_studio_02_2k.hdr',
        hotspots: [
            { position: [5, -1, -4], label: '⬅️ Back to Brown Studio', targetScene: 'brown_studio' },
            { position: [-6, -0.5, 3], label: 'To Wooden Studio 📷', targetScene: 'wooden_studio' }
        ]
    },
    kominka_studio: {
        name: "Studio Kominka",
        hdrPath: '/hdri/studio_kominka_02_2k.hdr',
        hotspots: [
            { position: [-4, -1, -5], label: '⬅️ Back to Ferndale Studio', targetScene: 'ferndale_studio' },
            { position: [6, -1, 2], label: 'To Wooden Studio 📷', targetScene: 'wooden_studio' }
        ]
    },
    wooden_studio: {
        name: "Wooden Studio",
        hdrPath: '/hdri/wooden_studio_09_2k.hdr',
        hotspots: [
            { position: [6, -1, -3], label: '⬅️ Back to Monochrome Studio', targetScene: 'monochrome_studio' },
            { position: [-6, -1, -2], label: '⬅️ Back to Studio Kominka', targetScene: 'kominka_studio' }
        ]
    }
};

// --- COMPONENTE DE HOTSPOT (Flecha Clickable - AHORA AZUL) ---
function Hotspot({ position, label, onClick }: any) {
    const [hovered, setHovered] = useState(false);

    // En producción, aquí usarías un mesh con textura de flecha 📷
    return (
        <Billboard
            position={position}
            follow={true}
            lockX={false} lockY={false} lockZ={false} // Siempre mirando a cámara
        >
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={onClick}
            >
                <circleGeometry args={[0.2, 32]} />
                <meshBasicMaterial
                    color={hovered ? "#3b82f6" : "#2563eb"} // 💡 Azul Brillante / Azul Acero
                    transparent
                    opacity={0.8}
                />
                {/* Etiqueta flotante */}
                <Html distanceFactor={10} position={[0, 0.7, 0]}>
                    <div style={{
                        color: 'white',
                        background: hovered ? '#2563eb' : 'rgba(0,0,0,0.6)', // 💡 Azul Acero
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'sans-serif',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        {label}
                    </div>
                </Html>
            </mesh>
        </Billboard>
    );
}

// --- COMPONENTE DEL VISUALIZADOR VR (Inside Canvas) ---
function VRScene({ currentSceneKey, changeScene }: any) {
    const currentScene = scenesConfig[currentSceneKey];

    return (
        <>
            <color attach="background" args={['#111']} />

            <PerspectiveCamera makeDefault position={[0, 0, 1]} fov={55} />

            {/* 🖱️ Controles de cámara suaves */}
            <OrbitControls
                enablePan={false} // Solo rotar
                enableZoom={true}
                minDistance={1}
                maxDistance={10}
                autoRotate={false}
                zoomSpeed={0.5}
                rotateSpeed={-0.3} // Dirección natural
            />

            {/* 🌎 Carga del HDR como fondo panorámico */}
            <Suspense fallback={<Html center><div className="text-white">Loading Panorama...</div></Html>}>
                <Environment
                    files={currentScene.hdrPath}
                    background={true} // Usar HDR como fondo
                    blur={0} // Sin desenfoque
                />
            </Suspense>

            {/* 📍 Puntos de clic (Hotspots) para cambiar de escena */}
            {currentScene.hotspots.map((spot: any, index: number) => (
                <Hotspot
                    key={index}
                    position={spot.position}
                    label={spot.label}
                    onClick={() => changeScene(spot.targetScene)} // 💡 Usar función de transición
                />
            ))}
        </>
    );
}

// --- EXPORT DEFAULT (Full Page Layout) ---
export default function VRPhotoStudioTour() {
    const [currentSceneKey, setCurrentSceneKey] = useState('brown_studio');
    const [isTransitioning, setIsTransitioning] = useState(false); // 💡 Estado de transición

    // 💡 --- FUNCIÓN CON EFECTO DE FUNDE A NEGRO ---
    const changeScene = (newSceneKey: string) => {
        setIsTransitioning(true); // Empezar fundido
        setTimeout(() => {
            setCurrentSceneKey(newSceneKey);
            setIsTransitioning(false); // Quitar fundido
        }, 500); // Duración de la transición (igual que el CSS)
    };

    return (
        <div className="w-full h-screen bg-[#0c0c0e] flex flex-col lg:flex-row font-sans text-white overflow-hidden relative">

            {/* 💡 --- CAPA DE TRANSICIÓN (Funde a Negro) --- */}
            <div
                className={`absolute inset-0 bg-black z-[100] pointer-events-none transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* PANEL LATERAL DE INFORMACIÓN (HTML genérico) */}
            <div className="w-full lg:w-96 bg-[#111] p-10 flex flex-col border-r border-zinc-800 z-10 relative">
                <div className="mb-10">
                    <h2 className="text-[#2563eb] font-black text-2xl italic leading-none">VR PHOTO STUDIOS</h2>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Niagara Region | VR Tour</p>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {/* Active Location */}
                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        <p className="text-blue-500 text-[10px] font-black uppercase mb-1">Current Studio</p>
                        <h3 className="text-white font-black text-sm">{scenesConfig[currentSceneKey].name}</h3>
                    </div>

                    {/* Company Info */}
                    <div>
                        <label className="text-zinc-500 text-[10px] font-black uppercase mb-3 block">About the Tour</label>
                        <p className="text-zinc-300 text-xs leading-relaxed">
                            Explore professional photography studio spaces available in the Niagara Region. Experience 360° views of each location, complete with concrete floors, high-end lighting, and flexible setups. Click the floating hotspots to move between studios.
                        </p>
                    </div>

                    {/* Message Section */}
                    <div className="pt-6 border-t border-zinc-800">
                        <label className="text-zinc-500 text-[10px] font-black uppercase mb-3 block">Request Info</label>
                        <form className="space-y-4">
                            <input type="text" placeholder="Your Name" className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs" />
                            <input type="email" placeholder="Email" className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs" />
                            <textarea placeholder="Inquiry" className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs h-24" />
                            <button type="submit" className="w-full py-3 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors">
                                Send Inquiry
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-10 pt-4 border-t border-zinc-800 italic">
                    <p className="text-[9px] text-zinc-400 text-center">Drag to look around. Click hotspots to navigate.</p>
                </div>
            </div>

            {/* ÁREA DEL CANVAS VR */}
            <div className="relative flex-1">
                <Canvas gl={{ antialias: true }}>
                    <VRScene
                        currentSceneKey={currentSceneKey}
                        changeScene={changeScene} // 💡 Pasar función de transición
                    />
                </Canvas>
            </div>
        </div>
    );
}