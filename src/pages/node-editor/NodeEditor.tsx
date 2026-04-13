import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Handle,
    Position,
    applyEdgeChanges,
    applyNodeChanges,
    ReactFlowProvider,
} from 'reactflow';
import type {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    NodeProps,
    Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Sphere, Box, Stars, ContactShadows } from '@react-three/drei';

// --- TYPES ---
interface NodeData {
    id: string;
    type?: 'box' | 'sphere';
    color?: string;
    onChange?: (id: string, color: string) => void;
}

type CustomNode = Node<NodeData>;

// --- ICONOS SVG ---
const IconBox = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
const IconSphere = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
);
const IconPalette = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
);

// --- ESTILOS ADICIONALES ---
const styleTag = `
  .react-flow__handle {
    width: 8px;
    height: 8px;
    background: #444;
  }
  .react-flow__container {
    background-color: #0f172a;
  }
`;

// --- COMPONENTES DE NODOS ---

const GeometryNode = ({ data }: NodeProps<NodeData>) => (
    <div className="bg-white border-2 border-indigo-500 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
        <div className="bg-indigo-50 px-3 py-1 border-b border-indigo-100 flex items-center gap-2">
            <div className="text-indigo-600">
                {data.type === 'box' ? <IconBox /> : <IconSphere />}
            </div>
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{data.type}</span>
        </div>
        <div className="p-3 text-[10px] text-gray-500 font-medium">
            ENTRADA MATERIAL
        </div>
        <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3" />
    </div>
);

const MaterialNode = ({ data }: NodeProps<NodeData>) => (
    <div className="bg-white border-2 border-pink-500 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
        <div className="bg-pink-50 px-3 py-1 border-b border-pink-100 flex items-center gap-2">
            <div className="text-pink-600">
                <IconPalette />
            </div>
            <span className="text-xs font-bold text-pink-900 uppercase tracking-wider">Color</span>
        </div>
        <div className="p-3">
            <input
                type="color"
                value={data.color || '#6366f1'}
                onChange={(evt) => data.onChange?.(data.id, evt.target.value)}
                className="w-full h-8 cursor-pointer rounded border-none bg-transparent"
            />
        </div>
        <Handle type="source" position={Position.Right} className="!bg-pink-500 !w-3 !h-3" />
    </div>
);

const nodeTypes = {
    geometry: GeometryNode,
    material: MaterialNode,
};

// --- COMPONENTE DE PREVISUALIZACIÓN 3D ---
interface SceneItem {
    id: string;
    type: 'box' | 'sphere';
    color: string;
}

const ScenePreview = ({ sceneData }: { sceneData: SceneItem[] }) => {
    return (
        <Canvas shadows camera={{ position: [4, 4, 4], fov: 45 }}>
            <color attach="background" args={['#111111']} />
            <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

            <Stage environment="city" intensity={0.6} shadows={false}>
                {sceneData.map((item, idx) => {
                    const position: [number, number, number] = [idx * 2 - (sceneData.length - 1), 0, 0];
                    if (item.type === 'box') {
                        return (
                            <Box key={item.id} position={position} castShadow receiveShadow>
                                <meshStandardMaterial color={item.color} roughness={0.3} metalness={0.8} />
                            </Box>
                        );
                    }
                    if (item.type === 'sphere') {
                        return (
                            <Sphere key={item.id} position={position} args={[0.7, 64, 64]} castShadow receiveShadow>
                                <meshStandardMaterial color={item.color} roughness={0.3} metalness={0.8} />
                            </Sphere>
                        );
                    }
                    return null;
                })}
            </Stage>

            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
            <OrbitControls makeDefault />
        </Canvas>
    );
};

// --- APLICACIÓN PRINCIPAL ---
function Editor() {
    const updateColor = useCallback((id: string, color: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, color } };
                }
                return node;
            })
        );
    }, []);

    const [nodes, setNodes] = useState<CustomNode[]>([
        {
            id: 'node-1',
            type: 'geometry',
            position: { x: 300, y: 150 },
            data: { id: 'node-1', type: 'box' },
        },
        {
            id: 'node-2',
            type: 'material',
            position: { x: 50, y: 150 },
            data: {
                id: 'node-2',
                color: '#6366f1',
                onChange: updateColor
            },
        },
    ]);
    const [edges, setEdges] = useState<Edge[]>([
        { id: 'e2-1', source: 'node-2', target: 'node-1' }
    ]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect: OnConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        []
    );

    const sceneData = useMemo(() => {
        return nodes
            .filter((n) => n.type === 'geometry')
            .map((geoNode) => {
                const edge = edges.find((e) => e.target === geoNode.id);
                const matNode = edge ? nodes.find((n) => n.id === edge.source) : null;
                return {
                    id: geoNode.id,
                    type: geoNode.data.type as 'box' | 'sphere',
                    color: matNode?.data.color || '#ffffff'
                };
            });
    }, [nodes, edges]);

    const addNode = (type: string, subType: 'box' | 'sphere' | 'color') => {
        const id = `node-${Date.now()}`;
        const newNode: CustomNode = {
            id,
            type,
            position: { x: 100, y: 100 },
            data: {
                id,
                type: subType === 'color' ? undefined : (subType as 'box' | 'sphere'),
                color: '#ffffff',
                onChange: updateColor
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
            <style>{styleTag}</style>

            {/* Header Estilizado */}
            <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 z-20 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 p-1.5 rounded-lg shadow-inner">
                        <IconBox />
                    </div>
                    <span className="font-black tracking-tighter text-lg uppercase">R3F <span className="text-indigo-400">Node</span>Flow</span>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => addNode('geometry', 'box')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-xs font-bold border border-slate-600 transition-all flex items-center gap-2">
                        <IconBox /> + CAJA
                    </button>
                    <button onClick={() => addNode('geometry', 'sphere')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-xs font-bold border border-slate-600 transition-all flex items-center gap-2">
                        <IconSphere /> + ESFERA
                    </button>
                    <button onClick={() => addNode('material', 'color')} className="bg-pink-600 hover:bg-pink-500 px-3 py-1.5 rounded-md text-xs font-bold border border-pink-500 transition-all flex items-center gap-2">
                        <IconPalette /> + COLOR
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Editor de Nodos - 60% de ancho */}
                <div className="flex-1 h-1/2 md:h-full md:w-3/5 bg-slate-900 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#334155" gap={20} size={1} />
                        <Controls />
                    </ReactFlow>
                </div>

                {/* Viewport 3D - 40% de ancho */}
                <div className="h-1/2 md:h-full md:w-2/5 border-t md:border-t-0 md:border-l border-slate-700 relative">
                    <div className="absolute top-4 right-4 z-10">
                        <div className="bg-indigo-500/20 backdrop-blur-md border border-indigo-500/50 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                            Realtime Render
                        </div>
                    </div>
                    <ScenePreview sceneData={sceneData} />
                </div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <ReactFlowProvider>
            <Editor />
        </ReactFlowProvider>
    );
}