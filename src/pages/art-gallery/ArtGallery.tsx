import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    OrbitControls,
    Text,
    useTexture,
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
}

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
    // Main Hall - North wall
    {
        id: 1, title: 'Eternal Cosmos', artist: 'Elena Vasquez', year: '2021',
        description: 'A journey through the infinite universe, where matter and energy dance in perfect harmony.',
        position: [0, 2.2, -9.7], rotation: [0, 0, 0], width: 3, height: 2,
        colors: ['#0a0a2e', '#1a1a5e', '#6a0dad', '#ff6b6b', '#ffd700'],
        style: 'abstract'
    },
    {
        id: 2, title: 'Crimson Fields', artist: 'James Thornton', year: '2019',
        description: 'Inspired by the vast poppy fields of Flanders, a meditation on beauty and loss.',
        position: [-4, 2.2, -9.7], rotation: [0, 0, 0], width: 2, height: 2.5,
        colors: ['#87CEEB', '#4a90d9', '#cc2200', '#8B0000', '#228B22'],
        style: 'landscape'
    },
    {
        id: 3, title: 'Lady of the Lake', artist: 'Sofia Mendez', year: '2020',
        description: 'A timeless portrait capturing the mystery and elegance of the feminine spirit.',
        position: [4, 2.2, -9.7], rotation: [0, 0, 0], width: 1.8, height: 2.5,
        colors: ['#2c1810', '#3d2b1f', '#1a3a4a', '#c8956c'],
        style: 'portrait'
    },
    // Main Hall - West wall
    {
        id: 4, title: 'Bauhaus Reverie', artist: 'Klaus Müller', year: '2018',
        description: 'A tribute to the revolutionary Bauhaus movement, exploring form and function.',
        position: [-9.7, 2.2, -3], rotation: [0, Math.PI / 2, 0], width: 2.5, height: 2,
        colors: ['#ffffff', '#ff0000', '#0000ff', '#ffff00', '#000000'],
        style: 'geometric'
    },
    {
        id: 5, title: 'Whispers of Monet', artist: 'Claire Dubois', year: '2022',
        description: 'An impressionist ode to the water lilies, blurring the line between dream and reality.',
        position: [-9.7, 2.2, 3], rotation: [0, Math.PI / 2, 0], width: 2.5, height: 1.8,
        colors: ['#2d5a8e', '#4a8cb5', '#7ec8c8', '#e8d5a3', '#f4a460', '#228b22'],
        style: 'impressionist'
    },
    // Main Hall - East wall
    {
        id: 6, title: 'Neon Genesis', artist: 'Yuki Tanaka', year: '2023',
        description: 'Digital strokes of neon brilliance, a vision of humanity in the cyberpunk age.',
        position: [9.7, 2.2, -3], rotation: [0, -Math.PI / 2, 0], width: 2.5, height: 2,
        colors: ['#0d0d1a', '#ff00ff', '#00ffff', '#ff6600', '#9900ff'],
        style: 'abstract'
    },
    {
        id: 7, title: 'Mediterranean Dusk', artist: 'Marco Ricci', year: '2020',
        description: 'The last light of day over the Aegean Sea, painted with raw emotion and golden warmth.',
        position: [9.7, 2.2, 3], rotation: [0, -Math.PI / 2, 0], width: 2.5, height: 1.8,
        colors: ['#ff6b35', '#f7931e', '#ffcd3c', '#1a5276', '#0e3460'],
        style: 'landscape'
    },
    // Wing B - South area
    {
        id: 8, title: 'The Architect', artist: 'Anya Petrova', year: '2017',
        description: 'A study in structural geometry, where mathematics becomes art.',
        position: [0, 2.2, 9.7], rotation: [0, Math.PI, 0], width: 3, height: 2,
        colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483'],
        style: 'geometric'
    },
    {
        id: 9, title: 'Dreams of Autumn', artist: 'Hiroshi Nakamura', year: '2021',
        description: 'A haiku in pigment — the fleeting beauty of Japanese autumn leaves.',
        position: [-4, 2.2, 9.7], rotation: [0, Math.PI, 0], width: 2, height: 2.5,
        colors: ['#ff8c00', '#ff4500', '#dc143c', '#8b0000', '#2f4f4f'],
        style: 'impressionist'
    },
    {
        id: 10, title: 'The Wanderer', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        position: [4, 2.2, 9.7], rotation: [0, Math.PI, 0], width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
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

    const matcapFrame = useTexture(frameMatcapPath)
    const matcapWhite = useTexture(whiteMatcapPath)
    const matcapBlack = useTexture(blackMatcapPath)

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

function GalleryRoom({
    floorMatcapPath,
    wallMatcapPath,
    ceilMatcapPath,
    accentMatcapPath,
    floorColor,
    wallColor,
    ceilColor,
    accentColor,
}: {
    floorMatcapPath: string
    wallMatcapPath: string
    ceilMatcapPath: string
    accentMatcapPath: string
    floorColor: string
    wallColor: string
    ceilColor: string
    accentColor: string
}) {
    const matcapFloor = useTexture(floorMatcapPath)
    const matcapWall = useTexture(wallMatcapPath)
    const matcapCeil = useTexture(ceilMatcapPath)
    const matcapAccent = useTexture(accentMatcapPath)
    const matcapWhite = useTexture('/textures/matcaps/mate-white.png')

    const W = 20, H = 5.5, D = 20

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[W, D, 1, 1]} />
                <meshMatcapMaterial matcap={matcapFloor} color={floorColor} />
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
                <planeGeometry args={[W, D]} />
                <meshMatcapMaterial matcap={matcapCeil} color={ceilColor} />
            </mesh>

            {/* North wall */}
            <mesh position={[0, H / 2, -D / 2]}>
                <planeGeometry args={[W, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={wallColor} />
            </mesh>

            {/* South wall */}
            <mesh rotation={[0, Math.PI, 0]} position={[0, H / 2, D / 2]}>
                <planeGeometry args={[W, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={wallColor} />
            </mesh>

            {/* West wall */}
            <mesh rotation={[0, Math.PI / 2, 0]} position={[-W / 2, H / 2, 0]}>
                <planeGeometry args={[D, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={wallColor} />
            </mesh>

            {/* East wall */}
            <mesh rotation={[0, -Math.PI / 2, 0]} position={[W / 2, H / 2, 0]}>
                <planeGeometry args={[D, H]} />
                <meshMatcapMaterial matcap={matcapWall} color={wallColor} />
            </mesh>

            {/* Baseboard trim */}
            {[
                { pos: [0, 0.1, -D / 2 + 0.05] as [number, number, number], rot: [0, 0, 0] as [number, number, number], w: W },
                { pos: [0, 0.1, D / 2 - 0.05] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], w: W },
                { pos: [-W / 2 + 0.05, 0.1, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], w: D },
                { pos: [W / 2 - 0.05, 0.1, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], w: D },
            ].map((b, i) => (
                <mesh key={`base-${i}`} position={b.pos} rotation={b.rot}>
                    <boxGeometry args={[b.w, 0.2, 0.05]} />
                    <meshMatcapMaterial matcap={matcapAccent} color={accentColor} />
                </mesh>
            ))}

            {/* Central bench */}
            <group position={[0, 0, 0]}>
                <mesh position={[0, 0.22, 0]}>
                    <boxGeometry args={[2.5, 0.06, 0.6]} />
                    <meshMatcapMaterial matcap={matcapAccent} color={accentColor} />
                </mesh>
                {[-0.9, 0.9].map((x, i) => [
                    <mesh key={`leg-${i}a`} position={[x, 0.11, -0.22]}>
                        <boxGeometry args={[0.08, 0.22, 0.06]} />
                        <meshMatcapMaterial matcap={matcapFloor} color="#111111" />
                    </mesh>,
                    <mesh key={`leg-${i}b`} position={[x, 0.11, 0.22]}>
                        <boxGeometry args={[0.08, 0.22, 0.06]} />
                        <meshMatcapMaterial matcap={matcapFloor} color="#111111" />
                    </mesh>
                ])}
            </group>

            {/* Ceiling chandeliers */}
            {[[-4, 0, -4], [4, 0, -4], [-4, 0, 4], [4, 0, 4]].map(([x, , z], i) => (
                <group key={`chandelier-${i}`} position={[x, H - 0.1, z]}>
                    <mesh>
                        <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
                        <meshMatcapMaterial matcap={matcapAccent} color={accentColor} />
                    </mesh>
                    <mesh position={[0, -0.25, 0]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshMatcapMaterial matcap={matcapWhite} color={accentColor} />
                    </mesh>
                </group>
            ))}
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
}: {
    onFocus: (a: Artwork | null) => void
    config: any
    focusedArtwork: Artwork | null
}) {
    const controlsRef = useRef<any>(null)
    const lastCameraState = useRef({
        position: new THREE.Vector3(0, 4, 12),
        target: new THREE.Vector3(0, 1.8, 0),
        saved: false
    })

    useFrame((state, delta) => {
        if (!controlsRef.current) return

        const targetPos = new THREE.Vector3()
        const targetLookAt = new THREE.Vector3()

        if (focusedArtwork) {
            // Save state once before moving
            if (!lastCameraState.current.saved) {
                lastCameraState.current.position.copy(state.camera.position)
                lastCameraState.current.target.copy(controlsRef.current.target)
                lastCameraState.current.saved = true
            }

            // Calculate front position based on artwork rotation
            const dist = 3.8
            const rotY = focusedArtwork.rotation[1]
            targetPos.set(
                focusedArtwork.position[0] + Math.sin(rotY) * dist,
                focusedArtwork.position[1],
                focusedArtwork.position[2] + Math.cos(rotY) * dist
            )
            targetLookAt.set(...focusedArtwork.position)
        } else {
            if (lastCameraState.current.saved) {
                targetPos.copy(lastCameraState.current.position)
                targetLookAt.copy(lastCameraState.current.target)
                
                // Reset saved flag when arrived (approx)
                if (state.camera.position.distanceTo(targetPos) < 0.01) {
                    lastCameraState.current.saved = false
                }
            } else {
                return // No move needed
            }
        }

        // Smoothly interpolate
        state.camera.position.lerp(targetPos, 0.1)
        controlsRef.current.target.lerp(targetLookAt, 0.1)
        controlsRef.current.update()
    })

    return (
        <>
            <color attach="background" args={['#05040a']} />
            <GalleryRoom
                floorMatcapPath={config.floorMatcap}
                wallMatcapPath={config.wallMatcap}
                ceilMatcapPath={config.ceilMatcap}
                accentMatcapPath={config.accentMatcap}
                floorColor={config.floorColor}
                wallColor={config.wallColor}
                ceilColor={config.ceilColor}
                accentColor={config.accentColor}
            />

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

function ArtworkPanel({ artwork, onClose }: { artwork: Artwork; onClose: () => void }) {
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
                alignItems: 'flex-end',
                gap: 32,
                borderTop: '1px solid rgba(200,169,78,0.2)',
                animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
        >
            {/* Color palette preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {artwork.colors.slice(0, 5).map((c, i) => (
                    <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#e8d5a0', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif' }}>
                        {artwork.title}
                    </h2>
                    <span style={{ color: '#c9a84c', fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>
                        {artwork.style}
                    </span>
                </div>
                <div style={{ color: '#8a7a5a', fontSize: 13, marginBottom: 10, fontFamily: 'monospace' }}>
                    {artwork.artist} &nbsp;·&nbsp; {artwork.year}
                </div>
                <p style={{ margin: 0, color: '#c0ad8a', fontSize: 15, maxWidth: 640, lineHeight: 1.65 }}>
                    {artwork.description}
                </p>
            </div>

            <button
                onClick={onClose}
                style={{
                    background: 'rgba(200,169,78,0.2)',
                    border: '1px solid rgba(200,169,78,0.6)',
                    color: '#f0e5c5',
                    borderRadius: 8,
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    boxShadow: '0 0 15px rgba(200,169,78,0.1)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(200,169,78,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(200,169,78,0.8)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(200,169,78,0.2)'
                    e.currentTarget.style.borderColor = 'rgba(200,169,78,0.6)'
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                ← VOLVER A LA GALERÍA
            </button>
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

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#05040a', overflow: 'hidden', position: 'relative' }}>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
      `}</style>

            <Canvas
                camera={{ fov: 75, near: 0.1, far: 100, position: [0, 4, 12] }}
                gl={{ antialias: true }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <Scene onFocus={handleFocus} config={config} focusedArtwork={focusedArtwork} />
            </Canvas>

            <HUD focusedArtwork={focusedArtwork} />

            {focusedArtwork && (
                <ArtworkPanel artwork={focusedArtwork} onClose={() => setFocusedArtwork(null)} />
            )}
        </div>
    )
}
