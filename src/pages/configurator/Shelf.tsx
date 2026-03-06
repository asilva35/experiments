import { useMemo } from 'react'

// Tipos de estantes soportados
export type ShelfType = 'classic' | 'L-shape' | 'T-invert' | 'TV-unit' | 'H-shape' | 'wall-bar';

interface ShelfProps {
    type: ShelfType;
    rows: number;
    cols: number;
    width: number;
    height: number;
    color: string;
}

export function Shelf({ type, rows, cols, width, height, color }: ShelfProps) {
    const thickness = 0.02;
    const depth = 0.4;

    const parts = useMemo(() => {
        const p = [];
        const rowStep = height / rows;
        const colStep = width / cols;

        switch (type) {
            case 'classic':
                // Lógica que ya teníamos
                for (let i = 0; i <= rows; i++) p.push({ pos: [0, i * rowStep - height / 2, 0], args: [width, thickness, depth] });
                for (let i = 0; i <= cols; i++) p.push({ pos: [i * colStep - width / 2, 0, 0], args: [thickness, height, depth] });
                break;

            case 'L-shape':
                // Base horizontal larga y un lateral alto
                p.push({ pos: [0, -height / 2, 0], args: [width, thickness, depth] }); // Base
                p.push({ pos: [0, -height / 4, 0], args: [width, thickness, depth] }); // Base
                p.push({ pos: [-width / 2, 0, 0], args: [thickness, height, depth] }); // Lado izquierdo
                p.push({ pos: [-width / 4, 0, 0], args: [thickness, height, depth] }); // Lado izquierdo
                p.push({ pos: [width / 2, -height / 2.65, 0, 0], args: [thickness, height / 4, depth] }); // Lado derecho
                p.push({ pos: [-width / 2.65, height / 2, 0], args: [width / 4, thickness, depth] }); // Techo
                // Divisiones solo en la parte inferior
                for (let i = 1; i < rows / 2; i++) p.push({ pos: [-width / 2.65, i * rowStep - height / 4, 0], args: [width / 4, thickness, depth] });
                for (let i = 1; i < cols / 2; i++) p.push({ pos: [i * colStep - width / 4, -height / 2.65, 0], args: [thickness, height / 4, depth] });
                break;

            case 'TV-unit':
                // Marco exterior con un hueco grande en el centro (forma de O)
                p.push({ pos: [0, -height / 2, 0], args: [width, thickness, depth] }); // Suelo
                p.push({ pos: [0, height / 2, 0], args: [width, thickness, depth] });  // Techo
                p.push({ pos: [-width / 2, 0, 0], args: [thickness, height, depth] }); // Izq
                p.push({ pos: [width / 2, 0, 0], args: [thickness, height, depth] });  // Der
                // Repisas pequeñas solo arriba y abajo del hueco central
                p.push({ pos: [0, -height / 4, 0], args: [width, thickness, depth] });
                p.push({ pos: [0, height / 4, 0], args: [width, thickness, depth] });
                for (let i = 1; i < rows / 2; i++) p.push({ pos: [-width / 2.65, i * rowStep - height / 4, 0], args: [width / 4, thickness, depth] });
                for (let i = 1; i < cols / 2; i++) p.push({ pos: [i * colStep - width / 4, -height / 2.65, 0], args: [thickness, height / 4, depth] });
                break;

            case 'wall-bar':
                // No toca el piso, es una barra flotante con divisiones
                p.push({ pos: [0, 0, 0], args: [width, thickness, depth] }); // Estante principal
                for (let i = 0; i <= cols; i++) {
                    p.push({ pos: [i * colStep - width / 2, thickness * 2, 0], args: [thickness, height / 4, depth] });
                }
                break;

            case 'T-invert':
                // Dos repisas horizontales separadas por una columna vertical
                p.push({ pos: [0, height / 2, 0], args: [width, thickness, depth] }); // Techo
                p.push({ pos: [0, height / 4, 0], args: [width, thickness, depth] }); // Techo
                p.push({ pos: [0, -height / 2, 0], args: [width / 3.85, thickness, depth] });  // Suelo
                p.push({ pos: [width / 8, 0, 0], args: [thickness, height, depth] }); // Columna vertical
                p.push({ pos: [-width / 8, 0, 0], args: [thickness, height, depth] }); // Columna vertical
                p.push({ pos: [width / 2, height / 2.65, 0], args: [thickness, height / 4, depth] }); // Lateral
                p.push({ pos: [-width / 2, height / 2.65, 0], args: [thickness, height / 4, depth] }); // Lateral
                for (let i = 1; i < rows / 2; i++) p.push({ pos: [-width / 3.20, i * rowStep / 2 + height / 4.25, 0], args: [width / 2.65, thickness, depth] });
                for (let i = 1; i < rows / 2; i++) p.push({ pos: [width / 3.20, i * rowStep / 2 + height / 4.25, 0], args: [width / 2.65, thickness, depth] });
                for (let i = 1; i < cols / 2; i++) p.push({ pos: [i * colStep / 2 - width / 8, -height / 8, 0], args: [thickness, height / 1.35, depth] });
                break;

            case 'H-shape':
                // H Shape
                p.push({ pos: [width / 2, 0, 0], args: [thickness, height, depth] }); // Lateral
                p.push({ pos: [-width / 2, 0, 0], args: [thickness, height, depth] }); // Lateral
                p.push({ pos: [width / 3, 0, 0], args: [thickness, height, depth] }); // Lateral
                p.push({ pos: [-width / 3, 0, 0], args: [thickness, height, depth] }); // Lateral
                p.push({ pos: [0, height / 12, 0], args: [width, thickness, depth] }); // Centro
                p.push({ pos: [0, -height / 12, 0], args: [width, thickness, depth] }); // Centro
                p.push({ pos: [width / 2.4, height / 2, 0], args: [width / 6, thickness, depth] }); // Techo
                p.push({ pos: [-width / 2.4, height / 2, 0], args: [width / 6, thickness, depth] }); // Techo
                p.push({ pos: [width / 2.4, -height / 2, 0], args: [width / 6, thickness, depth] }); // Suelo
                p.push({ pos: [-width / 2.4, -height / 2, 0], args: [width / 6, thickness, depth] }); // Suelo
                break;
        }
        return p;
    }, [type, rows, cols, width, height]);

    return (
        <group>
            {parts.map((part, i) => (
                <mesh key={i} position={part.pos as any}>
                    <boxGeometry args={part.args as any} />
                    <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
                </mesh>
            ))}
        </group>
    );
}