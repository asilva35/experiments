import { Suspense, useLayoutEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Stats, Center, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const matcapTextures = {
    gold: '/textures/matcaps/gold.png',
    emerald: '/textures/matcaps/emerald.png',
    rubberBlack: '/textures/matcaps/rubber-black.png',
    plasticWhite: '/textures/matcaps/plastic-white.png',
    polishedMetal: '/textures/matcaps/polished-metal.png',
    plasticBlue: '/textures/matcaps/plastic-blue.png',
    plasticBlack: '/textures/matcaps/plastic-black.png',
    leatherGray: '/textures/matcaps/leather-gray.png',
    leatherBlack: '/textures/matcaps/leather-black.png',
};

function SmartChichenItza() {
    // 💡 Cargamos el modelo que ya tiene los userData inyectados
    const { scene } = useGLTF('/models/gltf/electric-bike-edited.glb');
    const textures = useTexture(matcapTextures);

    // Pool de materiales para asignar según el metadato
    const materialPool = useMemo(() => {
        const pools: any = {};
        Object.keys(matcapTextures).forEach((key) => {
            const tex = textures[key as keyof typeof textures];
            tex.colorSpace = THREE.SRGBColorSpace;
            pools[key] = new THREE.MeshMatcapMaterial({ matcap: tex, fog: true });
        });
        return pools;
    }, [textures]);

    useLayoutEffect(() => {
        scene.traverse((node: any) => {
            if (node.isMesh) {
                // 💡 REVISAR METADATOS:
                // Si el mesh tiene el metadato 'matcap', usamos ese. Si no, default a plástico.
                const savedMatcap = node.userData.matcap;
                console.log(node.name, node.userData);
                if (savedMatcap && materialPool[savedMatcap]) {
                    node.material = materialPool[savedMatcap];
                } else {
                    node.material = materialPool['plasticWhite'];
                }
            }
        });
    }, [scene, materialPool]);

    return (
        <Center top>
            <primitive object={scene} scale={2.8} />
        </Center>
    );
}

export default function SmartLoaderExperiment() {
    return (
        <div className="w-full h-screen bg-[#050505] relative">
            <Stats className="absolute top-0 left-0 z-50" />

            <Canvas dpr={[1, 2]} camera={{ position: [12, 10, 12], fov: 35 }}>
                <color attach="background" args={['#f3f3f3ff']} />
                {/* <fog attach="fog" args={['#050505', 10, 50]} /> */}

                <OrbitControls makeDefault />

                <Suspense fallback={<Html center className="text-white">Leyendo metadatos del GLB...</Html>}>
                    <SmartChichenItza />
                </Suspense>
            </Canvas>

            {/* UI Informativa */}
            <div className="absolute bottom-8 left-8 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                <h1 className="text-white font-bold tracking-tighter">SMART GLB LOADER</h1>
                <p className="text-blue-400 text-[10px] uppercase font-black">Metadata-Driven Rendering</p>
                <p className="text-zinc-500 text-[11px] mt-2 max-w-[200px]">
                    This model was configured by the Matcap Composer. It detects the <b>userData</b> tags and assigns the corresponding MatCaps.
                </p>
            </div>
        </div>
    );
}