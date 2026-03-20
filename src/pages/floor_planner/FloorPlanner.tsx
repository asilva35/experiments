import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, ContactShadows, Html, Line, Circle } from '@react-three/drei'
import * as THREE from 'three'

const VIEW_MODES = { ZENITHAL: '2D', THREE_D: '3D' } as const;
type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

// --- 1. LÓGICA DE GEOMETRÍA DE MUROS (MITRAS) ---
// Obtiene los puntos de compensación (izquierda y derecha) en un vértice
const getMiterPoints = (vPrev: any, vCurr: any, vNext: any, thickness: number) => {
    const v1 = new THREE.Vector2(vCurr.x - vPrev.x, vCurr.z - vPrev.z).normalize();
    const v2 = new THREE.Vector2(vNext.x - vCurr.x, vNext.z - vCurr.z).normalize();
    
    // Normales izquierdas de los dos segmentos
    const n1 = new THREE.Vector2(-v1.y, v1.x);
    const n2 = new THREE.Vector2(-v2.y, v2.x);
    
    // Bisectriz (promedio de las normales)
    let bisector = new THREE.Vector2().addVectors(n1, n2).normalize();
    
    // Manejo de paredes paralelas (180 grados)
    if (bisector.length() < 0.01) bisector = n1.clone();
    
    // Longitud del miter: thickness / cos(theta)
    const length = (thickness / 2) / Math.max(0.1, bisector.dot(n1));
    
    return {
        left: new THREE.Vector2(vCurr.x + bisector.x * length, vCurr.z + bisector.y * length),
        right: new THREE.Vector2(vCurr.x - bisector.x * length, vCurr.z - bisector.y * length),
        bisector: bisector // Útil para CADDimension
    };
};

// --- 2. ETIQUETA DE MEDIDA CAD ---
function CADDimension({ start, end, wallNormal, viewMode, isSelected, showDimensions }: any) {
    if (viewMode !== VIEW_MODES.ZENITHAL || !showDimensions) return null;

    const distCm = Math.round(Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)) * 100);
    const offset = 0.8;
    const color = isSelected ? "#ef4444" : "#71717a";
    const extensionColor = isSelected ? "#fecaca" : "#cbd5e1";

    // Convertir wallNormal (Vector2) a Vector3 de offset (mapeando Y de V2 a Z de V3)
    const norm3 = new THREE.Vector3(wallNormal.x, 0, wallNormal.y).normalize().multiplyScalar(offset);
    const shortNorm3 = new THREE.Vector3(wallNormal.x, 0, wallNormal.y).normalize().multiplyScalar(0.2);
    const longNorm3 = new THREE.Vector3(wallNormal.x, 0, wallNormal.y).normalize().multiplyScalar(offset + 0.2);

    // Puntos para la línea de dimensión paralela
    const p1 = new THREE.Vector3(start.x, 0.1, start.z).add(norm3);
    const p2 = new THREE.Vector3(end.x, 0.1, end.z).add(norm3);

    // Puntos para las líneas de extensión
    const e1Start = new THREE.Vector3(start.x, 0.1, start.z).add(shortNorm3);
    const e1End = new THREE.Vector3(start.x, 0.1, start.z).add(longNorm3);
    const e2Start = new THREE.Vector3(end.x, 0.1, end.z).add(shortNorm3);
    const e2End = new THREE.Vector3(end.x, 0.1, end.z).add(longNorm3);

    const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    return (
        <group>
            {/* Línea principal */}
            <Line points={[p1, p2]} color={color} lineWidth={1} />
            {/* Líneas de extensión */}
            <Line points={[e1Start, e1End]} color={extensionColor} lineWidth={1} />
            <Line points={[e2Start, e2End]} color={extensionColor} lineWidth={1} />

            <Html position={midpoint as any} center>
                <div className={`text-[9px] font-mono font-bold bg-white px-1 pointer-events-none transition-colors ${isSelected ? "text-red-500" : "text-zinc-500"}`}>
                    {distCm}
                </div>
            </Html>
        </group>
    );
}

// --- 2. MURO ARRASTRABLE ---
function Wall({ wallData, vPrev, v1, v2, vNext, onDrag, viewMode, isSelected, onSelect, showDimensions, index, allVertices }: any) {
    const [hovered, setHovered] = useState(false);
    const { raycaster } = useThree();
    const height = 2.5;
    const thickness = 0.25;

    const { position, rotation, midPoint, normal, outerNormal, wallGeometry } = useMemo(() => {
        const dx = v2.x - v1.x;
        const dz = v2.z - v1.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        const norm = new THREE.Vector3(-dz, 0, dx).normalize();

        // Calcular centroide para orientación
        const cx = allVertices.reduce((s: number, v: any) => s + v.x, 0) / allVertices.length;
        const cz = allVertices.reduce((s: number, v: any) => s + v.z, 0) / allVertices.length;
        const toOutside = new THREE.Vector3((v1.x + v2.x) / 2 - cx, 0, (v1.z + v2.z) / 2 - cz);
        const outNorm = toOutside.dot(norm) < 0 ? norm.clone().negate() : norm.clone();

        // --- Lógica de Mitra ---
        const miter1 = getMiterPoints(vPrev, v1, v2, thickness);
        const miter2 = getMiterPoints(v1, v2, vNext, thickness);

        // Puntos globales
        const p1L = miter1.left;
        const p1R = miter1.right;
        const p2L = miter2.left;
        const p2R = miter2.right;

        // Construcción en coordenadas GLOBALES (mapeando Z a -Y para que coincida con la rotación de la malla)
        const s = new THREE.Shape();
        s.moveTo(p1L.x, -p1L.y);
        s.lineTo(p2L.x, -p2L.y);
        s.lineTo(p2R.x, -p2R.y);
        s.lineTo(p1R.x, -p1R.y);
        s.closePath();

        const extrudeSettings = { depth: height, bevelEnabled: false };
        const geom = new THREE.ExtrudeGeometry(s, extrudeSettings);

        const midX = (v1.x + v2.x) / 2;
        const midZ = (v1.z + v2.z) / 2;

        return {
            position: [0, isSelected ? 0.05 : 0, 0], // Malla en el origen global
            rotation: [-Math.PI / 2, 0, 0],         // Rotación fija para aplanar el Shape
            midPoint: [midX, 0.4, midZ],           // Para el indicador de número
            normal: norm,
            outerNormal: new THREE.Vector2(outNorm.x, outNorm.z), // Vector2 apuntando hacia afuera del room
            wallGeometry: geom
        };
    }, [vPrev, v1, v2, vNext, isSelected, allVertices]);

    const is2D = viewMode === VIEW_MODES.ZENITHAL;

    const handlePointerDown = (e: any) => {
        if (!is2D || e.button !== 0) return;
        e.stopPropagation();
        onSelect(wallData.id);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!is2D || !e.target.hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const currentMousePos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, currentMousePos);
        onDrag(wallData.id, currentMousePos, normal);
    };

    const handlePointerUp = (e: any) => {
        e.target.releasePointerCapture(e.pointerId);
    };

    const wallColor = isSelected ? "#ef4444" : (hovered ? "#fecaca" : "#ffffff");

    return (
        <group
            onPointerOver={() => is2D && setHovered(true)}
            onPointerOut={() => is2D && setHovered(false)}
        >
            <mesh
                position={position as any}
                rotation={rotation as any}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                geometry={wallGeometry}
            >
                <meshBasicMaterial color={wallColor} toneMapped={false} />

                {/* Bordes negros diagonales y rectos */}
                <lineSegments>
                    <edgesGeometry args={[wallGeometry]} />
                    <lineBasicMaterial color="#000000" linewidth={1} />
                </lineSegments>
            </mesh>

            {/* Círculo indicador con número */}
            {is2D && (
                <group position={midPoint as any} rotation={[-Math.PI / 2, 0, 0]}>
                    <Circle args={[0.2, 32]}>
                        <meshBasicMaterial color={isSelected ? "#ef4444" : "#52525b"} />
                    </Circle>
                    <Html center transform={false}>
                        <span className="text-[8px] font-bold text-white pointer-events-none select-none">
                            {index + 1}
                        </span>
                    </Html>
                </group>
            )}

            {hovered && is2D && !isSelected && (
                <group position={midPoint as any}>
                    {/* Botón de dividir eliminado temporalmente */}
                </group>
            )}

            <CADDimension
                start={v1}
                end={v2}
                wallNormal={outerNormal}
                viewMode={viewMode}
                isSelected={isSelected}
                showDimensions={showDimensions}
            />
        </group>
    );
}

// --- 3. MANIJA DE VÉRTICE ---
function VertexHandle({ position, onDrag, visible }: any) {
    const { raycaster } = useThree();

    const handlePointerDown = (e: any) => {
        if (!visible) return;
        e.stopPropagation();
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!visible || !e.target.hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        onDrag(target);
    };

    if (!visible) return null;

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[position.x, 0.2, position.z]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e: any) => e.target.releasePointerCapture(e.pointerId)}
        >
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color="#18181b" />
        </mesh>
    );
}

// --- 4. ESCENA ---
function PlannerScene({ viewMode, showDimensions, vertices, setVertices, connections, setConnections, selectedId, setSelectedId, moveWall, updateVertex }: any) {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    // Deseleccionar paredes al cambiar a 3D, resetear cámara al volver a 2D
    useEffect(() => {
        if (viewMode === VIEW_MODES.THREE_D) {
            setSelectedId(null);
        } else {
            // Resetear cámara a vista cenital
            camera.position.set(0, 20, 0);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            if (controlsRef.current) {
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
            }
        }
    }, [viewMode, camera]);

    return (
        <>
            <color attach="background" args={['#ffffff']} />
            <PerspectiveCamera
                makeDefault
                position={viewMode === VIEW_MODES.ZENITHAL ? [0, 20, 0] : [10, 10, 10]}
                fov={40}
            />

            <OrbitControls ref={controlsRef} makeDefault enabled={viewMode === VIEW_MODES.THREE_D} />

            <ambientLight intensity={0.9} />
            <pointLight position={[5, 10, 5]} intensity={1.5} />

            {/* Grid Interactivo */}
            <Grid infiniteGrid fadeDistance={50} sectionColor="#cbd5e1" cellColor="#f1f5f9" />

            {connections.map((conn: any, idx: number) => {
                const v1 = vertices.find(v => v.id === conn.start)!;
                const v2 = vertices.find(v => v.id === conn.end)!;
                
                // Encontrar vecinos para la mitra
                const prevConn = connections.find(c => c.end === conn.start)!;
                const nextConn = connections.find(c => c.start === conn.end)!;
                const vPrev = vertices.find(v => v.id === prevConn.start)!;
                const vNext = vertices.find(v => v.id === nextConn.end)!;

                return (
                    <Wall
                        key={conn.id}
                        wallData={conn}
                        index={idx}
                        vPrev={vPrev}
                        v1={v1}
                        v2={v2}
                        vNext={vNext}
                        onDrag={moveWall}
                        viewMode={viewMode}
                        isSelected={selectedId === conn.id}
                        onSelect={setSelectedId}
                        showDimensions={showDimensions}
                        allVertices={vertices}
                    />
                );
            })}

            {vertices.map(v => (
                <VertexHandle
                    key={v.id} position={v}
                    visible={viewMode === VIEW_MODES.ZENITHAL}
                    onDrag={(pos: THREE.Vector3) => updateVertex(v.id, pos)}
                />
            ))}

            <ContactShadows opacity={0.15} scale={40} blur={2.5} />
        </>
    )
}

// --- EXPORT DEFAULT ---
export default function FloorPlanner() {
    const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.ZENITHAL);
    const [showDimensions, setShowDimensions] = useState(true);
    const [modal, setModal] = useState<string | null>(null);

    // Estado principal del Plano
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [vertices, setVertices] = useState([
        { id: 0, x: -3, z: -2 }, { id: 1, x: 3, z: -2 },
        { id: 2, x: 3, z: 2 }, { id: 3, x: -3, z: 2 },
    ]);
    const [connections, setConnections] = useState([
        { id: 'w1', start: 0, end: 1 }, { id: 'w2', start: 1, end: 2 },
        { id: 'w3', start: 2, end: 3 }, { id: 'w4', start: 3, end: 0 },
    ]);

    const updateVertex = (id: number, pos: THREE.Vector3) => {
        setVertices(prev => prev.map(v => v.id === id ? { ...v, x: pos.x, z: pos.z } : v));
    };

    const moveWall = (wallId: string, mousePos: THREE.Vector3, wallNormal: THREE.Vector3) => {
        setVertices(prev => {
            const wall = connections.find(c => c.id === wallId);
            if (!wall) return prev;
            const v1 = prev.find(v => v.id === wall.start)!;
            const v2 = prev.find(v => v.id === wall.end)!;
            const midPoint = new THREE.Vector3((v1.x + v2.x) / 2, 0, (v1.z + v2.z) / 2);
            const offset = mousePos.clone().sub(midPoint);
            const distance = offset.dot(wallNormal);
            const moveVector = wallNormal.clone().multiplyScalar(distance);
            return prev.map(v => (v.id === wall.start || v.id === wall.end) ? { ...v, x: v.x + moveVector.x, z: v.z + moveVector.z } : v);
        });
    };

    // --- LÓGICA DE SPLIT (CREAR ESCALÓN) ---
    const handleSplit = () => {
        if (!selectedId) return setModal("You must select a wall");
        const wall = connections.find(c => c.id === selectedId)!;
        const v1 = vertices.find(v => v.id === wall.start)!;
        const v2 = vertices.find(v => v.id === wall.end)!;
        const length = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.z - v1.z, 2));

        if (length < 1) return setModal("Wall must be at least 100 cm");

        // Calcular normal para el escalón
        const dx = v2.x - v1.x;
        const dz = v2.z - v1.z;
        const norm = new THREE.Vector2(-dz, dx).normalize();
        
        // Direcciones
        const midX = (v1.x + v2.x) / 2;
        const midZ = (v1.z + v2.z) / 2;
        const stepSize = 0.3; // 30cm escalón

        const newId1 = Math.max(...vertices.map(v => v.id)) + 1;
        const newId2 = newId1 + 1;

        const vA = { id: newId1, x: midX, z: midZ };
        const vB = { id: newId2, x: midX + norm.x * stepSize, z: midZ + norm.y * stepSize };

        setVertices(prev => [...prev.map(v => v.id === wall.end ? { ...v, x: v.x + norm.x * stepSize, z: v.z + norm.y * stepSize } : v), vA, vB]);
        setConnections(prev => {
            const index = prev.findIndex(c => c.id === selectedId);
            const wallA = { id: `w_a_${Date.now()}`, start: wall.start, end: vA.id };
            const wallB = { id: `w_b_${Date.now()}`, start: vA.id, end: vB.id };
            const wallC = { id: `w_c_${Date.now()}`, start: vB.id, end: wall.end };
            const newConns = [...prev];
            newConns.splice(index, 1, wallA, wallB, wallC);
            return newConns;
        });
        setSelectedId(null);
    };

    // --- LÓGICA DE MERGE ---
    const handleMerge = () => {
        if (!selectedId) return setModal("You must select a wall");
        setConnections(prev => {
            const wallIdx = prev.findIndex(c => c.id === selectedId);
            const wall = prev[wallIdx];
            // Verificar si es parte de un escalón (simplificado: busca vecinos creados por split)
            if (!wall.id.includes('w_')) return prev; // Solo permite merge en lo que fue splitted

            // Buscamos el grupo de 3 muros que forman el escalón
            const prevW = prev[wallIdx - 1];
            const nextW = prev[wallIdx + 1];

            if (prevW && nextW && prevW.id.includes('w_') && nextW.id.includes('w_')) {
               const newWall = { id: `wm_${Date.now()}`, start: prevW.start, end: nextW.end };
               const newConns = [...prev];
               newConns.splice(wallIdx - 1, 3, newWall);
               // Resetear vértices (mover el corner original de vuelta) seria ideal aquí
               return newConns;
            }
            return prev;
        });
        setSelectedId(null);
    };

    return (
        <div className="w-full h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Modal de Error Premium */}
            {modal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-zinc-100 max-w-xs w-full text-center">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-zinc-900 font-black mb-2 uppercase tracking-tight">Attention</h3>
                        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">{modal}</p>
                        <button 
                            onClick={() => setModal(null)}
                            className="w-full py-3 bg-zinc-900 text-white text-[10px] font-bold rounded-xl hover:bg-orange-600 transition-colors uppercase"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Panel de Control (Izquierda) */}
            <div className="absolute top-8 left-8 z-10 p-6 bg-white/90 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-3xl w-72">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-orange-500 rounded-full" />
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 leading-tight">FLOOR PLAN</h2>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-[0.2em]">Professional CAD</p>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex bg-zinc-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode(VIEW_MODES.ZENITHAL)}
                            className={`flex-1 py-2.5 text-[10px] font-bold rounded-lg transition-all ${viewMode === VIEW_MODES.ZENITHAL ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            2D BLUEPRINT
                        </button>
                        <button
                            onClick={() => setViewMode(VIEW_MODES.THREE_D)}
                            className={`flex-1 py-2.5 text-[10px] font-bold rounded-lg transition-all ${viewMode === VIEW_MODES.THREE_D ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            3D PREVIEW
                        </button>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Dimensions</span>
                            <button
                                onClick={() => setShowDimensions(!showDimensions)}
                                className={`w-9 h-5 rounded-full transition-all relative ${showDimensions ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showDimensions ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de Operaciones (Derecha) */}
            <div className="absolute top-8 right-8 z-10 p-6 bg-white/90 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-3xl w-72">
                <div className="flex items-center justify-end gap-3 mb-6">
                    <div className="text-right">
                        <h2 className="text-[10px] text-zinc-400 uppercase font-bold tracking-[0.2em] leading-none mb-1">Tools</h2>
                        <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Operations</p>
                    </div>
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Split', action: handleSplit },
                        { label: 'Merge', action: handleMerge },
                        { label: 'Add Door', action: () => console.log('Action: Add Door') },
                        { label: 'Add Window', action: () => console.log('Action: Add Window') },
                        { label: 'Lock', action: () => console.log('Action: Lock Room') },
                        { label: 'Hide', action: () => console.log('Action: Hide Layer') },
                    ].map((btn) => (
                        <button
                            key={btn.label}
                            onClick={btn.action}
                            className="group relative bg-white border border-zinc-200 pt-3 pb-2.5 px-2 rounded-xl hover:border-orange-200 hover:shadow-md transition-all active:scale-95"
                        >
                            <span className="text-[10px] font-bold text-zinc-600 uppercase group-hover:text-zinc-900 transition-colors">
                                {btn.label}
                            </span>
                            {/* Línea naranja inferior tipo CAD */}
                            <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-orange-500/30 rounded-full block" />
                        </button>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 italic">
                    <p className="text-[9px] text-zinc-400 text-center">Select a wall to enable advanced operations</p>
                </div>
            </div>

            <Canvas shadows gl={{ antialias: true }}>
                <PlannerScene 
                    viewMode={viewMode} 
                    showDimensions={showDimensions} 
                    vertices={vertices}
                    setVertices={setVertices}
                    connections={connections}
                    setConnections={setConnections}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    updateVertex={updateVertex}
                    moveWall={moveWall}
                />
            </Canvas>
        </div>
    )
}