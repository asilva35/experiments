import { useRef, useState, useCallback, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import {
    OrbitControls,
    Text,
    useTexture,
    useGLTF,
    //Stats,
} from '@react-three/drei'
import { useControls, folder, Leva } from 'leva'
import * as THREE from 'three'
import { WOOD_FLOOR_FRAGMENT_SHADER, WOOD_FLOOR_VERTEX_SHADER } from '../../components/WoodFloorShader'
import { WALL_FRAGMENT_SHADER, WALL_VERTEX_SHADER } from '../../components/WallShader'
import { PlayIcon, Square } from 'lucide-react'

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
    imagePath?: string
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

const ARTWORKS: Omit<Artwork, 'position' | 'rotation'>[] = [
    {
        id: 1, title: 'Patacón', artist: 'Eliana Vivas', year: '2026',
        description: 'Una deliciosa representación de la cultura caribeña, capturada en un momento de perfección dorada.',
        width: 1.8, height: 2.5,
        colors: ['#f39c12', '#d35400', '#f1c40f', '#f7dc6f'],
        imagePath: '/art/patacon.jpg',
        style: 'portrait'
    },
    {
        id: 2, title: 'Kona', artist: 'Eliana Vivas', year: '2026',
        description: 'Inspired by the vast poppy fields of Flanders, a meditation on beauty and loss.',
        width: 2, height: 2.5,
        colors: ['#87CEEB', '#4a90d9', '#cc2200', '#8B0000', '#228B22'],
        imagePath: '/art/kona.jpg',
        style: 'landscape'
    },
    {
        id: 3, title: 'Mona', artist: 'Eliana Vivas', year: '2026',
        description: 'A timeless portrait capturing the mystery and elegance of the feminine spirit.',
        width: 2.2, height: 2.5,
        colors: ['#2c1810', '#3d2b1f', '#1a3a4a', '#c8956c'],
        imagePath: '/art/mona.jpg',
        style: 'portrait'
    },
    {
        id: 4, title: 'Bauhaus Reverie', artist: 'Klaus Müller', year: '2018',
        description: 'A tribute to the revolutionary Bauhaus movement, exploring form and function.',
        width: 2.5, height: 2,
        colors: ['#ffffff', '#ff0000', '#0000ff', '#ffff00', '#000000'],
        style: 'geometric'
    },
    {
        id: 5, title: 'Whispers of Monet', artist: 'Claire Dubois', year: '2022',
        description: 'An impressionist ode to the water lilies, blurring the line between dream and reality.',
        width: 2.5, height: 1.8,
        colors: ['#2d5a8e', '#4a8cb5', '#7ec8c8', '#e8d5a3', '#f4a460', '#228b22'],
        style: 'impressionist'
    },
    {
        id: 6, title: 'Six', artist: 'Yuki Tanaka', year: '2023',
        description: 'Digital strokes of neon brilliance, a vision of humanity in the cyberpunk age.',
        width: 2.5, height: 2,
        colors: ['#0d0d1a', '#ff00ff', '#00ffff', '#ff6600', '#9900ff'],
        style: 'abstract'
    },
    {
        id: 7, title: 'Seven', artist: 'Marco Ricci', year: '2020',
        description: 'The last light of day over the Aegean Sea, painted with raw emotion and golden warmth.',
        width: 2.5, height: 1.8,
        colors: ['#ff6b35', '#f7931e', '#ffcd3c', '#1a5276', '#0e3460'],
        style: 'landscape'
    },
    // Wing B - South area
    {
        id: 8, title: 'Eight', artist: 'Anya Petrova', year: '2017',
        description: 'A study in structural geometry, where mathematics becomes art.',
        width: 3, height: 2,
        colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483'],
        style: 'geometric'
    },
    {
        id: 9, title: 'Nine', artist: 'Hiroshi Nakamura', year: '2021',
        description: 'A haiku in pigment — the fleeting beauty of Japanese autumn leaves.',
        width: 2, height: 2.5,
        colors: ['#ff8c00', '#ff4500', '#dc143c', '#8b0000', '#2f4f4f'],
        style: 'impressionist'
    },
    {
        id: 10, title: 'Ten', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 11, title: 'Eleven', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 12, title: 'Twelve', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 13, title: 'Thirteen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 14, title: 'Fourteen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 15, title: 'Fifteen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 16, title: 'Sixteen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 17, title: 'Seventeen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
    {
        id: 18, title: 'Eighteen', artist: 'Léa Fontaine', year: '2019',
        description: 'A solitary figure against the vast unknown — a search for meaning in the modern age.',
        width: 1.8, height: 2.5,
        colors: ['#34495e', '#2c3e50', '#7f8c8d', '#bdc3c7'],
        style: 'portrait'
    },
]

// ─── Artwork Material Components ─────────────────────────────────────────────

function ImagePaintingMaterial({ imagePath }: { imagePath: string }) {
    const texture = useTexture(imagePath)
    // Three.js >= 0.152 uses colorSpace
    if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace
    }
    return <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
}

function GeneratedPaintingMaterial({ artwork, matcapWhite, paintingColor }: { artwork: Artwork, matcapWhite: THREE.Texture, paintingColor: string }) {
    const texture = useMemo(() => generatePaintingTexture(artwork), [artwork])
    return <meshMatcapMaterial map={texture} matcap={matcapWhite} color={paintingColor} />
}

function PaintingMaterial({ artwork, matcapWhite, paintingColor }: { artwork: Artwork, matcapWhite: THREE.Texture, paintingColor: string }) {
    if (artwork.imagePath) {
        return <ImagePaintingMaterial imagePath={artwork.imagePath} />
    }
    return <GeneratedPaintingMaterial artwork={artwork} matcapWhite={matcapWhite} paintingColor={paintingColor} />
}

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
    const groupRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = useState(false)

    const { camera, scene } = useThree()

    const matcapFrame = useTexture(frameMatcapPath)
    const matcapWhite = useTexture(whiteMatcapPath)
    const matcapBlack = useTexture(blackMatcapPath)

    const handleClick = useCallback((e: { face: THREE.Face | null, point: THREE.Vector3, object: THREE.Object3D }) => {
        // ── 1. Back-face guard ─────────────────────────────────────────────
        // The painting mesh uses DoubleSide, so we must reject clicks on the
        // back face by checking the face normal vs the camera→hit direction.
        if (e.face) {
            const normalWorld = e.face.normal.clone()
                .transformDirection(e.object.matrixWorld)
            const camToHit = new THREE.Vector3()
                .subVectors(e.point, camera.position)
                .normalize()
            // Dot ≥ 0 means the normal and view direction agree → back face
            if (normalWorld.dot(camToHit) >= 0) return
        }

        // ── 2. Occlusion guard ────────────────────────────────────────────
        // Cast a ray from the camera toward the artwork centre. If any mesh
        // that is NOT part of this artwork group is closer, the artwork is
        // occluded (e.g. there is a wall in between) and we ignore the click.
        const artworkWorldPos = new THREE.Vector3(
            artwork.position[0],
            artwork.position[1],
            artwork.position[2],
        )
        const direction = artworkWorldPos.clone().sub(camera.position).normalize()
        const distance = camera.position.distanceTo(artworkWorldPos)

        const occlusionRay = new THREE.Raycaster(
            camera.position.clone(),
            direction,
            0,
            distance - 0.05,   // stop just before the artwork plane
        )

        // Walk up the parent chain to see if an object belongs to our group
        const isPartOfGroup = (obj: THREE.Object3D): boolean => {
            let cur: THREE.Object3D | null = obj
            while (cur) {
                if (cur === groupRef.current) return true
                cur = cur.parent
            }
            return false
        }

        const hits = occlusionRay.intersectObjects(scene.children, true)
        const isOccluded = hits.some(hit => !isPartOfGroup(hit.object))
        if (isOccluded) return

        onFocus(artwork)
    }, [artwork, camera, scene, onFocus])

    return (
        <group ref={groupRef} position={artwork.position} rotation={artwork.rotation}>
            {/* Painting canvas — z=0.09, clear above passe-partout at z=0.054 */}
            <mesh
                ref={meshRef}
                position={[0, 0, 0.09]}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onClick={handleClick}
            >
                <planeGeometry args={[artwork.width, artwork.height]} />
                <PaintingMaterial artwork={artwork} matcapWhite={matcapWhite} paintingColor={paintingColor} />
            </mesh>

            {/* Frame - outer border */}
            <mesh ref={frameRef} position={[0, 0, 0]}>
                <boxGeometry args={[artwork.width + 0.45, artwork.height + 0.45, 0.08]} />
                <meshMatcapMaterial matcap={matcapFrame} color={hovered ? '#ffffffff' : frameColor} />
            </mesh>

            {/* Frame inner bevel */}
            <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[artwork.width + 0.06, artwork.height + 0.06, 0.04]} />
                <meshMatcapMaterial matcap={matcapFrame} color={frameColor} />
            </mesh>

            {/* Passe-partout (mat board) — cream/white surface between bevel and canvas */}
            <mesh position={[0, 0, 0.054]}>
                <planeGeometry args={[artwork.width + 0.30, artwork.height + 0.30]} />
                <meshMatcapMaterial matcap={matcapWhite} color="#f5f0e8" />
            </mesh>

            {/* Label plaque */}
            <mesh position={[0, -(artwork.height / 2) - 0.5, 0.01]}>
                <boxGeometry args={[1.4, 0.22, 0.02]} />
                <meshMatcapMaterial matcap={matcapBlack} color={plaqueColor} />
            </mesh>
            <Text
                position={[0, -(artwork.height / 2) - 0.45, 0.03]}
                fontSize={0.07}
                color="#d4c5a0"
                anchorX="center"
                anchorY="middle"
                maxWidth={1.3}
            >
                {artwork.title}
            </Text>
            <Text
                position={[0, -(artwork.height / 2) - 0.55, 0.03]}
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

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer({
    focusedArtwork,
    isPlaying,
    onTogglePlay
}: {
    focusedArtwork: Artwork | null
    isPlaying: boolean
    onTogglePlay: () => void
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.play().catch(() => { console.warn('Audio auto-play prevented by browser') })
        } else {
            audioRef.current.pause()
        }
    }, [isPlaying])

    return (
        <div style={{ position: 'fixed', top: 22, right: 32, zIndex: 110 }}>
            <audio ref={audioRef} loop src="/music/A_Gentle_Return.mp3" />
            <div
                onClick={onTogglePlay}
                style={{
                    position: 'fixed', top: 24, right: 120, zIndex: 110,
                    color: '#4a3a1a', fontSize: 11, fontFamily: 'monospace',
                    letterSpacing: 2, pointerEvents: 'all',
                    cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}>
                {isPlaying ? 'Music On' : 'Music Off'} {focusedArtwork ? '' : ' |'}
            </div>
        </div>
    )
}


// ─── Main Gallery Page ─────────────────────────────────────────────────────────────

function GalleryRoom({
    floorMatcapPath,
    wallMatcapPath,
    ceilMatcapPath,
    accentMatcapPath,
    floorColor,
    wallColor,
    ceilColor,
    accentColor,
    onArtworksLocated,
}: {
    floorMatcapPath: string
    wallMatcapPath: string
    ceilMatcapPath: string
    accentMatcapPath: string
    floorColor: string
    wallColor: string
    ceilColor: string
    accentColor: string
    onArtworksLocated: (locations: { id: number, position: THREE.Vector3, rotation: THREE.Euler }[]) => void
}) {
    const matcapFloor = useTexture(floorMatcapPath)
    const matcapWall = useTexture(wallMatcapPath)
    const matcapCeil = useTexture(ceilMatcapPath)
    const matcapAccent = useTexture(accentMatcapPath)
    const matcapPlastic = useTexture('/textures/matcaps/plastic-blue.png')

    const { scene } = useGLTF('/models/gltf/art-gallery-02.glb')

    useMemo(() => {
        const locations: { id: number, position: THREE.Vector3, rotation: THREE.Euler }[] = []

        scene.traverse((child) => {
            if (child.name.toLowerCase().includes('frame-empty')) {
                // Extract ID from name like "frame-empty-01"
                const parts = child.name.split('-')
                const idStr = parts[parts.length - 1]
                const id = parseInt(idStr)
                if (!isNaN(id)) {
                    // We need world position/rotation
                    child.updateWorldMatrix(true, false)
                    const pos = new THREE.Vector3()
                    const quat = new THREE.Quaternion()
                    const scale = new THREE.Vector3()
                    child.matrixWorld.decompose(pos, quat, scale)
                    const rot = new THREE.Euler().setFromQuaternion(quat)

                    locations.push({ id, position: pos, rotation: rot })
                }
                // Hide the placeholder
                child.visible = false
            }

            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                const name = mesh.name.toLowerCase()

                if (name.includes('wall')) {
                    mesh.material = new THREE.ShaderMaterial({
                        vertexShader: WALL_VERTEX_SHADER,
                        fragmentShader: WALL_FRAGMENT_SHADER,
                        uniforms: {
                            uColor: { value: new THREE.Color(0.95, 0.95, 0.95) },
                            uNoiseColor: { value: new THREE.Color(0.85, 0.85, 0.85) },
                            uNoiseScale: { value: 0.0 },
                            uBumpStrength: { value: 0.4 }
                        }
                    })
                } else if (name.includes('ceil')) {
                    mesh.material = new THREE.ShaderMaterial({
                        vertexShader: WALL_VERTEX_SHADER,
                        fragmentShader: WALL_FRAGMENT_SHADER,
                        uniforms: {
                            uColor: { value: new THREE.Color(0.95, 0.95, 0.95) },
                            uNoiseColor: { value: new THREE.Color(0.85, 0.85, 0.85) },
                            uNoiseScale: { value: 50.0 },
                            uBumpStrength: { value: 0.4 }
                        }
                    })
                } else if (name.includes('floor')) {
                    mesh.material = new THREE.ShaderMaterial({
                        vertexShader: WOOD_FLOOR_VERTEX_SHADER,
                        fragmentShader: WOOD_FLOOR_FRAGMENT_SHADER,
                        uniforms: {
                            uTime: { value: 0 },
                            uRepeat: { value: new THREE.Vector2(22.0, 1.0) },
                            uRotation: { value: 0 }, // In radians
                            uColorLight: { value: new THREE.Color(0.72, 0.68, 0.62) },
                            uColorDark: { value: new THREE.Color(0.80, 0.76, 0.69) }
                        }
                    })
                } else if (name.includes('accent')) {
                    mesh.material = new THREE.MeshMatcapMaterial({ matcap: matcapAccent, color: accentColor })
                } else if (name.includes('box')) {
                    mesh.material = new THREE.MeshMatcapMaterial({ matcap: matcapPlastic, color: '#110754ff' })
                }
            }
        })
        if (locations.length > 0) {
            onArtworksLocated(locations)
        }
    }, [scene, matcapFloor, matcapWall, matcapCeil, matcapAccent, floorColor, wallColor, ceilColor, accentColor, onArtworksLocated])

    return <primitive object={scene} />
}

useGLTF.preload('/models/gltf/art-gallery-02.glb')

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
    onFocus,
    config,
    focusedArtwork,
    zoomDistance,
    verticalOffset,
    isExploring,
    onInteraction,
}: {
    onFocus: (a: Artwork | null) => void
    config: any
    focusedArtwork: Artwork | null
    zoomDistance: number
    verticalOffset: number
    isExploring: boolean
    onInteraction: () => void
}) {
    const { camera } = useThree()
    const controlsRef = useRef<any>(null)
    const lastCameraState = useRef({
        position: new THREE.Vector3(0, 5, 15),
        target: new THREE.Vector3(0, 1.8, -12),
        saved: false
    })

    // Automatic rotation movement handle
    useFrame((state) => {
        if (!controlsRef.current) return
        if (!isExploring) {
            const time = state.clock.getElapsedTime() * 0.1
            camera.position.x = Math.sin(time) * 14
            camera.position.z = Math.cos(time) * 14
            camera.position.y = 4 + Math.sin(time * 0.5) * 2
            camera.lookAt(0, 1.8, -6)
            controlsRef.current.target.set(0, 1.8, -6)
            controlsRef.current.update()
        }
    })

    useEffect(() => {
        if (!controlsRef.current || !isExploring) return

        if (focusedArtwork) {
            controlsRef.current.enabled = false

            // Save state once before moving if not already saved
            if (!lastCameraState.current.saved) {
                lastCameraState.current.position.copy(camera.position)
                lastCameraState.current.target.copy(controlsRef.current.target)
                lastCameraState.current.saved = true
            }


            // Derive the artwork's world-space front-face normal by rotating
            // the local +Z axis (0,0,1) with the full rotation quaternion.
            // This is correct for ANY rotation combination — using only
            // Math.sin/cos(rotation[1]) breaks when the Euler decomposition
            // distributes 180°Y as (π, 0, π) instead of (0, π, 0), making
            // rotation[1]=0 and shooting the camera to the wrong side.
            const [rx, ry, rz] = focusedArtwork.rotation
            const artworkQuat = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(rx, ry, rz)
            )
            const faceNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(artworkQuat)

            const targetPosX = focusedArtwork.position[0] + faceNormal.x * zoomDistance
            const targetPosY = focusedArtwork.position[1] + verticalOffset
            const targetPosZ = focusedArtwork.position[2] + faceNormal.z * zoomDistance

            gsap.to(camera.position, {
                x: targetPosX,
                y: targetPosY,
                z: targetPosZ,
                duration: 1.5,
                ease: "power2.inOut"
            })

            gsap.to(controlsRef.current.target, {
                x: focusedArtwork.position[0],
                y: focusedArtwork.position[1] + verticalOffset,
                z: focusedArtwork.position[2],
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => controlsRef.current.update()
            })
        } else if (lastCameraState.current.saved) {
            // Return to previous position
            gsap.to(camera.position, {
                x: lastCameraState.current.position.x,
                y: lastCameraState.current.position.y,
                z: lastCameraState.current.position.z,
                duration: 1.2,
                ease: "power2.inOut"
            })

            gsap.to(controlsRef.current.target, {
                x: lastCameraState.current.target.x,
                y: lastCameraState.current.target.y,
                z: lastCameraState.current.target.z,
                duration: 1.2,
                ease: "power2.inOut",
                onUpdate: () => controlsRef.current.update(),
                onComplete: () => {
                    lastCameraState.current.saved = false
                    controlsRef.current.enabled = true
                }
            })
        } else {
            // Intro to center jump - Move into the hall
            gsap.to(camera.position, {
                x: -13,
                y: 1.8,
                z: 6,
                duration: 2.5,
                ease: "expo.out"
            })
            gsap.to(controlsRef.current.target, {
                x: -13,
                y: 1.8,
                z: 0,
                duration: 2.5,
                ease: "expo.out",
                onUpdate: () => controlsRef.current.update()
            })
        }
    }, [focusedArtwork, isExploring, zoomDistance, verticalOffset, camera])

    return (
        <>
            {/* <Stats /> */}
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
                onArtworksLocated={config.onArtworksLocated}
            />

            {(config.locatedArtworks as Artwork[]).map((aw) => (
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
                target={[0, 1.8, -12]}
                onStart={onInteraction}
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
    zoomDistance,
    onZoomChange,
    verticalOffset,
    onVerticalOffsetChange
}: {
    artwork: Artwork;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    zoomDistance: number;
    onZoomChange: (val: number) => void;
    verticalOffset: number;
    onVerticalOffsetChange: (val: number) => void;
}) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                right: 24,
                zIndex: 100,
                transform: 'translateY(-50%) translateZ(0)',  /* force GPU layer */
                width: '380px',
                maxHeight: '85vh',
                // ── No backdrop-filter: it forces a GPU→CPU pixel readback on every
                // frame which kills WebGL performance. Instead we use a high-opacity
                // layered gradient + SVG noise so the panel still reads as "glass".
                background: [
                    // subtle grain overlay (SVG noise, base-64 encoded)
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                    // rich dark gradient that fakes depth / translucency
                    'linear-gradient(160deg, rgba(22,16,10,0.97) 0%, rgba(10,8,5,0.98) 60%, rgba(18,12,6,0.97) 100%)',
                ].join(', '),
                padding: '40px 30px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                borderRadius: '24px',
                border: '1px solid rgba(200, 169, 78, 0.25)',
                // Stronger outer glow compensates for missing blur depth cue
                boxShadow: [
                    '0 24px 60px rgba(0,0,0,0.7)',
                    '0 0 0 1px rgba(200,169,78,0.08)',
                    'inset 0 1px 0 rgba(255,255,255,0.04)',
                    'inset 0 0 30px rgba(200,169,78,0.04)',
                ].join(', '),
                animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                willChange: 'transform',  /* keep on its own compositor layer */
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onPrev}
                        style={navBtnStyle}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                        ‹
                    </button>
                    <button
                        onClick={onNext}
                        style={navBtnStyle}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                        ›
                    </button>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#c9a84c',
                        cursor: 'pointer',
                        fontSize: '24px',
                        padding: '0 5px'
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                    <span style={{ color: '#c9a84c', fontSize: 12, fontFamily: 'monospace', letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                        {artwork.style}
                    </span>
                    <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#e8d5a0', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
                        {artwork.title}
                    </h2>
                </div>

                <div style={{ color: '#8a7a5a', fontSize: 14, marginBottom: 20, fontFamily: 'monospace', borderBottom: '1px solid rgba(200,169,78,0.15)', paddingBottom: 15 }}>
                    {artwork.artist} &nbsp;·&nbsp; {artwork.year}
                </div>

                <p style={{ margin: 0, color: '#c0ad8a', fontSize: 16, lineHeight: 1.7, fontWeight: 300 }}>
                    {artwork.description}
                </p>
            </div>

            <div style={{ background: 'rgba(200,169,78,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(200,169,78,0.1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ color: '#8a7a5a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Inspection Distance</span>
                        <span style={{ color: '#c9a84c', fontSize: 12, fontFamily: 'monospace' }}>{zoomDistance.toFixed(1)}m</span>
                    </div>
                    <input
                        type="range" min="1.8" max="4.8" step="0.1"
                        value={zoomDistance}
                        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ color: '#8a7a5a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Ajuste de Altura</span>
                        <span style={{ color: '#c9a84c', fontSize: 12, fontFamily: 'monospace' }}>{verticalOffset.toFixed(2)}</span>
                    </div>
                    <input
                        type="range" min="-1.5" max="1.5" step="0.05"
                        value={verticalOffset}
                        onChange={(e) => onVerticalOffsetChange(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(200,169,78,0.1)',
                        border: '1px solid rgba(200,169,78,0.4)',
                        color: '#f0e5c5',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        letterSpacing: 1,
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(200,169,78,0.2)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(200,169,78,0.1)'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    Back to Room
                </button>
            </div>
        </div>
    )
}

const navBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#c9a84c',
    borderRadius: '12px',
    width: 40,
    height: 40,
    cursor: 'pointer',
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
}

// ─── HUD Overlay ──────────────────────────────────────────────────────────────

function HUD({
    focusedArtwork,
    locatedArtworks,
    onFocus,
    showTutorial,
    isTouring,
    onToggleTour,
}: {
    focusedArtwork: Artwork | null
    locatedArtworks: Artwork[]
    onFocus: (a: Artwork | null) => void
    showTutorial: boolean
    isTouring: boolean
    onToggleTour: () => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <>
            {!focusedArtwork && (
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
            )}

            {showTutorial && !focusedArtwork && (
                <div style={{
                    position: 'fixed', top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    width: 120,
                    height: 120,
                    zIndex: 100,
                    pointerEvents: 'none',
                    animation: 'handPulse 3s ease-in-out infinite',
                }}>
                    <img src="/images/hand.svg" alt="Hand" style={{ width: '100%', height: '100%' }} />
                </div>
            )}

            {/* Play Tour */}
            <button
                id="gallery-play-tour-btn"
                onClick={onToggleTour}
                title={isTouring ? 'Stop Tour' : 'Play Tour'}
                style={{
                    position: 'fixed', bottom: 24, left: '46%', transform: 'translateX(-50%)',
                    zIndex: 60, pointerEvents: 'all',
                    background: isTouring ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.18)',
                    border: '1px solid rgba(201,168,76,0.35)',
                    borderRadius: '14px',
                    width: 48, height: 48,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: menuOpen
                        ? '0 0 24px rgba(201,168,76,0.25)'
                        : '0 4px 20px rgba(0,0,0,0.5)',
                    color: isTouring ? '#05040a' : '#c9a84c',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isTouring ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.22)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.3)' }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = isTouring ? 'rgba(201,168,76,0.5)' : (menuOpen ? 'rgba(201,168,76,0.18)' : 'rgba(30,22,10,0.72)')
                    e.currentTarget.style.boxShadow = menuOpen ? '0 0 24px rgba(201,168,76,0.25)' : '0 4px 20px rgba(0,0,0,0.5)'
                }}
            >
                {isTouring ? <Square fill="currentColor" size={20} /> : <PlayIcon fill="currentColor" size={20} />}
            </button>

            {/* Hamburger button */}
            <button
                id="gallery-menu-btn"
                onClick={() => setMenuOpen(o => !o)}
                title={menuOpen ? 'Cerrar índice' : 'Índice de obras'}
                style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 60, pointerEvents: 'all',
                    background: menuOpen ? 'rgba(201,168,76,0.18)' : 'rgba(30,22,10,0.72)',
                    border: '1px solid rgba(201,168,76,0.35)',
                    borderRadius: '14px',
                    width: 48, height: 48,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: menuOpen
                        ? '0 0 24px rgba(201,168,76,0.25)'
                        : '0 4px 20px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.22)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.3)' }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = menuOpen ? 'rgba(201,168,76,0.18)' : 'rgba(30,22,10,0.72)'
                    e.currentTarget.style.boxShadow = menuOpen ? '0 0 24px rgba(201,168,76,0.25)' : '0 4px 20px rgba(0,0,0,0.5)'
                }}
            >
                {/* Three lines that animate to X */}
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        display: 'block',
                        width: 20, height: 1.5,
                        background: '#c9a84c',
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                        transformOrigin: 'center',
                        transform: menuOpen
                            ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
                                : i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
                                    : 'scaleX(0) translateY(0)'
                            : 'none',
                        opacity: menuOpen && i === 1 ? 0 : 1,
                    }} />
                ))}
            </button>

            {/* Floating artwork index menu */}
            {menuOpen && (
                <div
                    id="gallery-artwork-index"
                    style={{
                        position: 'fixed', bottom: 84, left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 55, pointerEvents: 'all',
                        background: [
                            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                            'linear-gradient(160deg, rgba(22,16,10,0.97) 0%, rgba(10,8,5,0.98) 60%, rgba(18,12,6,0.97) 100%)',
                        ].join(', '),
                        borderRadius: '20px',
                        border: '1px solid rgba(200,169,78,0.25)',
                        boxShadow: [
                            '0 24px 60px rgba(0,0,0,0.7)',
                            '0 0 0 1px rgba(200,169,78,0.08)',
                            'inset 0 1px 0 rgba(255,255,255,0.04)',
                        ].join(', '),
                        padding: '20px 24px',
                        minWidth: 280,
                        maxWidth: 360,
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        animation: 'menuSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <div style={{
                        color: '#c9a84c', fontSize: 10, fontFamily: 'monospace',
                        letterSpacing: 3, textTransform: 'uppercase',
                        marginBottom: 16, paddingBottom: 12,
                        borderBottom: '1px solid rgba(200,169,78,0.15)',
                    }}>
                        Índice de Obras · {locatedArtworks.length} works
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {locatedArtworks.map((aw, idx) => (
                            <button
                                key={aw.id}
                                id={`gallery-artwork-link-${aw.id}`}
                                onClick={() => { onFocus(aw); setMenuOpen(false) }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    textAlign: 'left', width: '100%',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,169,78,0.1)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                                <span style={{
                                    color: '#c9a84c', fontFamily: 'monospace',
                                    fontSize: 10, letterSpacing: 1,
                                    minWidth: 22, opacity: 0.6,
                                }}>
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <div style={{
                                        color: '#e8d5a0', fontSize: 14,
                                        fontFamily: 'Georgia, serif', lineHeight: 1.3,
                                        marginBottom: 2,
                                    }}>
                                        {aw.title}
                                    </div>
                                    <div style={{
                                        color: '#8a7a5a', fontSize: 11,
                                        fontFamily: 'monospace', letterSpacing: 0.5,
                                    }}>
                                        {aw.artist} · {aw.year}
                                    </div>
                                </div>
                                <span style={{
                                    marginLeft: 'auto', color: '#c9a84c',
                                    fontSize: 16, opacity: 0.5,
                                }}>›</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gallery name watermark & Artwork counter moved to early return block */}
        </>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArtGallery() {
    const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null)
    const [zoomDistance, setZoomDistance] = useState(3.8)
    const [verticalOffset, setVerticalOffset] = useState(0)
    const [isExploring, setIsExploring] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)
    const [isTouring, setIsTouring] = useState(false)
    const [isPlayingMusic, setIsPlayingMusic] = useState(false)

    //HIDE USE CONTROLS
    const config = useControls({
        Room: folder({
            floorMatcap: { value: MATCAP_OPTIONS['Plastic White'], options: MATCAP_OPTIONS, label: 'Floor' },
            floorColor: { value: '#727272', label: 'Floor Color' },
            wallMatcap: { value: MATCAP_OPTIONS['Mate White'], options: MATCAP_OPTIONS, label: 'Walls' },
            wallColor: { value: '#ffffff', label: 'Wall Color' },
            ceilMatcap: { value: MATCAP_OPTIONS['Plastic White'], options: MATCAP_OPTIONS, label: 'Ceiling' },
            ceilColor: { value: '#ffffff', label: 'Ceiling Color' },
            accentMatcap: { value: MATCAP_OPTIONS['Rubber Black'], options: MATCAP_OPTIONS, label: 'Accents' },
            accentColor: { value: '#3c3c3cff', label: 'Accent Color' },
        }, { collapsed: true }),
        Artwork: folder({
            frameMatcap: { value: MATCAP_OPTIONS['Plastic Black'], options: MATCAP_OPTIONS, label: 'Frames' },
            frameColor: { value: '#3a3a3aff', label: 'Frame Color' },
            paintingMatcap: { value: MATCAP_OPTIONS['Mate White'], options: MATCAP_OPTIONS, label: 'Painting' },
            paintingColor: { value: '#ffffff', label: 'Painting Color' },
            plaqueMatcap: { value: MATCAP_OPTIONS['Plastic Black'], options: MATCAP_OPTIONS, label: 'Plaques' },
            plaqueColor: { value: '#242323', label: 'Plaque Color' },
        }, { collapsed: true }),
    })

    const [locatedArtworks, setLocatedArtworks] = useState<Artwork[]>([])

    // Sync ARTWORKS with located positions from GLTF
    const handleArtworksLocated = useCallback((locations: { id: number, position: THREE.Vector3, rotation: THREE.Euler }[]) => {
        const updated = ARTWORKS.map(art => {
            const loc = locations.find(l => l.id === art.id)
            if (loc) {
                return {
                    ...art,
                    position: [loc.position.x, loc.position.y, loc.position.z],
                    rotation: [loc.rotation.x, loc.rotation.y, loc.rotation.z]
                } as Artwork
            }
            return null
        }).filter(Boolean) as Artwork[]

        setLocatedArtworks(updated)
    }, [])

    const handleFocus = useCallback((artwork: Artwork | null) => {
        if (focusedArtwork && artwork && focusedArtwork.id === artwork.id) return
        setFocusedArtwork(artwork)
        setZoomDistance(3.8)
        setVerticalOffset(0)

        if (artwork) {
            localStorage.setItem('tutorialFinish', 'true')
            setShowTutorial(false)
        }
    }, [focusedArtwork])

    const handleNext = useCallback(() => {
        if (locatedArtworks.length === 0) return
        if (!focusedArtwork) {
            // Nothing focused yet — jump to the first artwork
            setFocusedArtwork(locatedArtworks[0])
        } else {
            const idx = locatedArtworks.findIndex(a => a.id === focusedArtwork.id)
            setFocusedArtwork(locatedArtworks[(idx + 1) % locatedArtworks.length])
        }
        setZoomDistance(3.8)
        setVerticalOffset(0)
    }, [focusedArtwork, locatedArtworks])

    const handlePrev = useCallback(() => {
        if (locatedArtworks.length === 0) return
        if (!focusedArtwork) {
            // Nothing focused yet — jump to the last artwork
            setFocusedArtwork(locatedArtworks[locatedArtworks.length - 1])
        } else {
            const idx = locatedArtworks.findIndex(a => a.id === focusedArtwork.id)
            setFocusedArtwork(locatedArtworks[(idx - 1 + locatedArtworks.length) % locatedArtworks.length])
        }
        setZoomDistance(3.8)
        setVerticalOffset(0)
    }, [focusedArtwork, locatedArtworks])

    const handleNextManual = useCallback(() => {
        setIsTouring(false)
        handleNext()
    }, [handleNext])

    const handlePrevManual = useCallback(() => {
        setIsTouring(false)
        handlePrev()
    }, [handlePrev])

    const toggleTour = useCallback(() => {
        setIsTouring(prev => {
            const nextState = !prev;
            if (nextState) {
                setIsPlayingMusic(true);
                if (!focusedArtwork && locatedArtworks.length > 0) {
                    setFocusedArtwork(locatedArtworks[0]);
                }
            }
            return nextState;
        });
    }, [focusedArtwork, locatedArtworks]);

    useEffect(() => {
        if (!isTouring) return;

        const timer = setTimeout(() => {
            handleNext();
        }, 20000);

        return () => clearTimeout(timer);
    }, [isTouring, focusedArtwork, handleNext]);

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#05040a', overflow: 'hidden', position: 'relative' }}>
            <Leva hidden />
            <style>{`
        @keyframes slideInRight {
          from { transform: translateY(-50%) translateX(100%); opacity: 0; }
          to { transform: translateY(-50%) translateX(0); opacity: 1; }
        }
        @keyframes menuSlideUp {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes handPulse {
          0% { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(1.1); }
        }
        @keyframes tourProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

            <Canvas
                camera={{ fov: 40, near: 0.1, far: 100, position: [2, 2, 6] }}
                gl={{ antialias: true }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <Suspense fallback={null}>
                    <Scene
                        onFocus={(a) => { setIsTouring(false); handleFocus(a); }}
                        config={{ ...config, locatedArtworks, onArtworksLocated: handleArtworksLocated }}
                        focusedArtwork={focusedArtwork}
                        zoomDistance={zoomDistance}
                        verticalOffset={verticalOffset}
                        isExploring={isExploring}
                        onInteraction={() => { setShowTutorial(false); setIsTouring(false); }}
                    />
                </Suspense>
            </Canvas>

            <MusicPlayer
                focusedArtwork={focusedArtwork}
                isPlaying={isPlayingMusic}
                onTogglePlay={() => setIsPlayingMusic(p => !p)}
            />
            <HUD
                focusedArtwork={focusedArtwork}
                locatedArtworks={locatedArtworks}
                onFocus={(a) => { setIsTouring(false); handleFocus(a); }}
                showTutorial={showTutorial}
                isTouring={isTouring}
                onToggleTour={toggleTour}
            />

            {focusedArtwork && (
                <ArtworkPanel
                    artwork={focusedArtwork}
                    onClose={() => { setFocusedArtwork(null); setIsTouring(false); }}
                    onNext={handleNextManual}
                    onPrev={handlePrevManual}
                    zoomDistance={zoomDistance}
                    onZoomChange={setZoomDistance}
                    verticalOffset={verticalOffset}
                    onVerticalOffsetChange={setVerticalOffset}
                />
            )}

            {isTouring && focusedArtwork && (
                <div
                    key={`tour-bar-${focusedArtwork.id}`}
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        height: 6,
                        background: '#c9a84c',
                        zIndex: 200,
                        animation: 'tourProgress 20s linear forwards',
                    }}
                />
            )}

            {!isExploring && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // ── Replaced backdropFilter: blur() — kills WebGL FPS.
                    // A dark radial vignette draws the eye to the centre and
                    // creates enough contrast for the title without any blur.
                    background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(5,4,10,0.55) 0%, rgba(3,2,8,0.82) 100%)',
                    zIndex: 200,
                    transition: 'opacity 0.8s ease',
                    willChange: 'opacity',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{
                            color: '#e8d5a0',
                            fontSize: '48px',
                            fontFamily: 'Georgia, serif',
                            marginBottom: '40px',
                            letterSpacing: '8px',
                            textTransform: 'uppercase',
                            opacity: 0.9
                        }}>
                            Gallery Lumiere
                        </h1>
                        <button
                            onClick={() => {
                                setIsExploring(true)
                                const finished = localStorage.getItem('tutorialFinish') === 'true'
                                if (!finished) setShowTutorial(true)
                            }}
                            style={{
                                background: 'transparent',
                                border: '2px solid #c9a84c',
                                color: '#e8d5a0',
                                padding: '16px 48px',
                                fontSize: '14px',
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                borderRadius: '4px',
                                fontWeight: '600'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#c9a84c'
                                e.currentTarget.style.color = '#05040a'
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(201, 168, 76, 0.3)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#e8d5a0'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            Begin the Experience
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
