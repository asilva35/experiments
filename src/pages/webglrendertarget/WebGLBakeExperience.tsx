import { useState, useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, Stats } from '@react-three/drei'
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

import * as THREE from 'three'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BakeEngineProps {
    isBaked: boolean
    bakedTexture: THREE.Texture | null
    onBakeDone: (texture: THREE.Texture) => void
}

export interface BakeEngineHandle {
    bake: () => Promise<void>
}

const InstancedCubes = ({ count = 1500 }: { count: number }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Posiciones aleatorias
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < count; i++) {
            temp.push({
                position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
            })
        }
        return temp
    }, [count])

    useEffect(() => {
        particles.forEach((p, i) => {
            dummy.position.set(p.position[0], p.position[1], p.position[2])
            dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [particles, dummy])

    return (
        <instancedMesh
            ref={meshRef}
            args={[null!, null!, count]}
            castShadow
        >
            <boxGeometry args={[0.5, 0.5, 0.25]} />
            {/* Usamos un material estándar normal. 
                El Environment se encarga de que se vean bien.
            */}
            <meshStandardMaterial color="#333" />
        </instancedMesh>
    )
}

// ─── Escena R3F (sin ningún elemento HTML) ────────────────────────────────────

const BakeEngine = forwardRef<BakeEngineHandle, BakeEngineProps>(
    ({ isBaked, bakedTexture, onBakeDone }, ref) => {
        const { gl, scene } = useThree()

        // 1. RenderTarget de alta resolución para capturar sombras nítidas
        const renderTarget = useMemo(
            () =>
                new THREE.WebGLRenderTarget(2048, 2048, {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                }),
            []
        )

        // Exponemos el método bake al componente padre
        useImperativeHandle(ref, () => ({
            async bake() {
                // 1. Capturamos la iluminación ambiental desde el punto central

                //ADD Helper to see Cube Camera
                const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256)
                const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
                cubeCamera.position.set(0, 0.5, 0)
                cubeCamera.update(gl, scene)

                //2. Generamos el Light Probe(fromCubeRenderTarget devuelve Promise)
                const probe: THREE.LightProbe = await LightProbeGenerator.fromCubeRenderTarget(gl, cubeRenderTarget)
                probe.intensity = 1
                scene.add(probe)

                // 3. Cámara ortográfica cenital para el bake de sombras en el suelo
                const bakeCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 20)
                bakeCamera.position.set(0, 10, 0)
                bakeCamera.lookAt(0, 0, 0)

                // 4. Renderizamos la escena al RenderTarget
                gl.setRenderTarget(renderTarget)
                gl.render(scene, bakeCamera)
                gl.setRenderTarget(null)

                // 5. Notificamos al padre con la textura capturada
                onBakeDone(renderTarget.texture)
            },
        }))

        return (
            <>
                <OrbitControls makeDefault />
                <Stats />

                {/* Iluminación global via PMREM */}
                <Environment preset="apartment" />

                {/* Luces dinámicas — se desactivan tras el bake */}
                {!isBaked && (
                    <>
                        <ambientLight intensity={0.2} />
                        <directionalLight
                            position={[2, 5, 2]}
                            intensity={1.5}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <pointLight position={[-3, 4, -2]} intensity={20} color="orange" castShadow />
                    </>
                )}

                {/* Objetos de la galería */}
                <group>
                    <InstancedCubes count={100} />
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <boxGeometry args={[1, 10, 1]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[2, 0.5, 2]} castShadow>
                        <sphereGeometry args={[0.5, 32, 32]} />
                        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[-2, 0.75, 1]} castShadow rotation={[0, Math.PI / 4, 0]}>
                        <torusKnotGeometry args={[0.5, 0.2, 100, 16]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                </group>

                {/* Suelo — receptor del bake */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry
                        args={[10, 10]}
                        ref={(geo) => {
                            // Copiamos los UVs al canal uv2 (requerido por lightMap)
                            // El ref se ejecuta tras el montaje, cuando la geometría ya está lista
                            if (geo && !geo.attributes.uv2) {
                                const uvAttr = geo.attributes.uv
                                if (uvAttr) {
                                    geo.setAttribute(
                                        'uv2',
                                        new THREE.Float32BufferAttribute(
                                            (uvAttr.array as Float32Array).slice(),
                                            2
                                        )
                                    )
                                }
                            }
                        }}
                    />
                    <meshStandardMaterial
                        color="white"
                        lightMap={isBaked ? bakedTexture : null}
                        lightMapIntensity={isBaked ? 1.5 : 0}
                    />
                </mesh>
            </>
        )
    }
)

BakeEngine.displayName = 'BakeEngine'

// ─── Componente principal ─────────────────────────────────────────────────────

const WebGLBakeExperience = () => {
    const [isBaked, setIsBaked] = useState(false)
    const [bakedTexture, setBakedTexture] = useState<THREE.Texture | null>(null)

    // Ref para llamar a BakeEngine.bake() desde fuera del Canvas
    const bakeEngineRef = useRef<BakeEngineHandle>(null)

    const handleBakeClick = () => {
        bakeEngineRef.current?.bake()
    }

    const handleBakeDone = (texture: THREE.Texture) => {
        setBakedTexture(texture)
        setIsBaked(true)
    }

    return (
        <div className="w-full h-screen bg-[#050505] relative">
            {/*
             * UI overlay — FUERA del Canvas.
             * Dentro de <Canvas> solo pueden vivir objetos de THREE.js.
             * Colocar <button> o <div> dentro provoca el error:
             * "Button is not part of the THREE namespace!"
             */}
            <div className="absolute top-10 left-10 z-10 flex flex-col gap-4">
                <button
                    onClick={handleBakeClick}
                    className={`px-6 py-3 rounded-full font-bold transition-all ${isBaked
                        ? 'bg-green-500 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                        }`}
                >
                    {isBaked ? '✓ ESCENA OPTIMIZADA (BAKED)' : 'EJECUTAR BAKE DE SOMBRAS'}
                </button>

                {isBaked && (
                    <button
                        onClick={() => setIsBaked(false)}
                        className="text-xs text-slate-400 underline"
                    >
                        Resetear y activar luces dinámicas
                    </button>
                )}
            </div>

            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[8, 8, 8]} />
                <BakeEngine
                    ref={bakeEngineRef}
                    isBaked={isBaked}
                    bakedTexture={bakedTexture}
                    onBakeDone={handleBakeDone}
                />
            </Canvas>
        </div>
    )
}

export default WebGLBakeExperience