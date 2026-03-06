import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, ContactShadows } from '@react-three/drei'
import { useState } from 'react'
import { Shelf, type ShelfType } from './Shelf'

// Definimos los tipos de estantes
const SHELF_STYLES = [
    { id: 'classic', name: 'Classic Grid', description: 'Modern and minimalist design', rows: 4, cols: 2, icon: '▦' },
    { id: 'L-shape', name: 'L-Minimal', description: 'Perfect for corners and small spaces', rows: 2, cols: 2, icon: '⌊' },
    { id: 'TV-unit', name: 'Entertainment Center', description: 'Perfect for entertainment centers', rows: 2, cols: 2, icon: '📺' },
    { id: 'wall-bar', name: 'Floating Bar', description: 'Perfect for displaying collectibles', rows: 1, cols: 4, icon: '▬' },
    { id: 'T-invert', name: 'T Format', description: 'Unique and modern design', rows: 2, cols: 2, icon: 'T' },
    { id: 'H-shape', name: 'H-Shape', description: 'For Small Spaces', rows: 2, cols: 2, icon: 'H' },
];

export default function ShelfConfigurator() {
    const [cartCount, setCartCount] = useState(0);
    const [config, setConfig] = useState({
        type: 'classic' as ShelfType,
        rows: 4,
        cols: 2,
        width: 2,
        height: 2,
        color: '#8B4513'
    });

    const handleAddToCart = () => {
        setCartCount(prev => prev + 1);
    };

    const selectPreset = (type: typeof SHELF_STYLES[0]) => {
        setConfig({ ...config, rows: type.rows, cols: type.cols, type: type.id as ShelfType });
    };

    return (
        <div className="relative w-screen h-screen bg-stone-100 flex overflow-hidden">

            {/* 1. BARRA LATERAL IZQUIERDA: Selector de Tipos */}
            <div className="w-20 bg-white border-r border-stone-200 flex flex-col items-center py-6 gap-6 z-10">
                <div className="text-2xl mb-4 font-bold text-stone-800 italic">N</div>
                {SHELF_STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => selectPreset(style)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${config.type === style.id ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                            }`}
                    >
                        {style.icon}
                    </button>
                ))}
            </div>

            {/* 2. BOTÓN DE CARRITO SUPERIOR */}
            <div className="absolute top-6 right-[400px] z-20">
                <button className="bg-white px-6 py-3 rounded-full shadow-lg border border-stone-200 flex items-center gap-3 hover:scale-105 transition-transform active:scale-95">
                    <span className="text-xl">🛒</span>
                    <span className="font-light text-stone-800 text-white">{cartCount}</span>
                    <span className="text-xs text-stone-400 uppercase tracking-tighter font-bold">Items</span>
                </button>
            </div>

            {/* 3. VIEWPORT 3D */}
            <div className="flex-grow relative bg-white">
                <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
                    <Stage environment="city" intensity={0.6}>
                        <Shelf {...config} />
                    </Stage>
                    <OrbitControls makeDefault minDistance={1.5} maxDistance={8} />
                    <ContactShadows
                        position={[0, -config.height / 2, 0]}
                        opacity={0.6}
                        scale={10}
                        blur={2}
                        far={4}
                    />
                </Canvas>
            </div>

            {/* 4. PANEL DE CONFIGURACIÓN DERECHA */}
            <div className="w-96 p-8 bg-white shadow-2xl flex flex-col gap-6 border-l border-stone-200 z-10">
                <div>
                    <h1 className="text-3xl font-bold text-stone-800 leading-none">{SHELF_STYLES.find(s => s.id === config.type)?.name}</h1>
                    <p className="text-stone-400 mt-2 text-xs uppercase font-bold tracking-widest italic italic">{SHELF_STYLES.find(s => s.id === config.type)?.description}</p>
                </div>

                <div className="space-y-6">
                    <label className="block">
                        <span className="text-[10px] font-black text-stone-400 uppercase flex justify-between">
                            Vertical Divisions <span>{config.rows}</span>
                        </span>
                        <input type="range" min="1" max="8" value={config.rows} onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) })} className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-800 mt-2" />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-black text-stone-400 uppercase flex justify-between">
                            Horizontal Divisions <span>{config.cols}</span>
                        </span>
                        <input type="range" min="1" max="6" value={config.cols} onChange={(e) => setConfig({ ...config, cols: parseInt(e.target.value) })} className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-800 mt-2" />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-[10px] font-black text-stone-400 uppercase">Width (m)</span>
                            <input type="range" min="1" max="4" step="0.1" value={config.width} onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) })} className="w-full border-b border-stone-200 py-1 text-sm focus:outline-none focus:border-stone-800" />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-black text-stone-400 uppercase">Height (m)</span>
                            <input type="range" min="1" max="3" step="0.1" value={config.height} onChange={(e) => setConfig({ ...config, height: parseFloat(e.target.value) })} className="w-full border-b border-stone-200 py-1 text-sm focus:outline-none focus:border-stone-800" />
                        </label>
                    </div>

                    <div>
                        <span className="text-[10px] font-black text-stone-400 uppercase block mb-3">Color of Finish</span>
                        <div className="flex gap-3">
                            {['#8B4513', '#D2B48C', '#2F1B12', '#444444', '#f3f3f3'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setConfig({ ...config, color: c })}
                                    className={`w-6 h-6 rounded-full transition-transform ${config.color === c ? 'ring-2 ring-stone-800 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto border-t border-stone-100 pt-6">
                    <div className="flex justify-between items-end mb-4 font-mono">
                        <span className="text-stone-400 text-[10px]">TOTAL_PRICE_USD</span>
                        <span className="text-3xl font-bold text-stone-900 leading-none">
                            ${(config.rows * config.cols * 45 * (config.height / config.width)).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-stone-200"
                    >
                        Add to cart
                    </button>
                </div>
            </div>
        </div>
    )
}