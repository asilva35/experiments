import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'

// ─── Data Types ──────────────────────────────────────────────────────────────

interface ArtworkData {
    id: number
    title: string
    artist: string
    year: string
    position: [number, number, number]
    color: string
    matcap: string
    roomId: number
}

interface RoomData {
    id: number
    name: string
    position: [number, number, number]
}

const ROOMS: RoomData[] = [
    { id: 0, name: 'Main Hall', position: [0, 0, 0] },
    { id: 1, name: 'West Wing', position: [-25, 0, 0] },
    { id: 2, name: 'East Wing', position: [25, 0, 0] },
]

const ARTWORKS: ArtworkData[] = [
    { id: 1, title: 'Eternal Cosmos', artist: 'Elena Vasquez', year: '2021', position: [-3, 2.5, -9.8], color: '#ffffff', matcap: '/textures/matcaps/gold.png', roomId: 0 },
    { id: 2, title: 'Azure Dreams', artist: 'James Thornton', year: '2019', position: [3, 2.5, -9.8], color: '#ffffff', matcap: '/textures/matcaps/brillant-blue.png', roomId: 0 },
    { id: 3, title: 'Glacial Bloom', artist: 'Soren Berg', year: '2024', position: [-25, 2.5, -9.8], color: '#ffffff', matcap: '/textures/matcaps/mate-white.png', roomId: 1 },
    { id: 4, title: 'Night Market', artist: 'Chen Wei', year: '2023', position: [-34.8, 2.5, 0], color: '#ffffff', matcap: '/textures/matcaps/plastic-blue.png', roomId: 1 },
    { id: 5, title: 'Solar Flare', artist: 'Amara Okafor', year: '2023', position: [25, 2.5, -9.8], color: '#ffffff', matcap: '/textures/matcaps/gold.png', roomId: 2 },
    { id: 6, title: 'Digital Echo', artist: 'Pixel Void', year: '2025', position: [34.8, 2.5, 0], color: '#ffffff', matcap: '/textures/matcaps/emerald.png', roomId: 2 },
]

// ─── Components ───────────────────────────────────────────────────────────────

function HallwayPulse({ position, onClick }: { position: [number, number, number], onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    const matcap = useTexture('/textures/matcaps/gold.png');
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2
        meshRef.current.scale.set(s, s, s)
    })
    return (
        <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} scale={hovered ? 1.2 : 1}>
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.7, 0.9, 32]} />
                <meshMatcapMaterial matcap={matcap} color="#c9a84c" />
            </mesh>
            <mesh visible={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshMatcapMaterial matcap={matcap} color="#06c63fff" />
            </mesh>
        </group>
    )
}

function Room({ data, onMove, currentRoomId }: { data: RoomData, onMove: (id: number) => void, currentRoomId: number }) {
    const matcapFloor = useTexture('/textures/matcaps/plastic-white.png')
    const matcapWall = useTexture('/textures/matcaps/mate-white.png')

    const width = 100
    const height = 10
    const depth = 100

    return (
        <group position={data.position}>
            {/* Indicators for current room - NO HTML FOR DIAGNOSTIC */}
            {data.id === 0 && currentRoomId === 0 && (
                <>
                    <HallwayPulse position={[-8, 0.1, 0]} onClick={() => onMove(1)} />
                    <HallwayPulse position={[8, 0.1, 0]} onClick={() => onMove(2)} />
                </>
            )}
            {data.id !== 0 && currentRoomId === data.id && (
                <HallwayPulse
                    position={[data.id === 1 ? 8 : -8, 0.1, 0]}
                    onClick={() => onMove(0)}
                />
            )}

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshMatcapMaterial matcap={matcapFloor} color="#e2e2e2" />
            </mesh>
            {/* Wall back */}
            <mesh position={[0, 5, -depth / 2]}>
                <planeGeometry args={[width, height]} />
                <meshMatcapMaterial matcap={matcapWall} color="#ffffff" />
            </mesh>
            {/* Wall left */}
            <mesh position={[-width / 2, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshMatcapMaterial matcap={matcapWall} color="#ffffff" />
            </mesh>
            {/* Wall right */}
            <mesh position={[width / 2, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshMatcapMaterial matcap={matcapWall} color="#ffffff" />
            </mesh>
            {/* Wall front */}
            <mesh position={[0, 5, depth / 2]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[width, height]} />
                <meshMatcapMaterial matcap={matcapWall} color="#ffffff" />
            </mesh>
            {/* Ceiling */}
            <mesh position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshMatcapMaterial matcap={matcapFloor} color="#f0f0f0" />
            </mesh>
        </group>
    )
}

function ArtworkFrame({ data, onFocus }: { data: ArtworkData, onFocus: (a: ArtworkData) => void }) {
    const matcap = useTexture(data.matcap)
    const [hovered, setHovered] = useState(false)

    return (
        <group position={data.position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <mesh onClick={() => onFocus(data)}>
                <boxGeometry args={[2.5, 2, 0.1]} />
                <meshMatcapMaterial matcap={matcap} color={data.color} />
            </mesh>
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshMatcapMaterial matcap={matcap} color="#5570d3ff" />
            </mesh>
            {hovered && (
                <Html position={[0, -1.3, 0.1]} center style={{ color: '#e8d5a0', fontSize: 11, background: 'rgba(0,0,0,0.8)', padding: '2px 8px' }}>
                    {data.artist}
                </Html>
            )}
        </group>
    )
}

function Scene({ focusedArtwork, zoomDistance, onFocus, currentRoomId, onMove }: any) {
    const controlsRef = useRef<any>(null)
    const lastCameraState = useRef({
        position: new THREE.Vector3(0, 4, 12),
        target: new THREE.Vector3(0, 2, 0),
        saved: false
    })

    const targetRoom = ROOMS.find(r => r.id === currentRoomId)!
    const isTransitioning = useRef(false)
    const lastRoomId = useRef(currentRoomId)

    useFrame((state) => {
        if (!controlsRef.current) return

        if (focusedArtwork) {
            controlsRef.current.enabled = false
            if (!lastCameraState.current.saved) {
                lastCameraState.current.position.copy(state.camera.position)
                lastCameraState.current.target.copy(controlsRef.current.target)
                lastCameraState.current.saved = true
            }
            const targetPos = new THREE.Vector3(focusedArtwork.position[0], focusedArtwork.position[1], focusedArtwork.position[2] + zoomDistance)
            state.camera.position.lerp(targetPos, 0.1)
            controlsRef.current.target.lerp(new THREE.Vector3(...focusedArtwork.position), 0.1)
            controlsRef.current.update()
        } else {
            if (lastRoomId.current !== currentRoomId) {
                isTransitioning.current = true
                lastRoomId.current = currentRoomId
            }

            if (lastCameraState.current.saved) {
                controlsRef.current.enabled = false
                state.camera.position.lerp(lastCameraState.current.position, 0.1)
                controlsRef.current.target.lerp(lastCameraState.current.target, 0.1)
                controlsRef.current.update()
                if (state.camera.position.distanceTo(lastCameraState.current.position) < 0.1) {
                    lastCameraState.current.saved = false
                    controlsRef.current.enabled = true
                }
            } else if (isTransitioning.current) {
                controlsRef.current.enabled = false
                const targetCam = new THREE.Vector3(...targetRoom.position).add(new THREE.Vector3(0, 4, 12))
                const targetLook = new THREE.Vector3(...targetRoom.position).add(new THREE.Vector3(0, 2, 0))
                state.camera.position.lerp(targetCam, 0.1)
                controlsRef.current.target.lerp(targetLook, 0.1)
                controlsRef.current.update()
                if (state.camera.position.distanceTo(targetCam) < 0.2) {
                    isTransitioning.current = false
                    controlsRef.current.enabled = true
                }
            } else {
                controlsRef.current.enabled = true
            }
        }
    })

    return (
        <>
            <Stats />
            <color attach="background" args={['#05040a']} />

            {/* Performance Occlusion: Render only current room surroundings */}
            {ROOMS.filter(r => r.id === currentRoomId).map(room => (
                <Room key={room.id} data={room} onMove={onMove} currentRoomId={currentRoomId} />
            ))}

            {ARTWORKS.filter(a => a.roomId === currentRoomId).map(art => (
                <ArtworkFrame key={art.id} data={art} onFocus={onFocus} />
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
                minAzimuthAngle={-Math.PI / 2}
                maxAzimuthAngle={Math.PI / 2}
            />
        </>
    )
}

function ArtworkPanel({ artwork, onClose, onNext, onPrev, zoomDistance, onZoomChange }: any) {
    return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(5,4,10,0.95)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #c9a84c', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button onClick={onPrev} style={btnStyle}>‹</button>
                <div>
                    <h2 style={{ margin: 0, color: '#e8d5a0', fontSize: 20 }}>{artwork.title}</h2>
                    <p style={{ margin: 0, color: '#8a7a5a', fontSize: 13 }}>{artwork.artist}</p>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#8a7a5a', fontSize: 10, textTransform: 'uppercase' }}>Zoom de Inspección</span>
                <input type="range" min="1.8" max="4.8" step="0.1" value={zoomDistance} onChange={(e) => onZoomChange(parseFloat(e.target.value))} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onNext} style={btnStyle}>›</button>
                <button onClick={onClose} style={{ ...btnStyle, borderRadius: 4, width: 'auto', padding: '0 20px' }}>VOLVER</button>
            </div>
        </div>
    )
}

const btnStyle = { background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#e8d5a0', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', fontSize: 20 }

export default function ArtGallery() {
    const [focusedArtwork, setFocusedArtwork] = useState<ArtworkData | null>(null)
    const [currentRoomId, setCurrentRoomId] = useState(0)
    const [zoomDistance, setZoomDistance] = useState(3.5)

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
            <Canvas camera={{ position: [0, 4, 12], fov: 75 }} dpr={[1, 1.5]}>
                <Scene
                    focusedArtwork={focusedArtwork}
                    zoomDistance={zoomDistance}
                    onFocus={setFocusedArtwork}
                    currentRoomId={currentRoomId}
                    onMove={setCurrentRoomId}
                />
            </Canvas>
            {focusedArtwork && (
                <ArtworkPanel
                    artwork={focusedArtwork}
                    onClose={() => setFocusedArtwork(null)}
                    onNext={() => {
                        const roomArtworks = ARTWORKS.filter(a => a.roomId === currentRoomId)
                        const idx = roomArtworks.findIndex(a => a.id === focusedArtwork.id)
                        setFocusedArtwork(roomArtworks[(idx + 1) % roomArtworks.length])
                    }}
                    onPrev={() => {
                        const roomArtworks = ARTWORKS.filter(a => a.roomId === currentRoomId)
                        const idx = roomArtworks.findIndex(a => a.id === focusedArtwork.id)
                        setFocusedArtwork(roomArtworks[(idx - 1 + roomArtworks.length) % roomArtworks.length])
                    }}
                    zoomDistance={zoomDistance}
                    onZoomChange={setZoomDistance}
                />
            )}
        </div>
    )
}
