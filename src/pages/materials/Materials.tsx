import { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, Stats, Float } from '@react-three/drei';
import { useControls, folder } from 'leva';
import * as THREE from 'three';

// --- DEFINICIÓN DE MATERIALES (Configuración de MeshPhysicalMaterial) ---
const materialsConfig: any = {
    steel: {
        name: "Polished Steel",
        description: "High metalness, low roughness, strong reflections.",
        color: "#d1d5db", // Gris claro
        metalness: 1.0,
        roughness: 0.1, // Muy pulido
        clearcoat: 0.2,
        clearcoatRoughness: 0.1
    },
    plastic: {
        name: "Glossy Plastic",
        description: "Moderate roughness, low metalness, strong specular highlight.",
        color: "#3b82f6", // Azul vibrante
        metalness: 0.0,
        roughness: 0.2, // Un poco más difuso
        reflectivity: 0.7
    },
    glass: {
        name: "Clear Glass",
        description: "Transparency with thickness, low metalness, high transmission.",
        color: "#ffffff", // Puro blanco
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0, // Vidrio puro
        thickness: 0.5,
        ior: 1.5, // Índice de refracción
        attenuationDistance: 0.5,
        attenuationColor: '#ffffff',
    },
    ceramic: {
        name: "Glazed Ceramic",
        description: "Opaque, low metalness, high clearcoat for gloss.",
        color: "#f3f4f6", // Off-white
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 1.0, // Capa de esmalte
        clearcoatRoughness: 0.1
    },
    stone: {
        name: "Ancient Stone",
        description: "Matte, high roughness, low metalness, matte reflections.",
        color: "#71717a", // Gris piedra
        metalness: 0.0,
        roughness: 0.8, // Muy áspero
    },
    diamond: {
        name: "Faceted Diamond",
        description: "Extremely low roughness, extremely high IOR, low metalness.",
        color: "#ffffff",
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        ior: 2.4, // IOR del diamante (¡esto es la clave!)
        thickness: 0.1,
        specularColor: '#ffffff',
        specularIntensity: 2.0
    }
};

// --- COMPONENTE DEL MODELO (Aplica el material dinámico) ---
function ChichenItzaModel({ materialKey, materialProps }: { materialKey: string, materialProps: any }) {
    // 💡 Asegúrate de tener el archivo en /public/models/chichen-itza.glb
    const { scene } = useGLTF('/models/gltf/chichen-itza.glb');
    // const materialProps = materialsConfig[materialKey];

    const material = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            ...materialProps,
            transparent: materialKey === 'glass' || materialKey === 'diamond',
            side: THREE.DoubleSide,
        });
    }, [materialProps]);

    // Recorremos la escena y aplicamos el material a todos los meshes
    scene.traverse((node: any) => {
        if (node.isMesh) {
            node.material = material;
            node.castShadow = true;
            node.receiveShadow = true;
            // node.material = new THREE.MeshPhysicalMaterial({
            //     ...materialProps,
            //     transparent: materialKey === 'glass' || materialKey === 'diamond',
            //     side: THREE.DoubleSide // Para ver el vidrio/diamante por dentro
            // });
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <primitive object={scene} scale={2.0} position={[0, -1, 0]} />
        </Float>
    );
}

// --- COMPONENTE DEL VISUALIZADOR (Inside Canvas) ---
function MaterialViz({ materialKey, materialProps }: { materialKey: string, materialProps: any }) {
    return (
        <>
            <color attach="background" args={['#0c0c0e']} />

            {/* 💡 --- LA LUZ ES CLAVE PARA MATERIALES FÍSICOS --- */}
            {/* <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
            <spotLight position={[-10, -10, -10]} intensity={0.8} angle={0.15} penumbra={1} color="#ffffff" castShadow /> */}

            {/* OrbitControls con suavizado */}
            <OrbitControls enablePan={true} enableZoom={true} minDistance={5} maxDistance={20} autoRotate={false} />

            {/* 💡 --- ENVIRONMENT MAP (Crucial para reflejos y refracciones) --- */}
            <Suspense fallback={<Html center><div className="text-white">Loading Environment...</div></Html>}>
                <Environment
                    preset="city" // Options: night, dawn, noon, forest, studio, city, park, sunset
                    background={false} // Usar como fondo para refracciones
                    blur={0.9}
                />
            </Suspense>

            {/* Chichen Itza con el material seleccionado */}
            <Suspense fallback={<Html center><div className="text-white">Loading Model...</div></Html>}>
                <ChichenItzaModel materialKey={materialKey} materialProps={materialProps} />
            </Suspense>
        </>
    );
}

// --- EXPORT DEFAULT (Full Page Layout con UI) ---
export default function ChichenItzaLab() {
    const [materialKey, setMaterialKey] = useState('steel');

    const materialProps = useControls({
        'Material Base': folder({
            color: '#ffffff',
            emissive: '#000000',
            roughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
            metalness: { value: 1.0, min: 0, max: 1, step: 0.01 },
            reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
            ior: { value: 1.5, min: 1, max: 2.33, step: 0.01 }, // Index of Refraction
        }),
        'Efectos Avanzados': folder({
            transmission: { value: 0, min: 0, max: 1, step: 0.01 }, // Para Vidrio/Diamante
            thickness: { value: 0, min: 0, max: 5 },
            clearcoat: { value: 0, min: 0, max: 1, step: 0.01 }, // Barniz
            clearcoatRoughness: { value: 0, min: 0, max: 1, step: 0.01 },
            sheen: { value: 0, min: 0, max: 1, step: 0.01 }, // Para telas/terciopelo
            iridescence: { value: 0, min: 0, max: 1, step: 0.01 },
        }),
    });

    return (
        <div className="w-full h-screen bg-[#0c0c0e] flex flex-col lg:flex-row font-sans text-white overflow-hidden relative">

            {/* PANEL DE CONTROL DE MATERIALES (IZQUIERDA) */}
            <div className="w-full lg:w-96 bg-[#111] p-10 flex flex-col border-r border-zinc-800 z-10 relative">
                <div className="mb-10 border-b border-blue-500/20 pb-4">
                    <h2 className="text-[#3b82f6] font-black text-2xl italic leading-none">FAISAN DEV</h2>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Chichen Itza | Material Lab</p>
                </div>

                <div className="space-y-4 flex-1">
                    {Object.keys(materialsConfig).map((key) => {
                        const mat = materialsConfig[key];
                        return (
                            <button
                                key={key}
                                onClick={() => setMaterialKey(key)}
                                className={`w-full text-left p-5 rounded-2xl transition-all border ${materialKey === key ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-black text-sm">{mat.name}</h4>
                                    <div style={{ backgroundColor: mat.color }} className="w-4 h-4 rounded-full border border-zinc-700"></div>
                                </div>
                                <p className="text-[10px] leading-relaxed text-zinc-500">{mat.description}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 pt-4 border-t border-zinc-800 italic">
                    <p className="text-[9px] text-zinc-400 text-center">Use mouse to rotate. Select a material to apply.</p>
                </div>
            </div>

            {/* ÁREA DEL CANVAS VR */}
            <div className="relative flex-1">
                {/* 💡 --- STATS DE PERFOMANCE --- */}
                <Stats className="absolute top-4 right-4 z-[100]" />

                <Canvas gl={{ antialias: true, logarithmicDepthBuffer: true }}>
                    <MaterialViz materialKey={materialKey} materialProps={materialProps} />
                </Canvas>
            </div>
        </div>
    );
}