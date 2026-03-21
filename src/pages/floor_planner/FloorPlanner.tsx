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
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!is2D || !(e.target as Element).hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const currentMousePos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, currentMousePos);
        onDrag(wallData.id, currentMousePos, normal);
    };

    const handlePointerUp = (e: any) => {
        (e.target as Element).releasePointerCapture(e.pointerId);
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
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!visible || !(e.target as Element).hasPointerCapture(e.pointerId)) return;
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
            onPointerUp={(e: any) => (e.target as Element).releasePointerCapture(e.pointerId)}
        >
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color="#18181b" />
        </mesh>
    );
}

// --- 4. PUERTA ---
function Door({ doorData, wall, centroids, onDrag, onUpdate, viewMode }: any) {
    const [hovered, setHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { raycaster } = useThree();

    const { position, rotation, inwardSign, width } = useMemo(() => {
        const v1 = wall.v1;
        const v2 = wall.v2;
        const dx = v2.x - v1.x;
        const dz = v2.z - v1.z;
        const wallAngle = Math.atan2(dz, dx);

        const x = v1.x + dx * doorData.positionRatio;
        const z = v1.z + dz * doorData.positionRatio;

        // Normal de la pared ((-dz, dx) girado 90 CCW)
        const wallNorm = new THREE.Vector2(-dz, dx).normalize();

        // Vector del centro del cuarto a la puerta para determinar interior
        const doorPos = new THREE.Vector2(x, z);
        const center = new THREE.Vector2(centroids.x, centroids.z);
        const toCenter = new THREE.Vector2().subVectors(center, doorPos).normalize();

        // Calculamos la orientación base hacia el centro
        const baseSign = toCenter.dot(wallNorm) > 0 ? 1 : -1;

        // Aplicamos el flip manual (si doorData.side es -1, invertimos el cálculo)
        const manualSide = doorData.side || 1;
        const finalSign = baseSign * manualSide;

        return {
            position: [x, 0, z],
            rotation: [-Math.PI / 2, 0, wallAngle],
            inwardSign: finalSign,
            width: doorData.width || 0.9,
        };
    }, [wall, doorData, centroids]);

    const is2D = viewMode === VIEW_MODES.ZENITHAL;

    const handlePointerMove = (e: any) => {
        if (!is2D || !e.target.hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const mousePos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, mousePos);

        const v1 = new THREE.Vector2(wall.v1.x, wall.v1.z);
        const v2 = new THREE.Vector2(wall.v2.x, wall.v2.z);
        const mouse = new THREE.Vector2(mousePos.x, mousePos.z);

        const line = new THREE.Vector2().subVectors(v2, v1);
        const lenSq = line.lengthSq();
        if (lenSq === 0) return;

        const t = Math.max(0.05, Math.min(0.95, new THREE.Vector2().subVectors(mouse, v1).dot(line) / lenSq));
        onDrag(doorData.id, t);
    };

    const handlePointerDown = (e: any) => {
        if (!is2D) return;
        e.stopPropagation();
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: any) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    const handleDoubleClick = (e: any) => {
        e.stopPropagation();
        if (onUpdate) {
            onUpdate(doorData.id, { side: (doorData.side || 1) * -1 });
        }
    };

    const highlightColor = (hovered || isDragging) ? "#22c55e" : "#18181b";

    return (
        <group
            position={position as any}
            rotation={rotation as any}
            onPointerOver={() => is2D && setHovered(true)}
            onPointerOut={() => is2D && setHovered(false)}
            onDoubleClick={handleDoubleClick}
        >
            {/* Hitbox e Indicador Visual de Selección (Aumentamos Y para estar sobre el muro) */}
            <mesh
                position={[0, 0, 3]} // Z local = Global -Y. Ponemos 3 para que esté alto en 2D (pero invisible)
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <planeGeometry args={[width * 1.5, 1]} />
                <meshBasicMaterial
                    color="#22c55e"
                    transparent
                    opacity={hovered ? 0.2 : 0}
                />
            </mesh>

            {/* Borde sutil verde en hover / drag */}
            {(hovered || isDragging) && is2D && (
                <Line
                    points={[
                        new THREE.Vector3(-width / 2 - 0.1, -0.4, 3.1),
                        new THREE.Vector3(width / 2 + 0.1, -0.4, 3.1),
                        new THREE.Vector3(width / 2 + 0.1, 0.4, 3.1),
                        new THREE.Vector3(-width / 2 - 0.1, 0.4, 3.1),
                        new THREE.Vector3(-width / 2 - 0.1, -0.4, 3.1),
                    ]}
                    color="#22c55e"
                    lineWidth={2}
                />
            )}

            {/* Representación 3D del portal (Masa que atraviesa el muro) */}
            <mesh position={[0, 0, 1.25]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[width, 2.501, 0.35]} />
                <meshBasicMaterial
                    color={highlightColor}
                    transparent
                    opacity={viewMode === VIEW_MODES.THREE_D ? 0.6 : 0}
                />
            </mesh>

            {/* Representación CAD 2D */}
            {is2D && (
                <group>
                    {/* Marco/Umbral de la puerta */}
                    <mesh position={[0, 0, 0.1]}>
                        <boxGeometry args={[width, 0.1, 0.1]} />
                        <meshBasicMaterial color={highlightColor} />
                    </mesh>

                    {/* Hoja de la puerta (Multiplicamos la posición Y por inwardSign) */}
                    <mesh
                        position={[-width / 2, (width / 2) * inwardSign, 0.1]}
                        rotation={[0, 0, (Math.PI / 2) * inwardSign]}
                    >
                        <boxGeometry args={[width, 0.05, 0.05]} />
                        <meshBasicMaterial color={highlightColor} />
                    </mesh>

                    {/* Arco de apertura (Multiplicamos la coordenada Y de los puntos por inwardSign) */}
                    <Line
                        points={Array.from({ length: 16 }, (_, i) => {
                            const a = (i / 15) * Math.PI / 2;
                            return new THREE.Vector3(
                                -width / 2 + Math.cos(a) * width,
                                Math.sin(a) * width * inwardSign, // <-- Aplicamos el signo aquí
                                0.1
                            );
                        })}
                        color={highlightColor}
                        lineWidth={2}
                        dashed
                        dashSize={0.1}
                        gapSize={0.05}
                    />
                </group>
            )}
        </group>
    );
}

// --- 5. VENTANA ---
function Window({ windowData, wall, onDrag, viewMode }: any) {
    const [hovered, setHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { raycaster } = useThree();

    const { position, rotation, width, height } = useMemo(() => {
        const v1 = wall.v1;
        const v2 = wall.v2;
        const dx = v2.x - v1.x;
        const dz = v2.z - v1.z;
        const wallAngle = Math.atan2(dz, dx);

        const x = v1.x + dx * windowData.positionRatio;
        const z = v1.z + dz * windowData.positionRatio;

        return {
            position: [x, 1.2, z], // Altura media para la ventana
            rotation: [-Math.PI / 2, 0, wallAngle],
            width: 0.6, // 60cm de ancho
            height: 0.4 // 40cm de alto
        };
    }, [wall, windowData]);

    const is2D = viewMode === VIEW_MODES.ZENITHAL;

    const handlePointerMove = (e: any) => {
        if (!is2D || !e.target.hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const mousePos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, mousePos);

        const v1 = new THREE.Vector2(wall.v1.x, wall.v1.z);
        const v2 = new THREE.Vector2(wall.v2.x, wall.v2.z);
        const mouse = new THREE.Vector2(mousePos.x, mousePos.z);

        const line = new THREE.Vector2().subVectors(v2, v1);
        const lenSq = line.lengthSq();
        if (lenSq === 0) return;

        const t = Math.max(0.05, Math.min(0.95, new THREE.Vector2().subVectors(mouse, v1).dot(line) / lenSq));
        onDrag(windowData.id, t);
    };

    const handlePointerDown = (e: any) => {
        if (!is2D) return;
        e.stopPropagation();
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: any) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    const highlightColor = (hovered || isDragging) ? "#3b82f6" : "#18181b";

    return (
        <group
            position={position as any}
            rotation={rotation as any}
            onPointerOver={() => is2D && setHovered(true)}
            onPointerOut={() => is2D && setHovered(false)}
        >
            {/* Hitbox para arrastre */}
            {is2D && (
                <mesh
                    position={[0, 0, 3]}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <planeGeometry args={[width * 1.5, 1]} />
                    <meshBasicMaterial color="#3b82f6" transparent opacity={hovered ? 0.2 : 0} />
                </mesh>
            )}

            {/* Representación 3D (Caja de cristal que atraviesa el muro) */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[width, height, 0.4]} />
                <meshBasicMaterial
                    color="#93c5fd"
                    transparent
                    opacity={viewMode === VIEW_MODES.THREE_D ? 0.6 : 0}
                />
            </mesh>

            {/* Representación CAD 2D (Rectángulo sobre el muro) */}
            {is2D && (
                <group position={[0, 0, 2.0]}> {/* Elevado por encima del muro (1.2 + 2.0 = 3.2m > 2.5m) */}
                    {/* Recuadro de la ventana */}
                    <mesh>
                        <boxGeometry args={[width, 0.35, 0.05]} />
                        <meshBasicMaterial color={highlightColor} />
                    </mesh>

                    {/* Cristalera blanca interior */}
                    <mesh position={[0, 0, 0.01]}>
                        <boxGeometry args={[width - 0.05, 0.1, 0.06]} />
                        <meshBasicMaterial color="#e0f2fe" />
                    </mesh>

                    {/* Bordes negros decorativos */}
                    <Line
                        points={[
                            new THREE.Vector3(-width / 2, -0.175, 0.05),
                            new THREE.Vector3(width / 2, -0.175, 0.05),
                            new THREE.Vector3(width / 2, 0.175, 0.05),
                            new THREE.Vector3(-width / 2, 0.175, 0.05),
                            new THREE.Vector3(-width / 2, -0.175, 0.05),
                        ]}
                        color="#000000"
                        lineWidth={1}
                    />
                </group>
            )}
        </group>
    );
}

// --- 7. MUEBLE / FIXTURE ---
function Fixture({ data, onDrag, viewMode }: any) {
    const [hovered, setHovered] = useState(false);
    const { raycaster } = useThree();
    const is2D = viewMode === VIEW_MODES.ZENITHAL;

    const handlePointerMove = (e: any) => {
        if (!is2D || !e.target.hasPointerCapture(e.pointerId)) return;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const mousePos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, mousePos);
        onDrag(data.id, mousePos);
    };

    const render3D = () => {
        switch (data.type) {
            case 'washbasin':
                return (
                    <group>
                        <mesh position={[0, 0.85, 0]}>
                            <boxGeometry args={[0.5, 0.15, 0.4]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                        <mesh position={[0, 1.0, -0.15]}>
                            <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                );
            case 'toilet':
                return (
                    <group>
                        <mesh position={[0, 0.4, 0]}>
                            <cylinderGeometry args={[0.2, 0.15, 0.4, 16]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                        <mesh position={[0, 0.7, -0.2]}>
                            <boxGeometry args={[0.4, 0.4, 0.2]} />
                            <meshStandardMaterial color="#ffffff" />
                        </mesh>
                    </group>
                );
            case 'shower':
                return (
                    <group>
                        <mesh position={[0, 0.05, 0]}>
                            <boxGeometry args={[0.9, 0.1, 0.9]} />
                            <meshStandardMaterial color="#f8fafc" />
                        </mesh>
                        <mesh position={[0, 2.0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 0.1]} />
                            <meshStandardMaterial color="#94a3b8" />
                        </mesh>
                    </group>
                );
            case 'bathtub':
                return (
                    <mesh position={[0, 0.3, 0]}>
                        <boxGeometry args={[1.7, 0.6, 0.75]} />
                        <meshStandardMaterial color="#ffffff" />
                    </mesh>
                );
            default: return null;
        }
    };

    const render2D = () => {
        const color = hovered ? "#3b82f6" : "#475569";
        switch (data.type) {
            case 'washbasin':
                return (
                    <group>
                        <Line points={[[-0.25, 0.2, 0], [0.25, 0.2, 0], [0.25, -0.2, 0], [-0.25, -0.2, 0], [-0.25, 0.2, 0]] as any} color={color} lineWidth={2} />
                        <Circle args={[0.15, 32]} position={[0, 0, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial color={color} wireframe />
                        </Circle>
                    </group>
                );
            case 'toilet':
                return (
                    <group>
                        <Circle args={[0.18, 16]} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial color={color} wireframe />
                        </Circle>
                        <Line points={[[-0.2, -0.15, 0], [0.2, -0.15, 0], [0.2, -0.3, 0], [-0.2, -0.3, 0], [-0.2, -0.15, 0]] as any} color={color} lineWidth={2} />
                    </group>
                );
            case 'shower':
                return (
                    <group>
                        <Line points={[[-0.45, 0.45, 0], [0.45, 0.45, 0], [0.45, -0.45, 0], [-0.45, -0.45, 0], [-0.45, 0.45, 0]] as any} color={color} lineWidth={2} />
                        <Line points={[[-0.45, 0.45, 0], [0.45, -0.45, 0]] as any} color={color} lineWidth={1} />
                        <Line points={[[-0.45, -0.45, 0], [0.45, 0.45, 0]] as any} color={color} lineWidth={1} />
                    </group>
                );
            case 'bathtub':
                return (
                    <group>
                        <Line points={[[-0.85, 0.37, 0], [0.85, 0.37, 0], [0.85, -0.37, 0], [-0.85, -0.37, 0], [-0.85, 0.37, 0]] as any} color={color} lineWidth={2} />
                        <Circle args={[0.3, 32]} position={[0.5, 0, 0.01]} scale={[1, 0.8, 1]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial color={color} wireframe />
                        </Circle>
                    </group>
                );
            default: return null;
        }
    };

    return (
        <group
            position={[data.x, 0, data.z]}
            onPointerDown={(e) => {
                if (!is2D) return;
                e.stopPropagation();
                (e.target as Element).setPointerCapture(e.pointerId);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
                if (!is2D) return;
                (e.target as Element).releasePointerCapture(e.pointerId);
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {is2D ? (
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <mesh visible={false}>
                        <planeGeometry args={[1, 1]} />
                    </mesh>
                    {render2D()}
                </group>
            ) : (
                render3D()
            )}
        </group>
    );
}

// --- 8. ESCENA ---
function PlannerScene({ viewMode, showDimensions, vertices, connections, selectedId, setSelectedId, moveWall, updateVertex, doors, setDoors, windows, setWindows, fixtures, setFixtures }: any) {
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
                const v1 = vertices.find((v: any) => v.id === conn.start)!;
                const v2 = vertices.find((v: any) => v.id === conn.end)!;

                // Encontrar vecinos para la mitra
                const prevConn = connections.find((c: any) => c.end === conn.start)!;
                const nextConn = connections.find((c: any) => c.start === conn.end)!;
                const vPrev = vertices.find((v: any) => v.id === prevConn.start)!;
                const vNext = vertices.find((v: any) => v.id === nextConn.end)!;

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

            {doors.map((door: any) => {
                const wallConn = connections.find((c: any) => c.id === door.wallId);
                if (!wallConn) return null;
                const v1 = vertices.find((v: any) => v.id === wallConn.start)!;
                const v2 = vertices.find((v: any) => v.id === wallConn.end)!;

                // Necesitamos la info de la pared para posicionar la puerta
                const prevConn = connections.find((c: any) => c.end === wallConn.start)!;
                const nextConn = connections.find((c: any) => c.start === wallConn.end)!;
                const vPrev = vertices.find((v: any) => v.id === prevConn.start)!;
                const miter = getMiterPoints(vPrev, v1, v2, 0.25);

                const wallData = { v1, v2, outerNormal: miter.bisector };

                // Enviar centroide para orientación
                const cx = vertices.reduce((s: any, v: any) => s + v.x, 0) / vertices.length;
                const cz = vertices.reduce((s: any, v: any) => s + v.z, 0) / vertices.length;

                return (
                    <Door
                        key={door.id}
                        doorData={door}
                        wall={wallData}
                        centroids={{ x: cx, z: cz }}
                        viewMode={viewMode}
                        onDrag={(id: string, ratio: number) => {
                            setDoors((prev: any) => prev.map((d: any) => d.id === id ? { ...d, positionRatio: ratio } : d));
                        }}
                        onUpdate={(id: string, updates: any) => {
                            setDoors((prev: any) => prev.map((d: any) => d.id === id ? { ...d, ...updates } : d));
                        }}
                    />
                );
            })}

            {windows.map((window: any) => {
                const wallConn = connections.find((c: any) => c.id === window.wallId);
                if (!wallConn) return null;
                const v1 = vertices.find((v: any) => v.id === wallConn.start)!;
                const v2 = vertices.find((v: any) => v.id === wallConn.end)!;
                const wallData = { v1, v2 };

                return (
                    <Window
                        key={window.id}
                        windowData={window}
                        wall={wallData}
                        viewMode={viewMode}
                        onDrag={(id: string, ratio: number) => {
                            setWindows((prev: any) => prev.map((w: any) => w.id === id ? { ...w, positionRatio: ratio } : w));
                        }}
                    />
                );
            })}

            {fixtures.map((fixture: any) => (
                <Fixture
                    key={fixture.id}
                    data={fixture}
                    viewMode={viewMode}
                    onDrag={(id: string, pos: THREE.Vector3) => {
                        setFixtures((prev: any) => prev.map((f: any) => f.id === id ? { ...f, x: pos.x, z: pos.z } : f));
                    }}
                />
            ))}

            {vertices.map((v: any) => (
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

    // ESTADO DE PUERTAS, VENTANAS Y MOBILIARIO
    const [doors, setDoors] = useState<any[]>([]);
    const [windows, setWindows] = useState<any[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [doorLibraryOpen, setDoorLibraryOpen] = useState(false);

    // --- LÓGICA DE PUERTAS ---
    const handleAddDoorRequest = () => {
        if (!selectedId) return setModal("You must select a wall");
        const wall = connections.find(c => c.id === selectedId)!;
        const v1 = vertices.find(v => v.id === wall.start)!;
        const v2 = vertices.find(v => v.id === wall.end)!;
        const length = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.z - v1.z, 2));

        if (length < 1.5) return setModal("The wall need at least 150 cm");
        setDoorLibraryOpen(true);
    };

    const addDoor = (type: string) => {
        const newDoor = {
            id: `door_${Date.now()}`,
            wallId: selectedId,
            positionRatio: 0.5,
            side: 1,
            type: type,
            width: 0.9
        };
        setDoors(prev => [...prev, newDoor]);
        setDoorLibraryOpen(false);
        setSelectedId(null);
    };

    const handleAddWindowRequest = () => {
        if (!selectedId) return setModal("You must select a wall");
        const wall = connections.find(c => c.id === selectedId)!;
        const v1 = vertices.find(v => v.id === wall.start)!;
        const v2 = vertices.find(v => v.id === wall.end)!;
        const length = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.z - v1.z, 2));

        if (length < 1.5) return setModal("The wall need to have at least 150cm");

        const newWindow = {
            id: `window_${Date.now()}`,
            wallId: selectedId,
            positionRatio: 0.5,
        };
        setWindows(prev => [...prev, newWindow]);
        setSelectedId(null);
    };

    const handleAddWashbasinRequest = () => {
        if (fixtures.some(f => f.type === 'washbasin')) return setModal("Already have a washbasin");
        addFixture('washbasin');
    };

    const handleAddShowerRequest = () => {
        if (fixtures.some(f => f.type === 'shower')) return setModal("Already have a shower");
        addFixture('shower');
    };

    const handleAddToiletRequest = () => {
        if (fixtures.some(f => f.type === 'toilet')) return setModal("Already have a toilet");
        addFixture('toilet');
    };

    const handleAddBathtubRequest = () => {
        if (fixtures.some(f => f.type === 'bathtub')) return setModal("Already have a bathtub");
        addFixture('bathtub');
    };

    const addFixture = (type: string) => {
        // Calcular centro
        const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
        const cz = vertices.reduce((s, v) => s + v.z, 0) / vertices.length;
        
        const newFixture = {
            id: `${type}_${Date.now()}`,
            type: type,
            x: cx,
            z: cz
        };
        setFixtures(prev => [...prev, newFixture]);
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

    // --- LÓGICA DE MERGE (UNIFICAR Y NIVELAR) ---
    const handleMerge = () => {
        if (!selectedId) return setModal("You must select a wall");

        let targetConns = [...connections];
        let targetVerts = [...vertices];

        const wallIdx = targetConns.findIndex(c => c.id === selectedId);
        const wall = targetConns[wallIdx];

        // Verificar si es un segmento transversal de un escalón (w_b_...)
        if (!wall.id.includes('w_b_')) return setModal("Select the transversal segment of the step to merge");

        const prevW = targetConns[wallIdx - 1];
        const nextW = targetConns[wallIdx + 1];

        if (prevW && nextW) {
            const v1 = targetVerts.find(v => v.id === prevW.start)!;
            const vA = targetVerts.find(v => v.id === wall.start)!; // Vértice 1 del escalón
            const vB = targetVerts.find(v => v.id === wall.end)!;   // Vértice 2 del escalón
            const v2 = targetVerts.find(v => v.id === nextW.end)!;

            // Calcular centroide para nivelar a la pared más exterior
            const cx = targetVerts.reduce((s, v) => s + v.x, 0) / targetVerts.length;
            const cz = targetVerts.reduce((s, v) => s + v.z, 0) / targetVerts.length;

            const distPrev = Math.pow((v1.x + vA.x) / 2 - cx, 2) + Math.pow((v1.z + vA.z) / 2 - cz, 2);
            const distNext = Math.pow((vB.x + v2.x) / 2 - cx, 2) + Math.pow((vB.z + v2.z) / 2 - cz, 2);

            const offset = new THREE.Vector3(vB.x - vA.x, 0, vB.z - vA.z);

            if (distNext > distPrev) {
                // Nivelar pared anterior (v1) hacia la posición de la pared siguiente
                targetVerts = targetVerts.map(v => (v.id === v1.id) ? { ...v, x: v.x + offset.x, z: v.z + offset.z } : v);
            } else {
                // Nivelar pared siguiente (v2) hacia la posición de la pared anterior
                targetVerts = targetVerts.map(v => (v.id === v2.id) ? { ...v, x: v.x - offset.x, z: v.z - offset.z } : v);
            }

            // Crear el nuevo muro unificado
            const newWall = { id: `wm_${Date.now()}`, start: v1.id, end: v2.id };
            targetConns.splice(wallIdx - 1, 3, newWall);

            // Eliminar vértices huérfanos del escalón (vA y vB)
            targetVerts = targetVerts.filter(v => v.id !== vA.id && v.id !== vB.id);

            setVertices(targetVerts);
            setConnections(targetConns);
        }

        setSelectedId(null);
    };

    return (
        <div className="w-full h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Modal de Biblioteca de Puertas */}
            {doorLibraryOpen && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] shadow-2xl border border-zinc-100 max-w-2xl w-full p-10 relative overflow-hidden">
                        <button onClick={() => setDoorLibraryOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-black">
                            ✕
                        </button>
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter italic">Door Library</h2>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Select a style to insert</p>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            {[
                                { id: 'classic', name: 'Classic Wood', icon: '🚪' },
                                { id: 'glass', name: 'Modern Glass', icon: '🪟' },
                                { id: 'frame', name: 'Simple Archway', icon: '⬜' }
                            ].map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => addDoor(style.id)}
                                    className="group flex flex-col items-center bg-zinc-50 border-2 border-transparent hover:border-orange-500 hover:bg-white p-8 rounded-[32px] transition-all"
                                >
                                    <div className="w-24 h-32 bg-white border border-zinc-200 rounded-xl mb-4 shadow-sm flex items-center justify-center text-4xl group-hover:shadow-xl group-hover:-translate-y-2 transition-all overflow-hidden relative">
                                        {/* Representación visual abstracta de la puerta */}
                                        <div className="absolute inset-2 border-2 border-zinc-100 rounded-lg" />
                                        <div className="absolute top-1/2 right-2 w-2 h-2 bg-zinc-200 rounded-full" />
                                        {style.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-black">{style.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                        { label: 'Add Door', action: handleAddDoorRequest },
                        { label: 'Add Window', action: handleAddWindowRequest },
                        { label: 'Add washbasin', action: handleAddWashbasinRequest },
                        { label: 'Add shower', action: handleAddShowerRequest },
                        { label: 'Add toilet', action: handleAddToiletRequest },
                        { label: 'Add bathtub', action: handleAddBathtubRequest },
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
                    doors={doors}
                    setDoors={setDoors}
                    windows={windows}
                    setWindows={setWindows}
                    fixtures={fixtures}
                    setFixtures={setFixtures}
                />
            </Canvas>
        </div>
    )
}