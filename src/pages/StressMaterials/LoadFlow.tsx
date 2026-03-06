import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Nuevo Vertex Shader que pasa la posición Z al Fragment Shader
const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  attribute float aOffset;
  varying float vZ; // Pasamos la posición Z al fragment shader

  void main() {
    vec3 pos = position;
    pos.z += mod(uTime * uSpeed + aOffset, 10.0) - 5.0;
    vZ = pos.z; // Guardamos la posición actual
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 0.12 * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vZ;
  uniform float uStress; // Nuevo uniform para controlar la intensidad

  void main() {
    // Calculamos la distancia al centro (0.0)
    // Entre más cerca del centro, más rojo. Entre más lejos, más cian.
    float dist = abs(vZ) * 0.2; 
    vec3 colorCold = vec3(0.0, 0.95, 1.0); // Cian
    vec3 colorHot = vec3(1.0, 0.2, 0.2);   // Rojo
    
    vec3 finalColor = mix(colorHot, colorCold, dist + (1.0 - uStress));
    
    gl_FragColor = vec4(finalColor, 0.8);
  }
`;

interface LoadFlowProps {
    count?: number;
    speed?: number;
    stress?: number;
}

export function LoadFlow({ count = 1000, speed = 0.05, stress = 0.5 }: LoadFlowProps) {
    const materialRef = useRef<THREE.ShaderMaterial>(null!)

    // Las posiciones y offsets solo se calculan UNA vez al montar el componente
    const [positions, offsets] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const off = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 4
            pos[i * 3 + 1] = 0.26 // Ligeramente arriba de la viga
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10
            off[i] = Math.random() * 10.0
        }
        return [pos, off]
    }, [count])

    // ACTUALIZACIÓN CRÍTICA: 
    // Usamos useEffect para actualizar el uniform SOLO cuando cambia speed
    // sin re-renderizar la geometría.
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uSpeed.value = speed * 10;
            materialRef.current.uniforms.uStress.value = stress; // Actualizar uniform de estrés
        }
    }, [speed, stress]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
        }
    })

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aOffset"
                    count={offsets.length}
                    array={offsets}
                    itemSize={1}
                    args={[offsets, 1]}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                depthWrite={false} // Evita problemas de solapamiento de partículas
                blending={THREE.AdditiveBlending}
                uniforms={useMemo(() => ({
                    uTime: { value: 0 },
                    uSpeed: { value: speed * 10 },
                    uStress: { value: stress }
                }), [])} // Los uniforms iniciales se memorizan para que no se re-creen
            />
        </points>
    )
}