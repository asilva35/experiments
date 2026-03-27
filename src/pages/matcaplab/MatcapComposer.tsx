import { Suspense, useMemo, useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Stats, Float, useTexture, Center } from '@react-three/drei';
import { useControls, folder, button } from 'leva';
import * as THREE from 'three';
import type { GLTF } from 'three-stdlib'
import { GLTFExporter } from 'three-stdlib';

interface GLTFResult extends GLTF {
    nodes: { [key: string]: THREE.Object3D }
    materials: { [key: string]: THREE.Material }
}

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

// --- COMPONENTE DEL MODELO DINÁMICO ---
function DynamicModel({ url, meshConfigs, fog }: any) {
    const { scene } = useGLTF(url) as GLTFResult
    const textures = useTexture(matcapTextures);

    // Creamos un pool de materiales para no duplicar en memoria
    const materialPool = useMemo(() => {
        const pools: any = {};
        Object.keys(matcapTextures).forEach((key) => {
            const tex = textures[key as keyof typeof textures];
            tex.colorSpace = THREE.SRGBColorSpace;
            pools[key] = new THREE.MeshMatcapMaterial({
                matcap: tex,
                fog: fog,
                transparent: true
            });
        });
        return pools;
    }, [textures, fog]);

    useLayoutEffect(() => {
        scene.traverse((node: any) => {
            if (node.isMesh) {
                // Buscamos si hay una configuración para este mesh específico
                const matKey = meshConfigs[node.name] || 'plasticWhite';
                node.userData.matcap = matKey;
                node.material = materialPool[matKey];
                node.material.needsUpdate = true;
                node.castShadow = false;
                node.receiveShadow = false;
            }
        });
    }, [scene, meshConfigs, materialPool]);

    return (
        <Center top>
            <primitive object={scene} scale={2} />
        </Center>
    );
}

export default function MatcapComposer() {
    //const [modelUrl, setModelUrl] = useState('/models/gltf/chichen-itza.glb');
    const modelUrl = '/models/gltf/electric-bike.glb';
    const [meshList, setMeshList] = useState<string[]>([]);
    const [meshConfigs, setMeshConfigs] = useState<Record<string, string>>({});

    // 💡 REFERENCIA CRÍTICA: Para que el exportador siempre vea el dato real
    const configRef = useRef(meshConfigs);
    useEffect(() => {
        configRef.current = meshConfigs;
    }, [meshConfigs]);

    // 1. CARGA INICIAL Y DETECCIÓN DE MESHES
    const { scene } = useGLTF(modelUrl);

    useEffect(() => {
        const names: string[] = [];
        scene.traverse((node: any) => {
            if (node.isMesh && node.name) names.push(node.name);
        });
        const uniqueNames = Array.from(new Set(names));
        setMeshList(uniqueNames);

        // Inicializar configuración si está vacía
        setMeshConfigs(prev => {
            const next = { ...prev };
            uniqueNames.forEach(name => {
                if (!next[name]) next[name] = 'plasticWhite';
            });
            return next;
        });
    }, [scene]);

    // 2. INTERFAZ DINÁMICA CON LEVA
    const { activeFog, fogColor } = useControls({
        'Atmósfera (Fog)': folder({
            activeFog: true,
            fogColor: '#08080a',
        }),
    });

    // Controles dinámicos para cada Mesh detectado
    useControls('Materiales por Mesh', () => {
        const controls: any = {};
        meshList.forEach((name) => {
            controls[name] = {
                value: meshConfigs[name] || 'plasticWhite',
                options: Object.keys(matcapTextures),
                onChange: (value: string) => {
                    // Solo actualizamos si el valor realmente cambió
                    setMeshConfigs(prev => {
                        if (prev[name] === value) return prev;
                        return { ...prev, [name]: value };
                    });
                }
            };
        });
        return controls;
    }, [meshList]);

    // 3. FUNCIONES DE IMPORT / EXPORT
    useControls('Sistema de Configuración', {
        'Exportar JSON': button(() => {
            const dataToExport = {
                modelUrl,
                meshConfigs: configRef.current
            };
            const data = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'config-composer.json';
            link.click();
        }),
        'Importar Configuración': button(() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e: any) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (imported.meshConfigs) {
                            setMeshConfigs(imported.meshConfigs);
                        }
                    } catch (err) {
                        alert("Error al leer el archivo JSON");
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }),
        'Exportar GLB con Metadatos': button(() => {
            const exporter = new GLTFExporter();

            // 💡 PASO 1: Inyectar la configuración en el userData de cada mesh
            scene.traverse((node: any) => {
                if (node.isMesh) {
                    if (!node.userData.matcap) {
                        node.userData.matcap = meshConfigs[node.name] || 'plasticWhite';
                    }
                }
            });

            // 💡 PASO 2: Exportar el binario
            exporter.parse(
                scene,
                (result: any) => {
                    const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'chichen-itza-edited.glb';
                    link.click();
                },
                (error: any) => { console.error('Error al exportar GLB:', error); },
                { binary: true } // Exportar como .glb (binario) en lugar de .gltf (texto)
            );
        })
    });

    return (
        <div className="w-full h-screen bg-[#0c0c0e] relative">
            <Stats className="absolute top-0 left-0 z-50" />

            <Canvas dpr={[1, 2]} camera={{ position: [10, 8, 12], fov: 40 }}>
                <color attach="background" args={[fogColor]} />
                {activeFog && <fog attach="fog" args={[fogColor, 10, 50]} />}

                <OrbitControls makeDefault />

                <Float speed={0.5} rotationIntensity={0.1}>
                    <Suspense fallback={<Html center>Cargando Modelo...</Html>}>
                        <DynamicModel
                            url={modelUrl}
                            meshConfigs={meshConfigs}
                            fog={activeFog}
                        />
                    </Suspense>
                </Float>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute bottom-8 left-8 p-6 bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl z-10">
                <h1 className="text-white font-black italic">Matcap Composer v1</h1>
                <p className="text-zinc-500 text-[9px] uppercase tracking-tighter">Visual Material Editor</p>
            </div>
        </div>
    );
}