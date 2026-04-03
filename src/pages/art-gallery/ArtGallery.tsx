import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    OrbitControls,
    Text,
    useTexture,
    Stats,
    Html,
} from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Artwork {
    id: number
    title: string
    artist: string
    year: string
    description: string
    position: [number, number, number]
    rotation: [number, number, number]
    width: number
    height: number
    colors: string[]
    style: 'abstract' | 'landscape' | 'portrait' | 'geometric' | 'impressionist'
    roomId: number
}

interface RoomData {
    id: number
    name: string
    position: [number, number, number]
    color: string
}

const ROOMS: RoomData[] = [
    { id: 0, name: 'Main Hall', position: [0, 0, 0], color: '#ffffff' },
    { id: 1, name: 'West Wing', position: [-25, 0, 0], color: '#a0c4ff' },
    { id: 2, name: 'East Wing', position: [25, 0, 0], color: '#ffd6a5' },
]

// ─── Painting Texture Generator ──────────────────────────────────────────────

function generatePaintingTexture(artwork: Artwork): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = Math.round(512 * (artwork.height / artwork.width))
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height

    const colors = artwork.colors

    if (artwork.style === 'abstract') {
        // Gradient background
        const bg = ctx.createLinearGradient(0, 0, w, h)
        bg.addColorStop(0, colors[0])
        bg.addColorStop(0.5, colors[1] || colors[0])
        bg.addColorStop(1, colors[2] || colors[0])
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)

        // Abstract shapes
        for (let i = 0; i < 20; i++) {
            ctx.globalAlpha = 0.3 + Math.random() * 0.5
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
            ctx.beginPath()
            const x = Math.random() * w
            const y = Math.random() * h
            const r = 20 + Math.random() * 120
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.fill()
        }
        // Strokes
        for (let i = 0; i < 8; i++) {
            ctx.globalAlpha = 0.6
            ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)]
            ctx.lineWidth = 3 + Math.random() * 15
            ctx.beginPath()
            ctx.moveTo(Math.random() * w, Math.random() * h)
            ctx.bezierCurveTo(
                Math.random() * w, Math.random() * h,
                Math.random() * w, Math.random() * h,
                Math.random() * w, Math.random() * h
            )
            ctx.stroke()
        }
    } else if (artwork.style === 'landscape') {
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6)
        sky.addColorStop(0, colors[0])
        sky.addColorStop(1, colors[1] || '#87CEEB')
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, w, h)

        // Mountains
        ctx.globalAlpha = 0.8
        ctx.fillStyle = colors[2] || '#4a6741'
        ctx.beginPath()
        ctx.moveTo(0, h * 0.7)
        for (let x = 0; x <= w; x += 40) {
            const peak = h * 0.3 + Math.sin(x * 0.02) * h * 0.2 + Math.cos(x * 0.05) * h * 0.1
            ctx.lineTo(x, peak)
        }
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.fill()

        // Ground
        const ground = ctx.createLinearGradient(0, h * 0.65, 0, h)
        ground.addColorStop(0, colors[3] || '#5a7a3a')
        ground.addColorStop(1, colors[4] || '#3d5228')
        ctx.fillStyle = ground
        ctx.fillRect(0, h * 0.65, w, h)

        // Sun
        ctx.globalAlpha = 0.9
        ctx.fillStyle = colors[1] || '#FFD700'
        ctx.beginPath()
        ctx.arc(w * 0.75, h * 0.2, 35, 0, Math.PI * 2)
        ctx.fill()

        // Clouds
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 4; i++) {
            const cx = (Math.random() * 0.8 + 0.1) * w
            const cy = (Math.random() * 0.3 + 0.05) * h
            for (let j = 0; j < 5; j++) {
                ctx.beginPath()
                ctx.arc(cx + j * 18 - 36, cy + Math.sin(j) * 8, 18 + Math.random() * 12, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    } else if (artwork.style === 'portrait') {
        // Background
        const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8)
        bg.addColorStop(0, colors[1] || '#8B7355')
        bg.addColorStop(1, colors[0])
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)

        // Body/clothes
        ctx.globalAlpha = 0.9
        ctx.fillStyle = colors[2] || '#2c3e50'
        ctx.beginPath()
        ctx.ellipse(w / 2, h * 0.85, w * 0.3, h * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()

        // Neck
        ctx.fillStyle = '#C8956C'
        ctx.fillRect(w / 2 - 18, h * 0.52, 36, h * 0.12)

        // Head
        ctx.fillStyle = '#D4A574'
        ctx.beginPath()
        ctx.ellipse(w / 2, h * 0.38, w * 0.18, h * 0.22, 0, 0, Math.PI * 2)
        ctx.fill()

        // Hair
        ctx.fillStyle = colors[3] || '#3d2b1f'
        ctx.beginPath()
        ctx.ellipse(w / 2, h * 0.25, w * 0.19, h * 0.13, 0, 0, Math.PI)
        ctx.fill()

        // Eyes
        ctx.fillStyle = '#2c1810'
        ctx.beginPath()
        ctx.ellipse(w / 2 - 22, h * 0.36, 7, 5, 0, 0, Math.PI * 2)
        ctx.ellipse(w / 2 + 22, h * 0.36, 7, 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Mouth
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(w / 2, h * 0.44, 14, 0.1, Math.PI - 0.1)
        ctx.stroke()
    } else if (artwork.style === 'geometric') {
        ctx.fillStyle = colors[0]
        ctx.fillRect(0, 0, w, h)

        const shapes = 30
        for (let i = 0; i < shapes; i++) {
            ctx.globalAlpha = 0.5 + Math.random() * 0.5
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
            const sides = Math.floor(Math.random() * 4) + 3
            const x = Math.random() * w
            const y = Math.random() * h
            const r = 20 + Math.random() * 80
            ctx.beginPath()
            for (let s = 0; s < sides; s++) {
                const angle = (s / sides) * Math.PI * 2 - Math.PI / 2
                const px = x + Math.cos(angle) * r
                const py = y + Math.sin(angle) * r
                s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fill()
        }
    } else {
        // impressionist
        ctx.fillStyle = colors[0]
        ctx.fillRect(0, 0, w, h)

        for (let i = 0; i < 800; i++) {
            ctx.globalAlpha = 0.3 + Math.random() * 0.5
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
            const x = Math.random() * w
            const y = Math.random() * h
            const len = 5 + Math.random() * 20
            const angle = Math.random() * Math.PI
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.fillRect(-len / 2, -2, len, 4 + Math.random() * 3)
            ctx.restore()
        }
    }

    // Frame vignette
    ctx.globalAlpha = 1
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8)
    vig.addColorStop(0, 'transparent')
    vig.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, w, h)

    const tex = new THREE.CanvasTexture(canvas)
    return tex
}

// ─── Gallery Data ─────────────────────────────────────────────────────────────

const MATCAP_OPTIONS = {
    'Brilliant Blue': '/textures/matcaps/brillant-blue.png',
    'Emerald': '/textures/matcaps/emerald.png',
    'Gold': '/textures/matcaps/gold.png',
    'Leather Black': '/textures/matcaps/leather-black.png',
    'Leather Gray': '/textures/matcaps/leather-gray.png',
    'Mate Gray': '/textures/matcaps/mate-gray.png',
    'Mate White': '/textures/matcaps/mate-white.png',
    'Plastic Black': '/textures/matcaps/plastic-black.png',
    'Plastic Blue': '/textures/matcaps/plastic-blue.png',
    'Plastic White': '/textures/matcaps/plastic-white.png',
    'Polished Metal': '/textures/matcaps/polished-metal.png',
    'Rubber Black': '/textures/matcaps/rubber-black.png',
}

const ARTWORKS: Artwork[] = [
    // Room 0 - Main Hall
    {
        id: 1, title: 'Eternal Cosmos', artist: 'Elena Vasquez', year: '2021',
        description: 'A journey through the infinite universe.',
        position: [0, 2.2, -9.7], rotation: [0, 0, 0], width: 3, height: 2,
        colors: ['#0a0a2e', '#1a1a5e', '#ffd700'], style: 'abstract', roomId: 0
    },
    {
        id: 2, title: 'Crimson Fields', artist: 'James Thornton', year: '2019',
        description: 'Meditation on beauty and loss.',
        position: [-4, 2.2, -9.7], rotation: [0, 0, 0], width: 2, height: 2.5,
        colors: ['#cc2200', '#8B0000', '#228B22'], style: 'landscape', roomId: 0
    },
    {
        id: 3, title: 'Bauhaus Reverie', artist: 'Klaus Müller', year: '2018',
        description: 'Tribute to the Bauhaus movement.',
        position: [-9.7, 2.2, -3], rotation: [0, Math.PI / 2, 0], width: 2.5, height: 2,
        colors: ['#ff0000', '#0000ff', '#ffff00'], style: 'geometric', roomId: 0
    },

    // Room 1 - West Wing
    {
        id: 4, title: 'Glacial Bloom', artist: 'Soren Berg', year: '2024',
        description: 'The cold beauty of a frozen spring.',
        position: [-25, 2.2, -9.7], rotation: [0, 0, 0], width: 2.5, height: 2.5,
        colors: ['#e0f7fa', '#80deea', '#00bcd4'], style: 'impressionist', roomId: 1
    },
    {
        id: 5, title: 'Night Market', artist: 'Chen Wei', year: '2023',
        description: 'Vibrant energy of a neon-lit bazaar.',
        position: [-34.7, 2.2, 0], rotation: [0, Math.PI / 2, 0], width: 3, height: 2,
        colors: ['#ff4081', '#7b1fa2', '#303f9f'], style: 'abstract', roomId: 1
    },
    {
        id: 6, title: 'The Silent Watcher', artist: 'Maya Oka', year: '2022',
        description: 'A figure lost in contemplation.',
        position: [-25, 2.2, 9.7], rotation: [0, Math.PI, 0], width: 1.8, height: 2.6,
        colors: ['#212121', '#424242', '#bdbdbd'], style: 'portrait', roomId: 1
    },

    // Room 2 - East Wing
    {
        id: 7, title: 'Solar Flare', artist: 'Amara Okafor', year: '2023',
        description: 'The raw power of our closest star.',
        position: [25, 2.2, -9.7], rotation: [0, 0, 0], width: 3, height: 2,
        colors: ['#ff6f00', '#ffab00', '#ffff00'], style: 'geometric', roomId: 2
    },
    {
        id: 8, title: 'Oasis of Light', artist: 'Hassan Aziz', year: '2021',
        description: 'Finding calm in the heart of the desert.',
        position: [34.7, 2.2, 0], rotation: [0, -Math.PI / 2, 0], width: 2.2, height: 2.2,
        colors: ['#ffe082', '#ffb300', '#3e2723'], style: 'landscape', roomId: 2
    },
    {
        id: 9, title: 'Digital Echo', artist: 'Pixel Void', year: '2025',
        description: 'Fragments of memory in the data stream.',
        position: [25, 2.2, 9.7], rotation: [0, Math.PI, 0], width: 2.8, height: 1.8,
        colors: ['#00e676', '#00b0ff', '#6200ea'], style: 'abstract', roomId: 2
    },
]

// ─── Artwork Frame ────────────────────────────────────────────────────────────

function ArtworkFrame({
    artwork,
    onFocus,
    frameMatcapPath,
    whiteMatcapPath,
    blackMatcapPath,
    frameColor,
    paintingColor,
    plaqueColor,
}: {
    artwork: Artwork
    onFocus: (a: Artwork | null) => void
    frameMatcapPath: string
    whiteMatcapPath: string
    blackMatcapPath: string
    frameColor: string
    paintingColor: string
    plaqueColor: string
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const frameRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const texture = useMemo(() => generatePaintingTexture(artwork), [artwork])

    const matcapFrame = useTexture(frameMatcapPath) as THREE.Texture
    const matcapWhite = useTexture(whiteMatcapPath) as THREE.Texture
    const matcapBlack = useTexture(blackMatcapPath) as THREE.Texture

    return (
        <group position={artwork.position} rotation={artwork.rotation}>
            {/* Painting canvas */}
            <mesh
                ref={meshRef}
                position={[0, 0, 0.02]}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onClick={() => onFocus(artwork)}
            >
                <planeGeometry args={[artwork.width, artwork.height]} />
                <meshMatcapMaterial map={texture} matcap={matcapWhite} color={paintingColor} />
            </mesh>

            {/* Frame - outer border */}
            <mesh ref={frameRef} position={[0, 0, 0]}>
                <boxGeometry args={[artwork.width + 0.18, artwork.height + 0.18, 0.08]} />
                <meshMatcapMaterial matcap={matcapFrame} color={hovered ? '#ffffff' : frameColor} />
            </mesh>

            {/* Frame inner bevel */}
            <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[artwork.width + 0.06, artwork.height + 0.06, 0.04]} />
                <meshMatcapMaterial matcap={matcapFrame} color={frameColor} />
            </mesh>

            {/* Label plaque */}
            <mesh position={[0, -(artwork.height / 2) - 0.22, 0.01]}>
                <boxGeometry args={[1.4, 0.22, 0.02]} />
                <meshMatcapMaterial matcap={matcapBlack} color={plaqueColor} />
            </mesh>

            {/* Click Indicator */}
            <Html position={[0, artwork.height / 2 + 0.35, 0.05]} center>
                <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: '#c9a84c', 
                    boxShadow: '0 0 10px #c9a84c', border: '2px solid white',
                    opacity: 0.8, cursor: 'pointer'
                }} />
            </Html>
            <Text
                position={[0, -(artwork.height / 2) - 0.19, 0.03]}
                fontSize={0.07}
                color="#d4c5a0"
                anchorX="center"
                anchorY="middle"
                maxWidth={1.3}
            >
                {artwork.title}
            </Text>
            <Text
                position={[0, -(artwork.height / 2) - 0.28, 0.03]}
                fontSize={0.055}
                color="#a09070"
                anchorX="center"
                anchorY="middle"
            >
                {`${artwork.artist}, ${artwork.year}`}
            </Text>
        </group>
    )
}

// ─── Gallery Room ─────────────────────────────────────────────────────────────

function Room({
    data,
    config,
    onMove,
}: {
    data: RoomData
    config: any
    onMove: (roomId: number) => void
}) {
    const matcapFloor = useTexture(config.floorMatcap) as THREE.Texture
    const matcapWall = useTexture(config.wallMatcap) as THREE.Texture
    const matcapCeil = useTexture(config.ceilMatcap) as THREE.Texture
    const matcapAccent = useTexture(config.accentMatcap) as THREE.Texture

    const W = 20, H = 5.5, D = 20
    const [x, y, z] = data.position

    return (
        <group position={[x, y, z]}>
            {/* Pulsing Indicators for Hallways */}
            {data.id === 0 && (
                <>
                    <HallwayPulse position={[-8, 0.1, 0]} label="← West Wing (Impressionism)" onClick={() => onMove(1)} />
                    <HallwayPulse position={[8, 0.1, 0]} label="East Wing (Modern) →" onClick={() => onMove(2)} />
                </>
            )}
            {data.id !== 0 && (
                <HallwayPulse 
                    position={[data.id === 1 ? 8 : -8, 0.1, 0]} 
                    label="↩ Back to Main Hall" 
                    onClick={() => onMove(0)} 
                />
            )}

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[W, D, 1, 1]} />
                <meshMatcapMaterial matcap={matcapFloor} color={config.floorColor} />
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
                <planeGeometry args={[W, D]} />
                <meshMatcapMaterial matcap={matcapCeil} color={config.ceilColor} />
            </mesh>

            {/* Walls logic */}
            {/* North wall */}
            <mesh position={[0, H / 2, -D / 2]}>
                <planeGeometry args={[W, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={config.wallColor} />
            </mesh>
            {/* South wall */}
            <mesh rotation={[0, Math.PI, 0]} position={[0, H / 2, D / 2]}>
                <planeGeometry args={[W, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={config.wallColor} />
            </mesh>
            {/* West wall - only if it's the West Wing boundary */}
            {data.id === 1 && (
                <mesh rotation={[0, Math.PI / 2, 0]} position={[-W / 2, H / 2, 0]}>
                    <planeGeometry args={[D, H]} />
                    <meshMatcapMaterial matcap={matcapWall} color={config.wallColor} />
                </mesh>
            )}
            {/* East wall - only if it's the East Wing boundary */}
            {data.id === 2 && (
                <mesh rotation={[0, -Math.PI / 2, 0]} position={[W / 2, H / 2, 0]}>
                    <planeGeometry args={[D, H]} />
                    <meshMatcapMaterial matcap={matcapWall} color={config.wallColor} />
                </mesh>
            )}

            {/* Baseboard trim */}
            {[
                { pos: [0, 0.1, -D / 2 + 0.02] as [number, number, number], rot: [0, 0, 0] as [number, number, number], w: W },
                { pos: [0, 0.1, D / 2 - 0.02] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], w: W },
            ].map((b, i) => (
                <mesh key={`base-${i}`} position={b.pos} rotation={b.rot}>
                    <boxGeometry args={[b.w, 0.2, 0.05]} />
                    <meshMatcapMaterial matcap={matcapAccent} color={config.accentColor} />
                </mesh>
            ))}

            {/* Central bench with legs */}
            <group position={[0, 0.22, 0]}>
                <mesh>
                    <boxGeometry args={[3, 0.1, 0.8]} />
                    <meshMatcapMaterial matcap={matcapAccent} color={config.accentColor} />
                </mesh>
                {[[-1.2, -0.3], [1.2, -0.3], [-1.2, 0.3], [1.2, 0.3]].map((legPos, i) => (
                    <mesh key={i} position={[legPos[0], -0.11, legPos[1]]}>
                        <meshMatcapMaterial matcap={matcapAccent} color="#333333" />
                    </mesh>
                ))}
            </group>
        </group>
    )
}

function HallwayPulse({ position, onClick, label }: { position: [number, number, number], onClick: () => void, label: string }) {
    const meshRef = useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.2
        meshRef.current.scale.set(s, 1, s)
    })
    return (
        <group position={position} onClick={onClick}>
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1, 32]} />
                <meshBasicMaterial color="#c9a84c" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <Html center position={[0, 1.2, 0]}>
                <div style={{
                    color: '#f0e5c5', background: 'rgba(5,4,10,0.92)', padding: '10px 24px',
                    borderRadius: 30, whiteSpace: 'nowrap', border: '2px solid #c9a84c', 
                    cursor: 'pointer', fontSize: 16, fontWeight: 700, letterSpacing: 1,
                    boxShadow: '0 0 25px rgba(201,168,76,0.3)',
                    fontFamily: 'monospace', textTransform: 'uppercase'
                }}>
                    {label}
                </div>
            </Html>
        </group>
    )
}

// ─── (First-Person controller removed — using OrbitControls) ─────────────────

// ─── (Particles removed for performance) ───────────────────────────────────

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
    onFocus,
    config,
    focusedArtwork,
    currentRoomId,
    onMove,
}: {
    onFocus: (a: Artwork | null) => void
    config: any
    focusedArtwork: Artwork | null
    currentRoomId: number
    onMove: (roomId: number) => void
}) {
    const controlsRef = useRef<any>(null)
    const currentRoom = ROOMS.find(r => r.id === currentRoomId)!
    
    const lastCameraState = useRef({
        position: new THREE.Vector3(0, 4, 12),
        target: new THREE.Vector3(0, 1.8, 0),
        saved: false
    })

    useFrame((state) => {
        if (!controlsRef.current) return

        if (focusedArtwork) {
            controlsRef.current.enabled = false
            if (!lastCameraState.current.saved) {
                lastCameraState.current.position.copy(state.camera.position)
                lastCameraState.current.target.copy(controlsRef.current.target)
                lastCameraState.current.saved = true
            }

            const dist = 3.8
            const rotY = focusedArtwork.rotation[1]
            const targetPos = new THREE.Vector3(
                focusedArtwork.position[0] + Math.sin(rotY) * dist,
                focusedArtwork.position[1],
                focusedArtwork.position[2] + Math.cos(rotY) * dist
            )
            const targetLookAt = new THREE.Vector3(...focusedArtwork.position)

            state.camera.position.lerp(targetPos, 0.1)
            controlsRef.current.target.lerp(targetLookAt, 0.1)
            controlsRef.current.update()
        } else {
            // General room navigation
            const targetCenter = new THREE.Vector3(...currentRoom.position).add(new THREE.Vector3(0, 1.8, 0))
            const targetCamPos = new THREE.Vector3(...currentRoom.position).add(new THREE.Vector3(0, 4, 12))

            if (lastCameraState.current.saved) {
                // Return from artwork
                state.camera.position.lerp(lastCameraState.current.position, 0.1)
                controlsRef.current.target.lerp(lastCameraState.current.target, 0.1)
                if (state.camera.position.distanceTo(lastCameraState.current.position) < 0.1) {
                    lastCameraState.current.saved = false
                    controlsRef.current.enabled = true
                }
            } else {
                // Room transition or free movement
                controlsRef.current.target.lerp(targetCenter, 0.05)
                // Only force camera pos if room changed significantly
                if (state.camera.position.distanceTo(new THREE.Vector3(...currentRoom.position)) > 40) {
                     state.camera.position.lerp(targetCamPos, 0.05)
                }
                controlsRef.current.enabled = true
            }
            controlsRef.current.update()
        }
    })

    return (
        <>
            <Stats />
            <color attach="background" args={['#05040a']} />
            
            {ROOMS.map(room => (
                <Room key={room.id} data={room} config={config} onMove={onMove} />
            ))}

            {ARTWORKS.map((aw) => (
                <ArtworkFrame
                    key={aw.id}
                    artwork={aw}
                    onFocus={onFocus}
                    frameMatcapPath={config.frameMatcap}
                    whiteMatcapPath={config.paintingMatcap}
                    blackMatcapPath={config.plaqueMatcap}
                    frameColor={config.frameColor}
                    paintingColor={config.paintingColor}
                    plaqueColor={config.plaqueColor}
                />
            ))}

            <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.55}
                zoomSpeed={0.8}
                panSpeed={0.6}
                minDistance={2}
                maxDistance={16}
                maxPolarAngle={Math.PI / 2 - 0.05}
                target={[0, 1.8, 0]}
            />
        </>
    )
}

// ─── Artwork Detail Panel ─────────────────────────────────────────────────────

function ArtworkPanel({
    artwork,
    onClose,
    onNext,
    onPrev,
}: {
    artwork: Artwork
    onClose: () => void
    onNext: () => void
    onPrev: () => void
}) {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'linear-gradient(to top, rgba(5,4,10,0.98) 0%, rgba(5,4,10,0.85) 80%, transparent 100%)',
                padding: '30px 40px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 40,
                borderTop: '1px solid rgba(200,169,78,0.2)',
                animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                    onClick={onPrev}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#c9a84c',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        cursor: 'pointer',
                        fontSize: 20,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                    ‹
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 20 }}>
                    {artwork.colors.slice(0, 5).map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
                    ))}
                </div>

                <div style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#e8d5a0', fontFamily: 'Georgia, serif' }}>
                            {artwork.title}
                        </h2>
                    </div>
                    <div style={{ color: '#8a7a5a', fontSize: 13, fontFamily: 'monospace' }}>
                        {artwork.artist} &nbsp;·&nbsp; {artwork.year}
                    </div>
                </div>
            </div>

            <p style={{ margin: 0, color: '#c0ad8a', fontSize: 15, maxWidth: 500, lineHeight: 1.6, flex: 1 }}>
                {artwork.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                    onClick={onNext}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#c9a84c',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        cursor: 'pointer',
                        fontSize: 20,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                    ›
                </button>

                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(200,169,78,0.15)',
                        border: '1px solid rgba(200,169,78,0.5)',
                        color: '#f0e5c5',
                        borderRadius: 8,
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,169,78,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,169,78,0.15)')}
                >
                    ← VOLVER
                </button>
            </div>
        </div>
    )
}

// ─── HUD Overlay ──────────────────────────────────────────────────────────────

function HUD({ focusedArtwork }: { focusedArtwork: Artwork | null }) {
    if (focusedArtwork) return null

    return (
        <>
            {/* Controls hint */}
            <div style={{
                position: 'fixed', bottom: 24, right: 24,
                color: '#5a4a2a', fontSize: 11, fontFamily: 'monospace',
                lineHeight: 1.9, textAlign: 'right', zIndex: 50, pointerEvents: 'none',
            }}>
                Left drag — Orbit &nbsp;|&nbsp; Scroll — Zoom &nbsp;|&nbsp; Right drag — Pan &nbsp;|&nbsp; Click painting — Inspect
            </div>

            {/* Gallery name watermark */}
            <div style={{
                position: 'fixed', top: 24, left: 32,
                color: '#4a3a1a', fontSize: 13, fontFamily: 'Georgia, serif',
                letterSpacing: 3, textTransform: 'uppercase', zIndex: 50, pointerEvents: 'none',
            }}>
                Gallery Lumière
            </div>

            {/* Artwork counter */}
            <div style={{
                position: 'fixed', top: 24, right: 32,
                color: '#4a3a1a', fontSize: 11, fontFamily: 'monospace',
                letterSpacing: 2, zIndex: 50, pointerEvents: 'none',
            }}>
                {ARTWORKS.length} WORKS
            </div>
        </>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArtGallery() {
    const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null)
    const [currentRoomId, setCurrentRoomId] = useState(0)

    const config = useControls({
        Room: folder({
            floorMatcap: { value: MATCAP_OPTIONS['Polished Metal'], options: MATCAP_OPTIONS, label: 'Floor' },
            floorColor: { value: '#e2e2e2', label: 'Floor Color' },
            wallMatcap: { value: MATCAP_OPTIONS['Mate White'], options: MATCAP_OPTIONS, label: 'Walls' },
            wallColor: { value: '#ffffff', label: 'Wall Color' },
            ceilMatcap: { value: MATCAP_OPTIONS['Plastic White'], options: MATCAP_OPTIONS, label: 'Ceiling' },
            ceilColor: { value: '#ffffff', label: 'Ceiling Color' },
            accentMatcap: { value: MATCAP_OPTIONS['Gold'], options: MATCAP_OPTIONS, label: 'Accents' },
            accentColor: { value: '#ffffff', label: 'Accent Color' },
        }),
        Artwork: folder({
            frameMatcap: { value: MATCAP_OPTIONS['Gold'], options: MATCAP_OPTIONS, label: 'Frames' },
            frameColor: { value: '#ffffff', label: 'Frame Color' },
            paintingMatcap: { value: MATCAP_OPTIONS['Mate White'], options: MATCAP_OPTIONS, label: 'Painting' },
            paintingColor: { value: '#ffffff', label: 'Painting Color' },
            plaqueMatcap: { value: MATCAP_OPTIONS['Plastic Black'], options: MATCAP_OPTIONS, label: 'Plaques' },
            plaqueColor: { value: '#ffffff', label: 'Plaque Color' },
        }),
    })

    const handleFocus = useCallback((artwork: Artwork | null) => {
        setFocusedArtwork(artwork)
    }, [])

    const handleMove = useCallback((roomId: number) => {
        setCurrentRoomId(roomId)
        setFocusedArtwork(null)
    }, [])

    const handleNext = useCallback(() => {
        if (!focusedArtwork) return
        const roomArtworks = ARTWORKS.filter(a => a.roomId === currentRoomId)
        const idx = roomArtworks.findIndex(a => a.id === focusedArtwork.id)
        setFocusedArtwork(roomArtworks[(idx + 1) % roomArtworks.length])
    }, [focusedArtwork, currentRoomId])

    const handlePrev = useCallback(() => {
        if (!focusedArtwork) return
        const roomArtworks = ARTWORKS.filter(a => a.roomId === currentRoomId)
        const idx = roomArtworks.findIndex(a => a.id === focusedArtwork.id)
        setFocusedArtwork(roomArtworks[(idx - 1 + roomArtworks.length) % roomArtworks.length])
    }, [focusedArtwork, currentRoomId])

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#05040a', overflow: 'hidden', position: 'relative' }}>
            <Canvas
                camera={{ fov: 75, near: 0.1, far: 100, position: [0, 4, 12] }}
                gl={{ antialias: true }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <Scene 
                    onFocus={handleFocus} 
                    config={config} 
                    focusedArtwork={focusedArtwork} 
                    currentRoomId={currentRoomId}
                    onMove={handleMove}
                />
            </Canvas>

            <HUD focusedArtwork={focusedArtwork} />

            {focusedArtwork && (
                <ArtworkPanel 
                    artwork={focusedArtwork} 
                    onClose={() => setFocusedArtwork(null)} 
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            )}
        </div>
    )
}
