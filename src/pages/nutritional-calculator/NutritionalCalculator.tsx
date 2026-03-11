import React, { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Bone, Cat, Dog, Leaf, Sparkles, Flame, Utensils, FlaskConical, Search, Loader2, Target, Heart, Activity } from 'lucide-react';

type CategoryType = 'carnes' | 'huesos_carnosos' | 'visceras' | 'vegetales' | 'frutas' | 'productos_del_mar' | 'funcionales' | 'suplementos';

interface Ingredient {
    id: string;
    name: string;
    ca: number;
    p: number;
    category: string;
    isOther?: boolean;
    isLiver?: boolean;
    isCustom?: boolean;
}

interface RecipeItem extends Ingredient {
    amount: number;
    prepType: string;
    uId: number;
}

// Base de datos de ingredientes estáticos (mg por 100g en estado crudo)
const INGREDIENTS_DB: Record<CategoryType, Ingredient[]> = {
    carnes: [
        { id: 'c1', name: 'Carne de Res (Magra)', ca: 5, p: 170, category: 'protein' },
        { id: 'c2', name: 'Carne de Pollo (Pechuga)', ca: 11, p: 196, category: 'protein' },
        { id: 'c3', name: 'Carne de Pavo', ca: 13, p: 180, category: 'protein' },
        { id: 'c4', name: 'Carne de Cerdo', ca: 5, p: 200, category: 'protein' },
        { id: 'c5', name: 'Carne de Cordero', ca: 10, p: 160, category: 'protein' },
        { id: 'c6', name: 'Muslo de Pollo (Sin piel)', ca: 12, p: 175, category: 'protein' },
        { id: 'c7', name: 'Corazón de Res', ca: 7, p: 212, category: 'protein' },
        { id: 'c_other', name: 'Otro...', ca: 0, p: 0, category: 'protein', isOther: true },
    ],
    huesos_carnosos: [
        { id: 'h1', name: 'Ala de Pollo (con hueso)', ca: 1000, p: 600, category: 'bone' },
        { id: 'h2', name: 'Cuello de Pollo (con hueso)', ca: 1500, p: 900, category: 'bone' },
        { id: 'h3', name: 'Carcasa de Pollo', ca: 2000, p: 1100, category: 'bone' },
        { id: 'h4', name: 'Cuello de Pavo', ca: 1700, p: 950, category: 'bone' },
        { id: 'h_other', name: 'Otro...', ca: 0, p: 0, category: 'bone', isOther: true },
    ],
    visceras: [
        { id: 'v1', name: 'Hígado de Res', ca: 5, p: 350, category: 'organ', isLiver: true },
        { id: 'v2', name: 'Hígado de Pollo', ca: 8, p: 280, category: 'organ', isLiver: true },
        { id: 'v3', name: 'Corazón de Res', ca: 7, p: 212, category: 'protein' },
        { id: 'v4', name: 'Riñón de Res', ca: 13, p: 240, category: 'organ', isLiver: false },
        { id: 'v_other', name: 'Otro...', ca: 0, p: 0, category: 'organ', isOther: true },
    ],
    vegetales: [
        { id: 'vg1', name: 'Habichuela', ca: 37, p: 38, category: 'plant' },
        { id: 'vg2', name: 'Calabacín / Zucchini', ca: 16, p: 38, category: 'plant' },
        { id: 'vg3', name: 'Brócoli', ca: 47, p: 66, category: 'plant' },
        { id: 'vg5', name: 'Auyama / Calabaza', ca: 21, p: 44, category: 'plant' },
        { id: 'vg6', name: 'Zanahoria', ca: 33, p: 35, category: 'plant' },
        { id: 'vg_other', name: 'Otro...', ca: 0, p: 0, category: 'plant', isOther: true },
    ],
    frutas: [
        { id: 'f1', name: 'Papaya', ca: 20, p: 10, category: 'plant' },
        { id: 'f2', name: 'Manzana', ca: 6, p: 11, category: 'plant' },
        { id: 'f4', name: 'Arándanos', ca: 6, p: 12, category: 'plant' },
        { id: 'f_other', name: 'Otro...', ca: 0, p: 0, category: 'plant', isOther: true },
    ],
    productos_del_mar: [
        { id: 'm1', name: 'Sardinas en agua', ca: 380, p: 240, category: 'protein' },
        { id: 'm2', name: 'Atún en agua', ca: 10, p: 200, category: 'protein' },
        { id: 'm_other', name: 'Otro...', ca: 0, p: 0, category: 'protein', isOther: true },
    ],
    funcionales: [
        { id: 'fn1', name: 'Caldo de Huesos', ca: 15, p: 12, category: 'liquid' },
        { id: 'fn2', name: 'Gelatina de Pata', ca: 85, p: 45, category: 'liquid' },
        { id: 'fn_other', name: 'Otro...', ca: 0, p: 0, category: 'liquid', isOther: true },
    ],
    suplementos: [
        { id: 's1', name: 'Cáscara de Huevo (Polvo)', ca: 38000, p: 0, category: 'supp' },
        { id: 's2', name: 'Carbonato de Calcio', ca: 40000, p: 0, category: 'supp' },
        { id: 's3', name: 'Citrato de Calcio', ca: 21000, p: 0, category: 'supp' },
        { id: 's_other', name: 'Otro...', ca: 0, p: 0, category: 'supp', isOther: true },
    ]
};

const App = () => {
    const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'clinical'
    const [items, setItems] = useState<RecipeItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('carnes');
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [prepType, setPrepType] = useState('raw');
    const [amount, setAmount] = useState('');
    const [petType, setPetType] = useState('dog');

    // Estados Clínicos
    const [clinicalCondition, setClinicalCondition] = useState('none'); // 'renal', 'heart_biliary', 'gastritis'
    const [petAge, setPetAge] = useState('');
    const [petWeight, setPetWeight] = useState('');

    // Estados para ingredientes "Otros"
    const [customName, setCustomName] = useState('');
    const [customCa, setCustomCa] = useState(0);
    const [customP, setCustomP] = useState(0);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const allIngredients = Object.values(INGREDIENTS_DB).flat();
    const currentIngredient: Ingredient | undefined = allIngredients.find(i => i.id === selectedIngredientId);

    const apiKey = "";

    const fetchNutritionalData = async (name: string) => {
        if (!name || name.length < 3) return;
        setIsAiLoading(true);
        const systemPrompt = `Eres un experto en nutrición animal. Devuelve JSON: { "ca": mg, "p": mg } por 100g crudo.`;
        const userQuery = `Ingrediente: "${name}".`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const data = JSON.parse(text);
                setCustomCa(data.ca || 0);
                setCustomP(data.p || 0);
            }
        } catch (e) { console.error(e); } finally { setIsAiLoading(false); }
    };

    const addItem = () => {
        let finalIngredient: Ingredient | undefined;
        if (currentIngredient?.isOther) {
            const lowerName = customName.toLowerCase();
            const isLiver = lowerName.includes('higado') || lowerName.includes('hígado');
            finalIngredient = {
                id: `custom-${Date.now()}`,
                name: customName || 'Nuevo',
                ca: customCa,
                p: customP,
                category: currentIngredient.category,
                isCustom: true, isLiver: currentIngredient.category === 'organ' ? isLiver : false
            };
        } else if (currentIngredient) {
            finalIngredient = { ...currentIngredient };
        }

        if (!finalIngredient || !amount || parseFloat(amount) <= 0) return;
        const multiplier = (prepType === 'cooked' && finalIngredient.category !== 'supp') ? 1.2 : 1.0;

        setItems([...items, {
            ...finalIngredient,
            amount: parseFloat(amount),
            prepType: finalIngredient.category === 'supp' ? 'raw' : prepType,
            ca: finalIngredient.ca * multiplier,
            p: finalIngredient.p * multiplier,
            uId: Date.now()
        }]);
        setAmount(''); setCustomName(''); setCustomCa(0); setCustomP(0); setSelectedIngredientId('');
    };

    const removeItem = (uId: number) => setItems(items.filter(item => item.uId !== uId));

    const analysis = useMemo(() => {
        let tCa = 0, tP = 0, tW = 0, protW = 0, plantW = 0, liverW = 0, otherOrganW = 0, boneW = 0;
        let hasCookedBone = false;

        items.forEach(item => {
            tCa += (item.ca * item.amount) / 100; tP += (item.p * item.amount) / 100; tW += item.amount;
            if (item.category === 'protein' || item.category === 'bone') protW += item.amount;
            if (item.category === 'plant') plantW += item.amount;
            if (item.category === 'organ') {
                if (item.isLiver) liverW += item.amount;
                else otherOrganW += item.amount;
            }
            if (item.category === 'bone') {
                boneW += item.amount;
                if (item.prepType === 'cooked') hasCookedBone = true;
            }
        });

        const ratios = petType === 'dog'
            ? { prot: 0.70, liver: 0.05, otherOrgan: 0.10, plant: 0.15 }
            : { prot: 0.85, liver: 0.05, otherOrgan: 0.05, plant: 0.05 };

        const totalIdealWeight = protW > 0 ? (protW / ratios.prot) : 0;
        const targetLiverGrams = totalIdealWeight * ratios.liver;
        const targetOtherOrganGrams = totalIdealWeight * ratios.otherOrgan;
        const targetPlantGrams = totalIdealWeight * ratios.plant;

        const ratio = tP > 0 ? (tCa / tP) : 0;
        const suggestions = [];

        if (protW > 0) {
            // Balance Calcio
            const targetCa = tP * 1.2;
            if (tCa < targetCa - 2) {
                suggestions.push({ type: 'danger', text: `Déficit de Calcio: Agrega ${((targetCa - tCa) / 380).toFixed(1)}g de Polvo de Cáscara.`, icon: <Bone size={14} /> });
            }

            // Lógica Clínica para Hígado y Otras Vísceras
            const isClinicalCase = activeTab === 'clinical' && clinicalCondition === 'heart_biliary';

            if (isClinicalCase) {
                if (otherOrganW > 0) {
                    suggestions.push({ type: 'danger', text: `⚠️ Restricción Clínica: Este paciente no debe consumir otras vísceras (Riñón, Bazo, etc). Por favor eliminarlas.`, icon: <AlertTriangle size={14} /> });
                }
            }

            if (liverW > targetLiverGrams + 1) {
                suggestions.push({ type: 'danger', text: `Exceso de Hígado: Límite 5% (${Math.round(targetLiverGrams)}g).`, icon: <AlertTriangle size={14} /> });
            } else if (targetLiverGrams - liverW > 1) {
                suggestions.push({ type: 'warning', text: `Falta Hígado: Agrega ${Math.ceil(targetLiverGrams - liverW)}g.`, icon: <Utensils size={14} /> });
            }

            if (!isClinicalCase && (targetOtherOrganGrams - otherOrganW > 1)) {
                suggestions.push({ type: 'warning', text: `Faltan Otras Vísceras: Agrega ${Math.ceil(targetOtherOrganGrams - otherOrganW)}g.`, icon: <FlaskConical size={14} /> });
            }

            if (targetPlantGrams - plantW > 1) {
                suggestions.push({ type: 'info', text: `Faltan Vegetales: Agrega ${Math.ceil(targetPlantGrams - plantW)}g.`, icon: <Leaf size={14} /> });
            }
        }

        const taurine = petType === 'cat' || clinicalCondition === 'heart_biliary' ? (protW / 100) * 60 : (protW / 100) * 20;
        const omega = (totalIdealWeight / 300) * 1.5;

        interface Suggestion {
            type: 'danger' | 'warning' | 'info';
            text: string;
            icon: React.ReactNode;
        }

        return { tCa, tP, ratio, tW, protW, plantW, liverW, otherOrganW, hasCookedBone, taurine, omega, suggestions: suggestions as Suggestion[], totalIdealWeight, targetLiverGrams, targetOtherOrganGrams, targetPlantGrams };
    }, [items, petType, activeTab, clinicalCondition]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header con Tabs */}
                <header className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-600 p-3 rounded-2xl shadow-lg">
                                <Bone className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Nutri-Calc <span className="text-orange-600 text-3xl">X</span></h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Calculadora de Nutrición de Precisión</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                            <button onClick={() => setPetType('dog')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold ${petType === 'dog' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><Dog size={18} /> Perro</button>
                            <button onClick={() => setPetType('cat')} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold ${petType === 'cat' ? 'bg-white shadow text-purple-600' : 'text-slate-400'}`}><Cat size={18} /> Gato</button>
                        </div>
                    </div>

                    <nav className="flex gap-2 border-t pt-4">
                        <button
                            onClick={() => setActiveTab('standard')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'standard' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Utensils size={18} /> DIETA ESTÁNDAR
                        </button>
                        <button
                            onClick={() => setActiveTab('clinical')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'clinical' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}
                        >
                            <Heart size={18} /> MODO CLÍNICO
                        </button>
                    </nav>
                </header>

                {activeTab === 'clinical' && (
                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 grid md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
                        <div>
                            <label className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-2">Condición Clínica</label>
                            <select
                                className="w-full p-3 bg-white border-2 border-red-200 rounded-2xl outline-none focus:border-red-500 font-bold text-sm"
                                value={clinicalCondition}
                                onChange={(e) => setClinicalCondition(e.target.value)}
                            >
                                <option value="none">-- Seleccionar Patología --</option>
                                <option value="heart_biliary">Cardiopatía / Barro Biliar</option>
                                <option value="renal">Enfermedad Renal Crónica</option>
                                <option value="gastritis">Gastritis / Digestión Sensible</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-2">Edad del Paciente</label>
                            <div className="relative">
                                <input type="number" className="w-full p-3 bg-white border-2 border-red-200 rounded-2xl outline-none focus:border-red-500 font-bold text-sm" placeholder="Ej: 15" value={petAge} onChange={(e) => setPetAge(e.target.value)} />
                                <span className="absolute right-4 top-3 text-red-300 font-bold text-xs uppercase">Años</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-2">Peso Actual</label>
                            <div className="relative">
                                <input type="number" className="w-full p-3 bg-white border-2 border-red-200 rounded-2xl outline-none focus:border-red-500 font-bold text-sm" placeholder="Ej: 12.5" value={petWeight} onChange={(e) => setPetWeight(e.target.value)} />
                                <span className="absolute right-4 top-3 text-red-300 font-bold text-xs uppercase">Kg</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Añadir Ingredientes</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Categoría</label>
                                        <select className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-400 outline-none font-bold text-sm" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value as CategoryType); setSelectedIngredientId(''); }}>
                                            <option value="carnes">Músculo / Carne</option>
                                            <option value="huesos_carnosos">Hueso Carnoso</option>
                                            <option value="visceras">Vísceras / Órganos</option>
                                            <option value="vegetales">Vegetales</option>
                                            <option value="frutas">Frutas</option>
                                            <option value="productos_del_mar">Mar / Enlatados</option>
                                            <option value="suplementos">🧪 Suplementos</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Ingrediente</label>
                                        <select className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-400 outline-none text-sm" value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)}>
                                            <option value="">Selecciona...</option>
                                            {INGREDIENTS_DB[selectedCategory as CategoryType].map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {currentIngredient?.isOther && (
                                    <div className="p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl space-y-3">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Ej: Pato, Búfalo..." className="flex-1 p-3 bg-white border-2 border-orange-200 rounded-xl text-sm font-bold outline-none" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                                            <button onClick={() => fetchNutritionalData(customName)} disabled={isAiLoading || customName.length < 3} className="px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
                                                {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Preparación</label>
                                        <div className="flex bg-slate-100 p-1 rounded-2xl h-[46px]">
                                            <button onClick={() => setPrepType('raw')} className={`flex-1 flex items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-all ${prepType === 'raw' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>Crudo</button>
                                            <button onClick={() => setPrepType('cooked')} className={`flex-1 flex items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-all ${prepType === 'cooked' ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}>Cocido</button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Peso (Gramos)</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-400 outline-none font-bold text-sm h-[46px]" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    </div>
                                </div>

                                <button onClick={addItem} disabled={(!selectedIngredientId && !customName) || !amount} className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-2 transition-all shadow-xl">
                                    <Plus size={20} /> AÑADIR AL PLATO
                                </button>
                            </div>
                        </div>

                        {/* Metas Dinámicas */}
                        {analysis.protW > 0 && (
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
                                <h3 className="font-black text-white text-xs flex items-center gap-2 uppercase tracking-widest text-orange-400">
                                    <Target size={16} /> Metas para esta Proteína
                                </h3>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className={`p-3 rounded-2xl border text-center ${analysis.liverW > analysis.targetLiverGrams + 1 ? 'bg-red-500/20 border-red-500/40' : 'bg-white/5 border-white/10'}`}>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Hígado (5%)</p>
                                        <p className="text-xs font-black text-white">{Math.round(analysis.targetLiverGrams)}g</p>
                                    </div>
                                    <div className={`p-3 rounded-2xl border text-center bg-white/5 border-white/10 ${clinicalCondition === 'heart_biliary' ? 'opacity-30' : ''}`}>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Otras Vísc.</p>
                                        <p className="text-xs font-black text-white">{clinicalCondition === 'heart_biliary' ? '0' : Math.round(analysis.targetOtherOrganGrams)}g</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Vegetales</p>
                                        <p className="text-xs font-black text-white">{Math.round(analysis.targetPlantGrams)}g</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {analysis.suggestions.map((s, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex gap-3 items-start ${s.type === 'danger' ? 'bg-red-500/20 border-red-500/30' : s.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                            <div className={`mt-0.5 ${s.type === 'danger' ? 'text-red-400' : s.type === 'warning' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                {s.icon}
                                            </div>
                                            <p className="text-white text-[10px] font-bold leading-relaxed">{s.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ratio Ca:P</p>
                                <p className={`text-xl font-black ${analysis.ratio < 1.0 || analysis.ratio > 1.6 ? 'text-red-500' : 'text-emerald-600'}`}>{analysis.ratio.toFixed(2)}:1</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Peso Total</p>
                                <p className="text-xl font-black text-slate-800">{analysis.tW.toFixed(0)}g</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taurina</p>
                                <p className="text-xl font-black text-blue-600">{analysis.taurine.toFixed(0)}mg</p>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-2xl text-center shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tipo Dieta</p>
                                <p className="text-[10px] font-black text-white uppercase mt-1">{activeTab === 'standard' ? 'Estándar' : 'Clínica'}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500">Receta del Paciente</h3>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                                {items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                                        <Activity size={48} className="mb-2" />
                                        <p className="font-black mt-2 uppercase text-xs tracking-tighter">Inicia la formulación</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div key={item.uId} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${item.isLiver ? 'bg-orange-50 border-orange-100 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isLiver ? 'bg-orange-200 text-orange-700 font-black text-[10px]' : item.category === 'supp' ? 'bg-indigo-100 text-indigo-600' : item.prepType === 'cooked' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {item.isLiver ? 'L' : item.category === 'supp' ? <FlaskConical size={18} /> : item.prepType === 'cooked' ? <Flame size={18} /> : <Sparkles size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm leading-tight flex items-center gap-2">
                                                            {item.name}
                                                            {item.isLiver && <span className="text-[7px] bg-orange-600 text-white px-1 rounded-sm uppercase font-bold">Clínico</span>}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                            {item.amount}g • <span className="text-blue-500">Ca: {((item.ca * item.amount) / 100).toFixed(0)}mg</span> • <span className="text-purple-500">P: {((item.p * item.amount) / 100).toFixed(0)}mg</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeItem(item.uId)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default App;