import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
    Upload,
    Settings2,
    Download,
    Image as ImageIcon,
    RefreshCw,
    Maximize2,
    X,
    Printer,
    Circle,
    AlignJustify,
    Ruler,
    Layers,
    Lock,
    Unlock
} from 'lucide-react';

// --- Interfaces para TypeScript ---
interface AppSettings {
    mode: 'lines' | 'dots';
    lineSpacing: number;
    maxThickness: number;
    contrast: number;
    invert: boolean;
    showGrid: boolean;
    gridSize: number;
    isTemplateMode: boolean;
    physicalWidthCm: number;
    physicalHeightCm: number;
    lockAspectRatio: boolean;
    paperType: 'letter' | 'a4';
}

const App: React.FC = () => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [settings, setSettings] = useState<AppSettings>({
        mode: 'lines',
        lineSpacing: 10,
        maxThickness: 8,
        contrast: 1.2,
        invert: false,
        showGrid: false,
        gridSize: 50,
        isTemplateMode: true,
        physicalWidthCm: 60,
        physicalHeightCm: 40,
        lockAspectRatio: true,
        paperType: 'letter'
    });
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const PAPER_SIZES = {
        letter: { w: 21.59, h: 27.94 },
        a4: { w: 21.0, h: 29.7 }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Actualizar altura cuando cambia el ancho si el aspecto está bloqueado
    const updateWidth = (newWidth: number) => {
        if (settings.lockAspectRatio && image) {
            const ratio = image.height / image.width;
            setSettings({
                ...settings,
                physicalWidthCm: newWidth,
                physicalHeightCm: Math.round(newWidth * ratio)
            });
        } else {
            setSettings({ ...settings, physicalWidthCm: newWidth });
        }
    };

    // Actualizar ancho cuando cambia el alto si el aspecto está bloqueado
    const updateHeight = (newHeight: number) => {
        if (settings.lockAspectRatio && image) {
            const ratio = image.width / image.height;
            setSettings({
                ...settings,
                physicalHeightCm: newHeight,
                physicalWidthCm: Math.round(newHeight * ratio)
            });
        } else {
            setSettings({ ...settings, physicalHeightCm: newHeight });
        }
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    const ratio = img.height / img.width;
                    setSettings(prev => ({
                        ...prev,
                        physicalHeightCm: Math.round(prev.physicalWidthCm * ratio)
                    }));
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = (img: HTMLImageElement, currentSettings: AppSettings) => {
        if (!img || !canvasRef.current) return;
        setIsProcessing(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const hiddenCanvas = hiddenCanvasRef.current;
        if (!ctx || !hiddenCanvas) return;

        const hCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
        if (!hCtx) return;

        // Definimos una resolución base para el canvas de previsualización
        // El aspecto del canvas ahora sigue las medidas físicas definidas por el usuario
        const targetRatio = currentSettings.physicalHeightCm / currentSettings.physicalWidthCm;
        const baseWidth = 1600;
        canvas.width = baseWidth;
        canvas.height = baseWidth * targetRatio;

        hiddenCanvas.width = canvas.width;
        hiddenCanvas.height = canvas.height;

        // Lógica de "Object Fit: Cover" para dibujar la imagen en el canvas
        const imgRatio = img.height / img.width;
        let drawW, drawH, offsetX = 0, offsetY = 0;

        if (imgRatio > targetRatio) {
            drawW = canvas.width;
            drawH = canvas.width * imgRatio;
            offsetY = (canvas.height - drawH) / 2;
        } else {
            drawH = canvas.height;
            drawW = canvas.height / imgRatio;
            offsetX = (canvas.width - drawW) / 2;
        }

        // Limpiar y dibujar imagen original con el recorte aplicado
        hCtx.fillStyle = '#000000';
        hCtx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        hCtx.drawImage(img, offsetX, offsetY, drawW, drawH);

        const imageData = hCtx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        const data = imageData.data;

        const bgColor = currentSettings.isTemplateMode ? '#ffffff' : '#000000';
        const fgColor = currentSettings.isTemplateMode ? '#111111' : '#ffffff';
        const gridColor = currentSettings.isTemplateMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = fgColor;

        const { mode, lineSpacing, maxThickness, contrast, invert, showGrid, gridSize } = currentSettings;

        if (mode === 'lines') {
            for (let x = 0; x < canvas.width; x += lineSpacing) {
                for (let y = 0; y < canvas.height; y += 1) {
                    const i = (Math.floor(y) * hiddenCanvas.width + Math.floor(x)) * 4;
                    let avg = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
                    avg = Math.pow(avg, contrast);
                    const intensity = currentSettings.isTemplateMode ? avg : (invert ? 1 - avg : avg);
                    const thickness = Math.max(0, intensity * maxThickness);
                    if (thickness > 0.1) ctx.fillRect(x - thickness / 2, y, thickness, 1);
                }
            }
        } else if (mode === 'dots') {
            for (let x = 0; x < canvas.width; x += lineSpacing) {
                for (let y = 0; y < canvas.height; y += lineSpacing) {
                    const i = (Math.floor(y) * hiddenCanvas.width + Math.floor(x)) * 4;
                    let avg = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
                    avg = Math.pow(avg, contrast);
                    const intensity = currentSettings.isTemplateMode ? avg : (invert ? 1 - avg : avg);
                    const radius = (intensity * lineSpacing) / 2;
                    if (radius > 0.5) {
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        if (showGrid) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = gridColor;

            for (let x = 0; x <= canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
                ctx.fillText(Math.floor(x / gridSize).toString(), x + 4, 15);
            }
            for (let y = 0; y <= canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
                ctx.fillText(String.fromCharCode(65 + Math.floor(y / gridSize) % 26), 4, y - 4);
            }
        }

        setIsProcessing(false);
    };

    useEffect(() => {
        if (image) {
            const timer = setTimeout(() => processImage(image, settings), 150);
            return () => clearTimeout(timer);
        }
    }, [settings, image]);

    const downloadImage = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `plantilla-${settings.mode}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const printTiledTemplate = () => {
        if (!canvasRef.current || !image) return;

        const paperSize = PAPER_SIZES[settings.paperType];
        const cols = Math.ceil(settings.physicalWidthCm / paperSize.w);
        const rows = Math.ceil(settings.physicalHeightCm / paperSize.h);

        const printWin = window.open('', '', 'width=1000,height=800');
        if (!printWin) return;

        printWin.document.open();
        printWin.document.write(`
      <html>
        <head>
          <title>Impresión de Plantilla Multi-página</title>
          <style>
            @page { margin: 0; size: ${settings.paperType === 'letter' ? '8.5in 11in' : 'A4'}; }
            body { margin: 0; padding: 0; font-family: sans-serif; background: #eee; }
            .page-container { 
              width: ${paperSize.w}cm; 
              height: ${paperSize.h}cm; 
              position: relative; 
              overflow: hidden; 
              background: white;
              page-break-after: always;
              border: 1px solid #ddd;
              box-sizing: border-box;
            }
            .tile-img {
              position: absolute;
              width: ${settings.physicalWidthCm}cm;
              height: ${settings.physicalHeightCm}cm;
            }
            .info-label {
              position: absolute;
              bottom: 10px;
              right: 10px;
              background: rgba(255,255,255,0.8);
              padding: 4px 8px;
              font-size: 10px;
              border: 1px solid #ccc;
              color: #333;
              z-index: 10;
            }
            @media print {
              body { background: white; }
              .page-container { border: none; }
            }
          </style>
        </head>
        <body>
    `);

        const dataUrl = canvasRef.current.toDataURL();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const leftOffset = -(c * paperSize.w);
                const topOffset = -(r * paperSize.h);

                printWin.document.write(`
          <div class="page-container">
            <img src="${dataUrl}" class="tile-img" style="left: ${leftOffset}cm; top: ${topOffset}cm;">
            <div class="info-label">Hoja ${r + 1}-${c + 1} (${r * cols + c + 1}/${rows * cols}) | Fila ${r + 1}, Col ${c + 1}</div>
          </div>
        `);
            }
        }

        printWin.document.write(`
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body></html>
    `);
        printWin.document.close();
    };

    return (
        <div className={`min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans ${isFullscreen ? 'overflow-hidden' : ''}`}>
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
                            <Layers className="text-white" /> Canvas Blueprint Studio
                        </h1>
                        <p className="text-zinc-400 mt-1 uppercase text-[10px] tracking-widest font-bold">Herramienta de Transferencia para Artistas</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-all shadow-lg"
                        >
                            <Upload size={18} /> Cargar Referencia
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        {image && (
                            <button
                                onClick={printTiledTemplate}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-500 transition-all shadow-lg"
                            >
                                <Printer size={18} /> Imprimir Plantilla
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        {/* Sección de Dimensiones Reales */}
                        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-xl">
                            <div className="flex items-center justify-between mb-4 text-blue-400">
                                <div className="flex items-center gap-2">
                                    <Ruler size={18} />
                                    <h2 className="font-bold text-sm uppercase tracking-wider">Lienzo Final</h2>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, lockAspectRatio: !s.lockAspectRatio }))}
                                    className={`p-1.5 rounded-md transition-colors ${settings.lockAspectRatio ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}
                                    title={settings.lockAspectRatio ? "Proporción bloqueada" : "Proporción libre"}
                                >
                                    {settings.lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-black">
                                        <span>ANCHO (CM)</span>
                                        <span className="text-white bg-zinc-800 px-2 rounded">{settings.physicalWidthCm} cm</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="300" step="1"
                                        value={settings.physicalWidthCm}
                                        onChange={(e) => updateWidth(parseInt(e.target.value))}
                                        className="w-full accent-blue-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-black">
                                        <span>ALTO (CM)</span>
                                        <span className="text-white bg-zinc-800 px-2 rounded">{settings.physicalHeightCm} cm</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="300" step="1"
                                        value={settings.physicalHeightCm}
                                        onChange={(e) => updateHeight(parseInt(e.target.value))}
                                        className="w-full accent-blue-500"
                                    />
                                </div>

                                <div className="pt-2">
                                    <p className="text-[10px] text-zinc-500 font-bold mb-2">PAPEL DE IMPRESIÓN</p>
                                    <div className="flex gap-2">
                                        {['letter', 'a4'].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setSettings({ ...settings, paperType: p as 'letter' | 'a4' })}
                                                className={`flex-1 py-1 px-3 rounded-md text-xs font-bold border transition-all ${settings.paperType === p ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-zinc-800 border-transparent text-zinc-500'}`}
                                            >
                                                {p.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ajustes Visuales */}
                        <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings2 size={18} className="text-zinc-400" />
                                <h2 className="font-bold text-sm uppercase tracking-wider">Estilo de Guía</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setSettings({ ...settings, mode: 'lines' })}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.mode === 'lines' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                                >
                                    <AlignJustify size={14} /> LÍNEAS
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, mode: 'dots' })}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${settings.mode === 'dots' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                                >
                                    <Circle size={14} /> PUNTOS
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-500 font-black mb-2 block">DENSIDAD DE TRAZO</label>
                                    <input
                                        type="range" min="4" max="50" step="1"
                                        value={settings.lineSpacing}
                                        onChange={(e) => setSettings({ ...settings, lineSpacing: parseInt(e.target.value) })}
                                        className="w-full accent-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-500 font-black mb-2 block">CARGA DE PINTURA (GROSOR)</label>
                                    <input
                                        type="range" min="1" max="40" step="0.5"
                                        value={settings.maxThickness}
                                        onChange={(e) => setSettings({ ...settings, maxThickness: parseFloat(e.target.value) })}
                                        className="w-full accent-white"
                                    />
                                </div>

                                <div className="space-y-3 pt-6 border-t border-zinc-800">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-zinc-400">FONDO BLANCO (IMPRIMIR)</span>
                                        <input type="checkbox" checked={settings.isTemplateMode} onChange={(e) => setSettings({ ...settings, isTemplateMode: e.target.checked })} className="accent-blue-500" />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs font-bold text-zinc-400">CUADRÍCULA</span>
                                        <input type="checkbox" checked={settings.showGrid} onChange={(e) => setSettings({ ...settings, showGrid: e.target.checked })} className="accent-blue-500" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`lg:col-span-3 flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-zinc-800 relative min-h-[600px] shadow-inner ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-black' : (settings.isTemplateMode ? 'bg-zinc-100' : 'bg-black')}`}>
                        {!image ? (
                            <div className="text-center p-12 max-w-sm">
                                <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-zinc-800 border-dashed">
                                    <ImageIcon size={48} className="text-zinc-700" />
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-400">Inicia tu Proyecto</h3>
                                <p className="text-zinc-600 mt-2">Sube una fotografía para generar tu esquema a medida.</p>
                            </div>
                        ) : (
                            <div className={`relative group w-full h-full flex flex-col items-center justify-center ${isFullscreen ? 'p-0' : 'p-6'}`}>
                                {isProcessing && (
                                    <div className="absolute inset-0 z-30 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                                        <RefreshCw className="animate-spin text-zinc-400" size={40} />
                                    </div>
                                )}

                                <div className="absolute top-8 right-8 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-black/80 hover:bg-black rounded-full text-white shadow-2xl">
                                        {isFullscreen ? <X size={24} /> : <Maximize2 size={24} />}
                                    </button>
                                    <button onClick={downloadImage} className="p-3 bg-black/80 hover:bg-black rounded-full text-white shadow-2xl">
                                        <Download size={24} />
                                    </button>
                                </div>

                                <div className="relative shadow-2xl shadow-black/50 bg-white leading-[0]">
                                    <canvas
                                        ref={canvasRef}
                                        className={`${isFullscreen ? 'h-screen w-auto' : 'max-w-full h-auto border border-zinc-300'}`}
                                    />
                                    {!isFullscreen && (
                                        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">
                                            <span>0 cm</span>
                                            <span className="text-center flex-1">{settings.physicalWidthCm} x {settings.physicalHeightCm} cm</span>
                                            <span>{settings.physicalWidthCm} cm</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <canvas ref={hiddenCanvasRef} className="hidden" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;