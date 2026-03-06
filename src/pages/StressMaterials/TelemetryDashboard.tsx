interface TelemetryProps {
    stress: number;
    speed: number;
}

export function TelemetryDashboard({ stress, speed }: TelemetryProps) {
    // Simulamos valores de ingeniería basados en tus sliders
    const mpa = (stress * 250).toFixed(2); // Resistencia en MegaPascales
    const deflection = (stress * 1.5).toFixed(3); // Deflexión en mm
    const flowRate = (speed * 1000).toFixed(0); // Flujo de datos

    // Color dinámico para la barra de estado
    const statusColor = stress > 1.2 ? 'bg-red-500' : stress > 0.8 ? 'bg-yellow-500' : 'bg-cyan-500';

    return (
        <div className="absolute top-10 right-10 w-72 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-6 rounded-lg font-mono text-white shadow-2xl pointer-events-none">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <span className="text-[10px] text-slate-400">UNIT_ID: BEAM_X204</span>
                <div className={`w-2 h-2 rounded-full animate-pulse ${statusColor}`}></div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">MAX_STRESS_LOAD</label>
                    <div className="text-xl font-bold text-cyan-400">{mpa} <span className="text-xs text-white">MPa</span></div>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">STRUCTURAL_DEFLECTION</label>
                    <div className="text-xl font-bold">{deflection} <span className="text-xs">mm</span></div>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">STRESS_LEVEL_INDEX</label>
                    <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${statusColor}`}
                            style={{ width: `${Math.min((stress / 1.5) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between text-[10px]">
                    <span className="text-slate-500">FLOW_RATE:</span>
                    <span className="text-cyan-500">{flowRate} pts/sec</span>
                </div>
            </div>
        </div>
    );
}