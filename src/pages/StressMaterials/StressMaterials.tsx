import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, PerspectiveCamera, Grid, Edges, Stats } from '@react-three/drei'
import { Suspense } from 'react'
import { useControls } from 'leva'
import { LoadFlow } from './LoadFlow'
import { TelemetryDashboard } from './TelemetryDashboard'

function CivilModel() {
    return (
        <mesh castShadow>
            <boxGeometry args={[4, 0.5, 10]} />
            {/* Material tipo "Carbon Fiber" o Acero oscuro */}
            <meshStandardMaterial
                color="#0a0a0a"
                roughness={0.1}
                metalness={0.9}
            />
            {/* Bordes más brillantes para compensar la falta de Bloom */}
            <Edges
                threshold={15}
                color="#00f2ff"
                lineWidth={3}
            />
        </mesh>
    )
}

export default function App() {
    const { speed, stressLoad } = useControls({
        speed: { value: 0.05, min: 0.01, max: 0.2 },
        stressLoad: { value: 0.5, min: 0, max: 1.5 } // Nueva variable
    });

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
            <Canvas
                shadows
                dpr={window.devicePixelRatio} // Usamos el nativo ahora que no hay Bloom
                gl={{
                    antialias: true, // Ahora sí podemos activarlo para bordes suaves
                    powerPreference: "high-performance"
                }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[12, 12, 12]} />

                    <Grid
                        infiniteGrid
                        fadeDistance={50}
                        fadeStrength={5}
                        sectionSize={1.5}
                        sectionColor="#222"
                        cellColor="#111"
                    />

                    <Stage environment="city" intensity={0.2} castShadow={false}>
                        <CivilModel />
                    </Stage>

                    <LoadFlow count={1500} speed={speed} stress={stressLoad} />

                    <OrbitControls makeDefault />
                </Suspense>

                <Stats />
            </Canvas>

            <TelemetryDashboard stress={stressLoad} speed={speed} />

            <div style={{ position: 'absolute', top: 40, left: 40, color: 'white', fontFamily: 'monospace', pointerEvents: 'none' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#00f2ff' }}>CIVIL_COMPUTE_v1.0</h1>
                <p style={{ color: '#aaa', fontSize: '0.8rem' }}>MODE: HIGH_PERFORMANCE_NO_BLOOM</p>
            </div>
        </div>
    )
}