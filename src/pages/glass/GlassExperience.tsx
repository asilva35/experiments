import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
    useGLTF,
    OrbitControls,
    MeshTransmissionMaterial,
    Environment,
    ContactShadows,
    PerspectiveCamera,
} from '@react-three/drei'
import * as THREE from 'three'
import { useControls, button } from 'leva'
import type { GLTF } from 'three-stdlib'

interface GLTFResult extends GLTF {
    nodes: { [key: string]: THREE.Mesh }
    materials: { [key: string]: THREE.Material }
}

function DynamicGlassModel({ url, materialProps }: any) {
    const materialRef = useRef<any>(null)
    const { scene } = (useGLTF(url || '/models/gltf/cube.glb') as unknown) as GLTFResult

    const applyGlass = (obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh && materialRef.current) {
            const mesh = obj as THREE.Mesh
            mesh.material = materialRef.current
            mesh.castShadow = true
            mesh.receiveShadow = true
        }
    }

    // Aplicar cuando el modelo carga
    useMemo(() => {
        scene.traverse(applyGlass)
    }, [scene])

    // Aplicar cuando el material o las props cambian
    useEffect(() => {
        scene.traverse(applyGlass)
    }, [scene, materialProps])

    return (
        <primitive object={scene}>
            <MeshTransmissionMaterial ref={materialRef} {...materialProps} />
        </primitive>
    )
}

// --- Controlador de la Escena (Captura y Lógica) ---
function SceneController({ customUrl }: { customUrl: string | null }) {
    const { gl, scene, camera } = useThree()

    // Panel de control con Leva (reemplaza a GUI)
    const materialProps = useControls('Glass Material', {
        thickness: { value: 0.2, min: 0, max: 3, step: 0.05 },
        roughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
        transmission: { value: 1, min: 0, max: 1 },
        ior: { value: 1.2, min: 1, max: 2.3, step: 0.01 },
        chromaticAberration: { value: 0.02, min: 0, max: 1 },
        backside: { value: true },
        color: '#ffffff',
    })

    // Función de Captura
    const takeScreenshot = () => {
        // 1. Forzamos un renderizado manual para asegurar que el buffer esté lleno
        gl.render(scene, camera)
        // 2. Extraemos el dataURL del canvas
        const dataURL = gl.domElement.toDataURL('image/png')
        // 3. Descarga automática
        const link = document.createElement('a')
        link.download = `glass_capture_${Date.now()}.png`
        link.href = dataURL
        link.click()
    }

    const { environment } = useControls('Environment', {
        environment: {
            options: ['city', 'studio', 'apartment', 'warehouse', 'sunset', 'dawn', 'night', 'park', 'forest'],
            value: 'city'
        }
    });

    // Agregamos el botón de captura a Leva
    useControls('Capture', {
        '📸 Take Screenshot': button(() => takeScreenshot())
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} />

            <DynamicGlassModel url={customUrl} materialProps={materialProps} />

            <Environment preset={environment as any} background={false} blur={1} />

            <ContactShadows position={[0, -1.5, 0]} opacity={0.75} scale={10} blur={2.5} far={4} />
        </>
    )
}

export default function GlassExperience() {
    const [modelUrl, setModelUrl] = useState<string | null>(null)

    const handleFile = (e: any) => {
        const file = e.target.files[0]
        if (file) setModelUrl(URL.createObjectURL(file))
    }

    return (
        <div className="w-full h-screen bg-white relative">
            <Canvas
                shadows
                dpr={[1, 2]}
            // gl={{ preserveDrawingBuffer: true }} // CLAVE PARA CAPTURAS DE PANTALLA
            //</div>onCreated={({ gl }) => {
            // Opción alternativa: habilitar preserveDrawingBuffer para que toDataURL funcione siempre
            //}}
            >
                <SceneController customUrl={modelUrl} />
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-10 left-10 z-10 p-6 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                <h1 className="text-xl font-bold uppercase tracking-tighter">Glass Studio</h1>
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".glb,.gltf"
                    onChange={handleFile}
                />
                <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-4 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                    Load Custom Model
                </button>
            </div>
        </div>
    )
}