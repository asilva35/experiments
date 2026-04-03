import { Suspense, useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Stats, useTexture, Center } from '@react-three/drei';
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
    mateGray: '/textures/matcaps/mate-gray.png',
    mateWhite: '/textures/matcaps/mate-white.png',
    brillantBlue: '/textures/matcaps/brillant-blue.png',
};

// --- COMPONENTE DEL MODELO DINÁMICO ---
function DynamicModel({ url, meshConfigs, fog }: any) {
    const { scene } = useGLTF(url) as GLTFResult
    const textures = useTexture(matcapTextures);
    const materialsRef = useRef<Record<string, THREE.MeshMatcapMaterial>>({});

    useLayoutEffect(() => {
        scene.traverse((node: any) => {
            if (node.isMesh) {
                const config = meshConfigs[node.name] || {
                    matcap: 'plasticWhite',
                    color: '#ffffff',
                    transparent: false,
                    opacity: 1
                };
                const { matcap, color, transparent, opacity } = config;

                // Si no existe el material para este mesh, lo creamos
                if (!materialsRef.current[node.name]) {
                    materialsRef.current[node.name] = new THREE.MeshMatcapMaterial();
                }

                const mat = materialsRef.current[node.name];
                const tex = textures[matcap as keyof typeof textures];
                if (tex) {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    mat.matcap = tex;
                }

                mat.color.set(color);
                mat.transparent = transparent;
                mat.opacity = opacity;
                mat.fog = fog;
                mat.needsUpdate = true;

                node.material = mat;
                node.userData.matcap = matcap;
                node.userData.color = color;
                node.userData.transparent = transparent;
                node.userData.opacity = opacity;
                node.castShadow = false;
                node.receiveShadow = false;
            }
        });
    }, [scene, meshConfigs, textures, fog]);

    return (
        <Center top>
            <primitive object={scene} scale={2} />
        </Center>
    );
}

export default function MatcapComposer() {
    const modelUrl = '/models/gltf/sports_bike.glb';
    const [meshList, setMeshList] = useState<string[]>([]);
    type MeshConfig = {
        matcap: string;
        color: string;
        transparent: boolean;
        opacity: number;
    };

    const [meshConfigs, setMeshConfigs] = useState<Record<string, MeshConfig>>({});

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
                if (!next[name]) next[name] = {
                    matcap: 'plasticWhite',
                    color: '#ffffff',
                    transparent: false,
                    opacity: 1
                };
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
    const [, setControls] = useControls('Materiales por Mesh', () => {
        const controls: any = {};
        meshList.forEach((name) => {
            controls[name] = folder({
                [`matcap_${name}`]: {
                    label: 'Matcap',
                    value: meshConfigs[name]?.matcap || 'plasticWhite',
                    options: Object.keys(matcapTextures),
                    onChange: (value: string) => {
                        setMeshConfigs(prev => {
                            const current = prev[name] || { matcap: 'plasticWhite', color: '#ffffff', transparent: false, opacity: 1 };
                            if (current.matcap === value) return prev;
                            return {
                                ...prev,
                                [name]: { ...current, matcap: value }
                            };
                        });
                    }
                },
                [`color_${name}`]: {
                    label: 'Color',
                    value: meshConfigs[name]?.color || '#ffffff',
                    onChange: (value: string) => {
                        setMeshConfigs(prev => {
                            const current = prev[name] || { matcap: 'plasticWhite', color: '#ffffff', transparent: false, opacity: 1 };
                            if (current.color === value) return prev;
                            return { ...prev, [name]: { ...current, color: value } };
                        });
                    }
                },
                [`transparent_${name}`]: {
                    label: 'Transparent',
                    value: meshConfigs[name]?.transparent ?? false,
                    onChange: (value: boolean) => {
                        setMeshConfigs(prev => {
                            const current = prev[name] || { matcap: 'plasticWhite', color: '#ffffff', transparent: false, opacity: 1 };
                            if (current.transparent === value) return prev;
                            return { ...prev, [name]: { ...current, transparent: value } };
                        });
                    }
                },
                [`opacity_${name}`]: {
                    label: 'Opacity',
                    value: meshConfigs[name]?.opacity ?? 1,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: (value: number) => {
                        setMeshConfigs(prev => {
                            const current = prev[name] || { matcap: 'plasticWhite', color: '#ffffff', transparent: false, opacity: 1 };
                            if (current.opacity === value) return prev;
                            return { ...prev, [name]: { ...current, opacity: value } };
                        });
                    }
                }
            }, { collapsed: true });
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
                            // Object.keys(imported.meshConfigs).forEach((name) => {
                            //     const config = imported.meshConfigs[name];
                            //     console.log(name, config);
                            //     setControls({
                            //         [`matcap_${name}`]: config.matcap,
                            //         [`color_${name}`]: config.color,
                            //         [`transparent_${name}`]: config.transparent,
                            //         [`opacity_${name}`]: config.opacity
                            //     });
                            // });
                        }
                    } catch (err: any) {
                        alert("Error al leer el archivo JSON");
                        console.log(err.message);
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
                    const config = configRef.current[node.name] || {
                        matcap: 'plasticWhite',
                        color: '#ffffff',
                        transparent: false,
                        opacity: 1
                    };
                    node.userData.matcap = config.matcap;
                    node.userData.color = config.color;
                    node.userData.transparent = config.transparent;
                    node.userData.opacity = config.opacity;
                }
            });

            // Export Compressed
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

                <Suspense fallback={<Html center>Cargando Modelo...</Html>}>
                    <DynamicModel
                        url={modelUrl}
                        meshConfigs={meshConfigs}
                        fog={activeFog}
                    />
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute bottom-8 left-8 p-6 bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl z-10">
                <h1 className="text-white font-black italic">Matcap Composer v1</h1>
                <p className="text-zinc-500 text-[9px] uppercase tracking-tighter">Visual Material Editor</p>
            </div>
        </div>
    );
}