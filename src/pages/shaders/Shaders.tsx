import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
//import { WOOD_FRAGMENT_SHADER, WOOD_VERTEX_SHADER } from '../../components/WoodShader'
import { WOOD_FLOOR_FRAGMENT_SHADER, WOOD_FLOOR_VERTEX_SHADER } from '../../components/WoodFloorShader'
import { useRef } from 'react'
import * as THREE from 'three'

const ShaderCube = () => {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (meshRef.current) {
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
        }
    })
    return (
        <mesh ref={meshRef} rotation={[0, 0, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <shaderMaterial
                vertexShader={WOOD_FLOOR_VERTEX_SHADER}
                fragmentShader={WOOD_FLOOR_FRAGMENT_SHADER}
                uniforms={{
                    uTime: { value: 0 },
                    uRepeat: { value: new THREE.Vector2(1.0, 1.0) },
                    uRotation: { value: 0 }, // In radians
                    uColorLight: { value: new THREE.Color(0.72, 0.68, 0.62) },
                    uColorDark: { value: new THREE.Color(0.58, 0.54, 0.48) }
                }}
            />
        </mesh>
    )
}

export default function Shaders() {
    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <OrbitControls />
                <Stats />
                <ShaderCube />
            </Canvas>
        </div>
    )
}
