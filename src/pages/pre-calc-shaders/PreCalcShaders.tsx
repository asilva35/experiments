import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import * as THREE from 'three';

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
// 2. SHADERS NATIVOS (GLSL)
// --------------------------------------------------------
const vertexShader = `
  uniform sampler2D uDataTexture;
  uniform float uTime;
  uniform float uNumVertices;
  attribute float aVertexIndex;
  varying float vNoise;

  void main() {
    float xCoord = (aVertexIndex + 0.5) / uNumVertices; 
    float yCoord = mod(uTime * 0.3, 1.0); 

    vec4 texData = texture2D(uDataTexture, vec2(xCoord, yCoord));
    float noiseVal = (texData.r * 2.0) - 1.0;
    vNoise = noiseVal;
    
    vec3 newPos = position + normal * noiseVal * 0.8;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uColorD;
  varying float vNoise;

  void main() {
    float mixFactor = smoothstep(-0.8, 0.8, vNoise); 
    vec3 finalColor = mix(uColorD, uColor, mixFactor);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --------------------------------------------------------
// 3. CÁLCULO DE CPU
// --------------------------------------------------------
const calculateCPUData = (count: number, numFrames: number): Uint8Array => {
    const data = new Uint8Array(count * numFrames * 4);
    // Simulación de ruido simple para la CPU
    for (let f = 0; f < numFrames; f++) {
        const t = (f / numFrames) * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 10;
            const n = Math.sin(angle + t) * Math.cos(angle * 0.5 - t);
            const mapped = ((n + 1.0) / 2.0) * 255;
            const idx = (f * count + i) * 4;
            data[idx] = Math.floor(mapped);
            data[idx + 1] = Math.floor(mapped * 0.8); // G
            data[idx + 2] = Math.floor(mapped * 1.2); // B
            data[idx + 3] = 255;
        }
    }
    return data;
};

// --------------------------------------------------------
// 4. COMPONENTE DE LA MALLA
// --------------------------------------------------------
function BiomorphicMesh({ textureData, numVertices, numFrames, segments }: BiomorphicMeshProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
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
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[Math.PI / 4, 0, 0]}>
            <torusKnotGeometry args={[2, 0.5, segments[0], segments[1]]}>
                <bufferAttribute
                   attach="attributes-aVertexIndex"
                   args={[vertexIndices, 1]}
                />
            </torusKnotGeometry>
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                side={THREE.DoubleSide}
            />
        </mesh>
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
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {textureData && (
                    <BiomorphicMesh
                        textureData={textureData}
                        numVertices={numVertices}
                        numFrames={numFrames}
                        segments={segments}
                    />
                )}
            </Canvas>
        </div>
    );
}