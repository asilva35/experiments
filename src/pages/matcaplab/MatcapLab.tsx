import { Suspense, useMemo, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Stats, Float, useTexture, Center } from '@react-three/drei';
import { useControls, folder } from 'leva';
import * as THREE from 'three';

const matcapTextures = {
    gold: '/textures/matcaps/gold.png',
    plastic: '/textures/matcaps/plastic-white.png',
    emerald: '/textures/matcaps/emerald.png',
};

// --- COMPONENTE DEL MODELO (Aplica MatCap Dinámico) ---
function ChichenItzaMatcap({ selectedMatcap, opacity, fog }: { selectedMatcap: string, opacity: number, fog: boolean }) {
    const { scene } = useGLTF('/models/gltf/chichen-itza.glb');
    const textures = useTexture(matcapTextures);

    const matcapMaterial = useMemo(() => {
        const texture = textures[selectedMatcap as keyof typeof textures];

        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
        }

        return new THREE.MeshMatcapMaterial({
            matcap: texture,
            side: THREE.FrontSide,
            fog: fog,
            transparent: true,
            opacity: opacity,
        });
    }, [selectedMatcap, textures, fog, opacity]);

    const emeraldMaterial = useMemo(() => {
        const texture = textures['emerald'];

        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
        }

        return new THREE.MeshMatcapMaterial({
            matcap: texture,
            side: THREE.FrontSide,
            fog: fog,
            transparent: true,
            opacity: opacity,
        });
    }, [selectedMatcap, textures, fog, opacity]);

    useLayoutEffect(() => {
        scene.traverse((node: any) => {
            if (node.isMesh) {
                node.material = (node.name === "emerald") ? emeraldMaterial : matcapMaterial;
                node.material.needsUpdate = true;
                // Forzar la desactivación de cálculos de sombra
                node.castShadow = false;
                node.receiveShadow = false;
                // Optimización de frustum culling
                node.frustumCulled = true;
            }
        });
    }, [scene, matcapMaterial]);

    return (
        <Center top> {/* Centra el modelo automáticamente sobre el origen */}
            <primitive object={scene} scale={2.8} position={[0, 0, 0]} />
        </Center>
    );
}

// --- ESCENA PRINCIPAL ---
export default function MatcapLab() {

    // 💡 CONTROLES PARA LA NIEBLA
    const { activeFog, fogColor, fogNear, fogFar } = useControls({
        'Atmósfera (Fog)': folder({
            activeFog: true,
            fogColor: '#08080a', // Debe ser igual o similar al fondo
            fogNear: { value: 50, min: 0, max: 50 },
            fogFar: { value: 100, min: 10, max: 100 },
        }),
    });

    // 💡 CONFIGURACIÓN DE LEVA (Selector de Material Simple)
    const { selectedMatcap, opacity } = useControls({
        'Selección de Material': folder({
            selectedMatcap: {
                label: 'MatCap',
                //USE matcapTextures keys
                options: {
                    ...Object.keys(matcapTextures).reduce((acc, key) => {
                        acc[key] = key;
                        return acc;
                    }, {} as Record<string, string>),
                },
                value: 'gold' // Oro por defecto
            },
            opacity: { value: 1, min: 0, max: 1 },
        }),
    });

    return (
        <div className="w-full h-screen bg-[#0c0c0e] relative font-sans">
            {/* Stats de performance (Imprescindible para demostrar fluidez) */}
            <Stats className="absolute top-0 left-0 z-50" />

            {/* Canvas de Three.js */}
            <Canvas
                dpr={[1, 2]}
                shadows={false}
                camera={{ position: [10, 8, 12], fov: 40 }}
                gl={{
                    antialias: true, // Puedes ponerlo en false para +60fps en móviles gama baja
                    powerPreference: "high-performance",
                    stencil: false, // No lo necesitamos para MatCaps
                    depth: true,
                    alpha: false, // Fondo opaco es más rápido de renderizar
                }}
            >
                {activeFog && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
                <color attach="background" args={['#08080a']} />

                {/* Controles de cámara suaves */}
                <OrbitControls
                    makeDefault
                    minDistance={6}
                    maxDistance={60}
                    enablePan={true}
                    zoomSpeed={0.8}
                    rotateSpeed={0.6}
                />

                {/* Float: Pequeña animación de flotación para dar dinamismo */}
                <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
                    {/* Modelo envuelto en Suspense */}
                    <Suspense fallback={<Html center className="text-white text-xs">Cargando Chichen Itza y MatCaps...</Html>}>
                        <ChichenItzaMatcap selectedMatcap={selectedMatcap} opacity={opacity} fog={activeFog} />
                    </Suspense>
                </Float>

            </Canvas>

            {/* UI Overlay Informativa (Faisan Dev Style) */}
            <div className="absolute bottom-8 left-8 p-7 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] z-10 max-w-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                    <h1 className="text-xl font-black text-white italic">MATCAP LAB</h1>
                </div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Ultra-High Performance Rendering</p>
                <div className="mt-5 text-[11px] text-zinc-300 leading-relaxed space-y-2">
                    <p>This experiment uses <span className="text-blue-400 font-bold">MeshMatcapMaterial</span>. Lighting and reflections are pre-rendered in a spherical texture.</p>
                    <p>This allows rendering complex models like Chichen Itza with almost zero GPU load, ideal for mobile devices and fluid AR/VR experiences.</p>
                </div>
            </div>
        </div>
    );
}