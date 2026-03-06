import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react';
import { DynamicModel } from "./DynamicModel";
gsap.registerPlugin(useGSAP);

interface POIData {
    title: string;
    subtitle: string;
    desc: string;
    pos: { x: number; y: number; z: number };
    color: string;
    img: string;
}

function SceneContent({ customUrl, setSelectedPOI, staticPois }: any) {
    const [dynamicPois, setDynamicPois] = useState<POIData[]>([]);
    const allPois = useMemo(() => {
        const staticArray = Array.isArray(staticPois) ? staticPois : [];
        return [...staticArray, ...dynamicPois];
    }, [staticPois, dynamicPois]);
    const controlsRef = useRef<any>(null!)
    useEffect(() => {
        console.log("Custom Url1: ", customUrl);
    }, [customUrl]);

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                minDistance={15}
                maxDistance={120}
            />

            {customUrl ? (
                <DynamicModel
                    url={customUrl}
                    onPOIsDetected={setDynamicPois}
                />
            ) : (
                <InstancedBuildings count={600} />
            )}

            {/* Terreno base siempre visible o condicional */}
            {!customUrl && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[150, 150, 50, 50]} />
                    <meshStandardMaterial color="#162a4a" roughness={0.9} />
                </mesh>
            )}

            {allPois.map((poi, i) => (
                <POIPin key={i} data={poi} onSelect={setSelectedPOI} />
            ))}
        </>
    );
}

function InstancedBuildings({ count = 600 }) {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    useEffect(() => {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 80
            const z = (Math.random() - 0.5) * 80
            const h = 2 + Math.random() * 8
            const terrainElev = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 + Math.sin(x * 0.05) * 2

            dummy.position.set(x, (h / 2) + terrainElev, z)
            dummy.scale.set(1.8, h, 1.8)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [count, dummy])

    return (
        <instancedMesh ref={meshRef} args={[null!, null!, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#d2b48c" roughness={0.6} />
        </instancedMesh>
    )
}

// --- Componente de Marcador (Pin) ---
function POIPin({ data, onSelect }: { data: any, onSelect: (d: any) => void }) {
    const [hovered, setHover] = useState(false)

    return (
        <group
            position={[data.pos.x, data.pos.y + 8, data.pos.z]}
            onClick={() => onSelect(data)}
            onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHover(false); document.body.style.cursor = 'grab' }}
        >
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[0, 2.5, 0]} scale={hovered ? 1.5 : 1}>
                    <sphereGeometry args={[0.7, 16, 16]} />
                    <meshBasicMaterial color={data.color} />
                </mesh>
                <mesh position={[0, 1.5, 0]} rotation={[Math.PI, 0, 0]} scale={hovered ? 1.5 : 1}>
                    <coneGeometry args={[0.7, 2, 16]} />
                    <meshBasicMaterial color={data.color} />
                </mesh>
            </Float>
        </group>
    )
}

export default function Metropolis() {
    const [selectedPOI, setSelectedPOI] = useState<any>(null)

    const pois = [
        { title: "Puerto Azul", subtitle: "Muelle A", desc: "Zona de carga optimizada.", pos: { x: -25, y: 1, z: -15 }, color: "#ff4400", img: "https://images.unsplash.com/photo-1516108317508-6788f6a160e6?auto=format&fit=crop&w=600" },
        { title: "Centro de Datos", subtitle: "Core", desc: "Infraestructura crítica.", pos: { x: 15, y: 3, z: 10 }, color: "#00ffcc", img: "https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&w=600" }
    ]
    const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
    useEffect(() => {
        console.log("Custom Url2: ", customModelUrl);
    }, [customModelUrl]);
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Limpieza: si ya había un modelo cargado, liberamos la memoria
            if (customModelUrl) {
                URL.revokeObjectURL(customModelUrl);
                setCustomModelUrl(null);
                setSelectedPOI(null);
            }
            const url = URL.createObjectURL(file);
            setCustomModelUrl(url);
            setSelectedPOI(null); // Cerramos cualquier modal abierto
        }
    };

    // Función para volver al mapa procedural
    const resetMap = () => {
        console.log("Resetting map...");
        if (customModelUrl) URL.revokeObjectURL(customModelUrl);
        setCustomModelUrl(null);
        setSelectedPOI(null);
    };

    return (
        <div className="relative w-screen h-screen bg-[#0a192f]">
            {/* UI Overlay Izquierda */}
            <div className="absolute top-10 left-10 z-10 pointer-events-none text-white">
                <h1 className="text-4xl font-bold tracking-tighter uppercase">MARITIME_09_EXT</h1>
                <p className="text-[10px] text-blue-300 tracking-[0.4em] opacity-70">GSAP + R3F HYBRID</p>

                {/* Panel de Carga (ahora con puntero habilitado) */}
                <div className="mt-8 pointer-events-auto flex flex-col gap-2">
                    <label className="group flex items-center gap-3 cursor-pointer">
                        <div className="bg-blue-600/20 group-hover:bg-blue-600/40 border border-blue-500/30 px-4 py-2 rounded-sm transition-all">
                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                {customModelUrl ? "🔄 CAMBIAR MODELO" : "📁 CARGAR .GLB"}
                            </span>
                        </div>
                        <input
                            type="file"
                            accept=".glb,.gltf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>

                    {customModelUrl && (
                        <button
                            onClick={resetMap}
                            className="text-[9px] text-red-400 hover:text-red-300 text-left tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
                        >
                            [ DESACTIVAR MODELO PERSONALIZADO ]
                        </button>
                    )}
                </div>
            </div>

            <Canvas shadows>
                <Stats />
                <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={40} />
                <fogExp2 attach="fog" args={['#0a192f', 0.015]} />
                <ambientLight intensity={1.2} color="#4080ff" />
                <directionalLight position={[50, 100, 50]} intensity={1.8} />

                {/* Movemos la lógica que usa hooks aquí dentro */}
                <SceneContent
                    customUrl={customModelUrl}
                    setSelectedPOI={setSelectedPOI}
                    pois={pois}
                />

                <Environment preset="city" />
            </Canvas>

            {/* Vista de Detalle (HTML) */}
            {selectedPOI && (
                <div className="absolute inset-0 z-20 bg-[#0a192f]/90 backdrop-blur-xl flex flex-col md:flex-row">
                    {/* ... (tu código de modal igual) ... */}
                    <div className="flex-1 p-12 text-white">
                        <h2 className="text-6xl font-bold">{selectedPOI.title}</h2>
                        <button onClick={() => setSelectedPOI(null)} className="mt-8 bg-white text-black px-6 py-2">Volver</button>
                    </div>
                </div>
            )}
        </div>
    )
}