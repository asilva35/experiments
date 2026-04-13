import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { Stats, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { vertexShader, fragmentShader, calculateCPUData } from './ParticleSphere';

// --------------------------------------------------------
// 1. TIPOS Y UTILIDADES DE CONVERSIÓN
// --------------------------------------------------------
interface BiomorphicMeshProps {
    textureData: Uint8Array;
    numVertices: number;
    numFrames: number;
    segments: [number, number];
}

const encodeBase64 = (uint8array: Uint8Array): string => {
    const chunk = 0x8000;
    const c: string[] = [];
    for (let i = 0; i < uint8array.length; i += chunk) {
        // @ts-ignore - apply can be variadic
        c.push(String.fromCharCode.apply(null, uint8array.subarray(i, i + chunk) as unknown as number[]));
    }
    return btoa(c.join(""));
};

const decodeBase64 = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

// --------------------------------------------------------
// 4. COMPONENTE DE LA MALLA
// --------------------------------------------------------
function BiomorphicMesh({ textureData, numVertices, numFrames }: Omit<BiomorphicMeshProps, 'segments'>) {
    const meshRef = useRef<THREE.Points>(null!);
    const matRef = useRef<THREE.ShaderMaterial>(null!);

    // Pre-calcular índices una vez
    const vertexIndices = useMemo(() => {
        const indices = new Float32Array(numVertices);
        for (let i = 0; i < numVertices; i++) indices[i] = i;
        return indices;
    }, [numVertices]);

    // Crear la textura de datos
    const dataTexture = useMemo(() => {
        const tex = new THREE.DataTexture(
            textureData,
            numVertices,
            numFrames,
            THREE.RGBAFormat,
            THREE.UnsignedByteType
        );
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        return tex;
    }, [textureData, numVertices, numFrames]);

    // Uniforms iniciales
    const uniforms = useMemo(() => ({
        uDataTexture: { value: dataTexture },
        uTime: { value: 0 },
        uNumVertices: { value: numVertices },
        uColor: { value: new THREE.Color('#ffffff') },
        uColorD: { value: new THREE.Color('#222222') }
    }), [dataTexture, numVertices]);

    useFrame((state: RootState) => {
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array(numVertices * 3), 3]}
                />
                <bufferAttribute
                    attach="attributes-aVertexIndex"
                    args={[vertexIndices, 1]}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                side={THREE.DoubleSide}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

// --------------------------------------------------------
// 5. APP PRINCIPAL
// --------------------------------------------------------
export default function App() {
    const [textureData, setTextureData] = useState<Uint8Array | null>(null);
    const [status, setStatus] = useState('Listo');
    const [isProcessing, setIsProcessing] = useState(false);

    const segments: [number, number] = [128, 32];
    const numVertices = (segments[0] + 1) * (segments[1] + 1);
    const numFrames = 60;
    const cacheKey = 'biomorphic_v3_data';

    const loadOrCalculate = async (forceCalculate = false) => {
        setIsProcessing(true);
        setStatus('Procesando...');
        await new Promise(r => setTimeout(r, 100));

        try {
            const cached = !forceCalculate ? localStorage.getItem(cacheKey) : null;
            if (cached) {
                setTextureData(decodeBase64(cached));
                setStatus('Cargado de LocalStorage ✅');
            } else {
                const newData = calculateCPUData(numVertices, numFrames);
                setTextureData(newData);
                setStatus('Calculado en CPU (Temporal) 🧠');
            }
        } catch (e) {
            setStatus('Error en proceso ❌');
        }
        setIsProcessing(false);
    };

    useEffect(() => {
        loadOrCalculate();
    }, []);

    const handleSave = () => {
        if (!textureData) return;
        try {
            localStorage.setItem(cacheKey, encodeBase64(textureData));
            setStatus('Guardado en LocalStorage 💾');
        } catch (e) {
            setStatus('Error al guardar (Caché lleno) ❌');
        }
    };

    const handleClear = () => {
        localStorage.removeItem(cacheKey);
        setStatus('Caché eliminado 🗑️');
    };

    return (
        <div className="w-full h-screen bg-neutral-950 text-white font-sans overflow-hidden">
            {/* UI SIMPLE */}
            <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl w-72">
                <h1 className="text-lg font-bold mb-1">Biomorfismo</h1>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4">CPU Performance Cache</p>

                <div className="text-xs mb-6 text-white/70">
                    Estado: <span className="text-emerald-400 font-mono">{status}</span>
                </div>

                <div className="grid gap-2">
                    <button
                        disabled={isProcessing}
                        onClick={handleSave}
                        className="bg-white text-black text-xs font-bold py-3 rounded-lg hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-30"
                    >
                        GUARDAR EN STORAGE
                    </button>
                    <button
                        disabled={isProcessing}
                        onClick={() => loadOrCalculate(true)}
                        className="bg-neutral-800 text-white text-xs font-bold py-3 rounded-lg hover:bg-neutral-700 transition-all active:scale-95"
                    >
                        RE-CALCULAR TODO
                    </button>
                    <button
                        disabled={isProcessing}
                        onClick={handleClear}
                        className="text-red-400 text-[10px] font-bold py-2 mt-2 hover:text-red-300"
                    >
                        LIMPIAR STORAGE
                    </button>
                </div>
            </div>

            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <Stats />
                <color attach="background" args={['#050505']} />

                {textureData && (
                    <BiomorphicMesh
                        textureData={textureData}
                        numVertices={numVertices}
                        numFrames={numFrames}
                    />
                )}
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
}