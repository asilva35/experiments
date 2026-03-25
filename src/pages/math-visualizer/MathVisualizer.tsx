import { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Line, PerspectiveCamera, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { animated, useSpring } from '@react-spring/three'

// --- 1. COMPONENTE DE LA GRÁFICA (The Animated Wave) ---
function MathSurface({ amplitude, frequency, phase, color, selectedFormula }: any) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [segments] = useState(64)

    const geometry = useMemo(() => {
        return new THREE.PlaneGeometry(10, 10, segments, segments)
    }, [segments])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const positions = meshRef.current.geometry.attributes.position

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i)
            const y = positions.getY(i)
            let z = 0

            // Ahora el switch tiene acceso a la variable
            switch (selectedFormula) {
                case 'ripple':
                    const dist = Math.sqrt(x * x + y * y)
                    z = amplitude * Math.sin(dist * frequency - t * phase)
                    break

                case 'interference':
                    z = (amplitude / 2) * (Math.sin(x * frequency + t * phase) + Math.cos(y * frequency + t * phase))
                    break

                case 'saddle':
                    z = ((x * x - y * y) / 10) * amplitude * Math.sin(t * phase)
                    break

                case 'gaussian':
                    const gDist = (x * x + y * y) * (frequency / 10)
                    z = (amplitude * 2) * Math.exp(-gDist) * Math.abs(Math.sin(t * phase))
                    break
            }

            positions.setZ(i, z)
        }
        positions.needsUpdate = true
    })

    const { springColor } = useSpring({
        springColor: color,
        config: { mass: 1, tension: 120, friction: 14 }
    })

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
            <animated.meshStandardMaterial
                color={springColor}
                wireframe={true}
                metalness={0.1}
                roughness={0.15}
                flatShading={false}
            />
        </mesh>
    )
}

// --- 2. COMPONENTE DE ESCENA PRINCIPAL ---
export default function MathVisualizer() {
    // Estados de los parámetros ajustables
    const [amplitude, setAmplitude] = useState(0.8)
    const [frequency, setFrequency] = useState(2.0)
    const [phase, setPhase] = useState(1.5)
    const [selectedFormula, setSelectedFormula] = useState('ripple')

    // --- 💡 CAMBIO DE COLORES (Alto Contraste) ---
    // const formulas: any = {
    //     // Usamos colores neón/vibrantes que destaquen sobre negro
    //     ripple: { name: 'Ripple (sin/dist)', color: '#38bdf8' }, // 💡 Cyan Brillante
    //     sine: { name: 'Simple Sine Wave', color: '#f97316' } // 💡 Coral Brillante
    // }

    const formulas: any = {
        ripple: {
            name: 'Circular Ripple',
            color: '#38bdf8',
            label: 'z = A \\cdot \\sin(\\sqrt{x^2 + y^2} \\cdot f - t \\cdot p)'
        },
        interference: {
            name: 'Wave Interference',
            color: '#818cf8',
            label: 'z = \\frac{A}{2} (\\sin(x \\cdot f + t) + \\cos(y \cdot f + t))'
        },
        saddle: {
            name: 'Hyperbolic Paraboloid',
            color: '#f472b6',
            label: 'z = \\frac{(x^2 - y^2)}{10} \\cdot A \\cdot \\sin(t)'
        },
        gaussian: {
            name: 'Gaussian Distribution',
            color: '#34d399',
            label: 'z = A \\cdot e^{-(x^2 + y^2) \\cdot \\frac{f}{10}}'
        }
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-screen bg-slate-950 font-sans text-white">

            {/* PANEL DE CONTROL (IZQUIERDA) */}
            <div className="w-full lg:w-80 bg-[#111] p-10 flex flex-col border-r border-slate-800 backdrop-blur-sm z-10">
                <div className="mb-10">
                    <h2 className="text-[#e8620a] font-black text-2xl italic leading-none">MATH VISUAL</h2>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase mt-1">Interactive Tutor PoC</p>
                </div>

                {/* ... (Todo el JSX del panel de control igual que antes) */}
                <div className="space-y-8 flex-1">
                    {/* Selector de Fórmula */}
                    <div>
                        <label className="text-zinc-500 text-[10px] font-black uppercase mb-3 block">Selected Formula</label>
                        <div className="space-y-2">
                            {Object.keys(formulas).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedFormula(key)}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg transition-all ${selectedFormula === key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    {formulas[key].name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliders de Parámetros */}
                    <div className="pt-6 border-t border-zinc-800 space-y-5">
                        {[
                            { label: 'Amplitude (A)', value: amplitude, setter: setAmplitude, min: 0.1, max: 2 },
                            { label: 'Frequency (f)', value: frequency, setter: setFrequency, min: 0.5, max: 5 },
                            { label: 'Phase (p)', value: phase, setter: setPhase, min: 0.1, max: 4 }
                        ].map((p) => (
                            <div key={p.label}>
                                <div className="flex justify-between items-baseline mb-2">
                                    <label className="text-zinc-500 text-[10px] font-black uppercase">{p.label}</label>
                                    <span className="text-white font-mono text-sm">{p.value.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={p.min}
                                    max={p.max}
                                    step={0.01}
                                    value={p.value}
                                    onChange={(e) => p.setter(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[#e8620a]"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <button className="mt-10 py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all">
                    RESET PARAMS
                </button>
            </div>

            {/* ÁREA DEL CANVAS (DERECHA) */}
            <div className="relative flex-1">
                <Canvas shadows gl={{ antialias: true }}>
                    {/* 💡 SUBIMOS UN POCO EL FONDO DEL CANVAS (para contrastar sombras) */}
                    <color attach="background" args={['#111115']} />
                    <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={50} />

                    <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={3} maxDistance={20} />

                    {/* 💡 --- POTENCIAMOS LA ILUMINACIÓN --- */}
                    {/* Subimos la luz ambiente para iluminar todas las caras */}
                    <ambientLight intensity={0.9} />

                    {/* Luz Principal (Key Light) - Más intensa y directa */}
                    <pointLight position={[5, 5, 5]} intensity={2.5} color="#fff" />

                    {/* Luz de Borde (Rim Light) - Desde atrás para definir la forma */}
                    <spotLight position={[-10, 10, -10]} intensity={1.8} angle={0.3} penumbra={1} color="#ffffff" castShadow />

                    {/* Grids de referencia para profundidad */}
                    <Grid infiniteGrid sectionColor="#3a3a40" cellColor="#2c2c31" sectionThickness={1.5} cellThickness={1} fadeDistance={30} />

                    {/* Ejes X y Y con líneas (Gris más claro) */}
                    <Line points={[[-6, 0.01, 0], [6, 0.01, 0]] as any} color="#64748b" lineWidth={2} />
                    <Line points={[[0, 0.01, -6], [0, 0.01, 6]] as any} color="#64748b" lineWidth={2} />

                    {/* La Gráfica Matematica Reactiva */}
                    <MathSurface
                        amplitude={amplitude}
                        frequency={frequency}
                        phase={phase}
                        color={formulas[selectedFormula].color}
                        selectedFormula={selectedFormula}
                    />

                    <ContactShadows opacity={0.6} scale={15} blur={1.5} far={4} resolution={256} color="#000" />
                </Canvas>

                {/* UI FLOTANTE SOBRE EL CANVAS */}
                <div className="absolute top-6 left-6 z-10 p-5 bg-black/70 backdrop-blur-md rounded-2xl border border-zinc-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl text-[#e8620a]">∑</div>
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Active Concept</p>
                        <h3 className="text-white font-black text-sm">{formulas[selectedFormula].name}</h3>
                    </div>
                </div>
            </div>
        </div>
    )
}