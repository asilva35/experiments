import { useState, useEffect, useRef } from "react";

const COLORS = {
    orange: "#E8620A",
    dark: "#111111",
    mid: "#222222",
    muted: "#555555",
    light: "#F2F2F2",
    border: "#2A2A2A",
    white: "#FFFFFF",
    orangeLight: "rgba(232,98,10,0.12)",
    success: "#2ECC71",
};

const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #111; }

  .calc-root {
    font-family: 'Syne', sans-serif;
    background: #111111;
    color: #F2F2F2;
    min-height: 100vh;
    padding: 0;
  }

  .calc-header {
    border-bottom: 1px solid #2A2A2A;
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: #111111;
    z-index: 100;
  }

  .calc-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.5px;
    color: #F2F2F2;
  }

  .calc-logo span { color: #E8620A; }

  .calc-step-indicator {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #555;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .calc-body {
    max-width: 720px;
    margin: 0 auto;
    padding: 60px 32px 120px;
  }

  .step-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #E8620A;
    margin-bottom: 16px;
  }

  .step-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 36px;
    line-height: 1.1;
    color: #F2F2F2;
    margin-bottom: 12px;
    letter-spacing: -1px;
  }

  .step-sub {
    font-size: 15px;
    color: #777;
    margin-bottom: 48px;
    line-height: 1.5;
    font-weight: 400;
  }

  .mode-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 48px;
  }

  .mode-card {
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    padding: 24px 20px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #161616;
    position: relative;
    overflow: hidden;
  }

  .mode-card:hover {
    border-color: #E8620A;
    background: #1A1A1A;
  }

  .mode-card.selected {
    border-color: #E8620A;
    background: rgba(232,98,10,0.08);
  }

  .mode-card.selected::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: #E8620A;
  }

  .mode-icon {
    font-size: 28px;
    margin-bottom: 12px;
  }

  .mode-title {
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 6px;
    color: #F2F2F2;
  }

  .mode-desc {
    font-size: 12px;
    color: #666;
    line-height: 1.5;
    font-weight: 400;
  }

  .input-group {
    margin-bottom: 32px;
  }

  .input-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 10px;
    display: block;
  }

  .input-field {
    width: 100%;
    background: #161616;
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    color: #F2F2F2;
    font-family: 'DM Mono', monospace;
    font-size: 16px;
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.15s;
    appearance: none;
  }

  .input-field:focus {
    border-color: #E8620A;
  }

  .input-field::placeholder {
    color: #444;
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .toggle-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .toggle-btn {
    padding: 12px 16px;
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    background: #161616;
    color: #888;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }

  .toggle-btn:hover { border-color: #555; color: #F2F2F2; }

  .toggle-btn.active {
    border-color: #E8620A;
    background: rgba(232,98,10,0.1);
    color: #E8620A;
  }

  .roof-map-box {
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    background: #161616;
    padding: 32px;
    text-align: center;
    margin-bottom: 16px;
    cursor: pointer;
    transition: border-color 0.15s;
    position: relative;
    overflow: hidden;
  }

  .roof-map-box:hover { border-color: #E8620A; }

  .roof-map-icon {
    font-size: 40px;
    margin-bottom: 12px;
    display: block;
  }

  .roof-map-text {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .roof-map-text strong { color: #F2F2F2; display: block; margin-bottom: 4px; font-size: 15px; }

  .map-placeholder {
    width: 100%;
    height: 240px;
    background: linear-gradient(135deg, #1a2a1a 0%, #1a1a2a 50%, #2a1a1a 100%);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
    border: 1px solid #2A2A2A;
    position: relative;
    overflow: hidden;
  }

  .map-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(232,98,10,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232,98,10,0.05) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  .map-house {
    font-size: 48px;
    z-index: 1;
  }

  .map-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #E8620A;
    letter-spacing: 2px;
    z-index: 1;
  }

  .api-note {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #444;
    text-align: center;
    margin-top: 8px;
    letter-spacing: 0.5px;
  }

  .slider-container {
    padding: 8px 0;
  }

  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 3px;
    background: #2A2A2A;
    outline: none;
    border-radius: 2px;
    margin-bottom: 8px;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #E8620A;
    cursor: pointer;
    border: 2px solid #111;
    box-shadow: 0 0 0 2px rgba(232,98,10,0.3);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #444;
  }

  .slider-value {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    color: #E8620A;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .btn-primary {
    background: #E8620A;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 16px 32px;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.3px;
    width: 100%;
  }

  .btn-primary:hover { background: #ff7320; transform: translateY(-1px); }
  .btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; }

  .btn-secondary {
    background: transparent;
    color: #888;
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    padding: 14px 24px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 12px;
  }

  .btn-secondary:hover { border-color: #555; color: #F2F2F2; }

  .btn-row {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .btn-row .btn-secondary { flex: 0 0 auto; margin-bottom: 0; }
  .btn-row .btn-primary { flex: 1; }

  /* RESULTS */

  .results-hero {
    background: linear-gradient(135deg, #1A1A1A 0%, #161616 100%);
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    padding: 32px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }

  .results-hero::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #E8620A, #ff9a4a);
  }

  .results-headline {
    font-size: 13px;
    font-family: 'DM Mono', monospace;
    color: #E8620A;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .results-config {
    font-size: 28px;
    font-weight: 800;
    color: #F2F2F2;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .results-sub {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .metric-card {
    background: #111;
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    padding: 20px 16px;
    text-align: center;
  }

  .metric-value {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    font-weight: 500;
    color: #E8620A;
    margin-bottom: 4px;
  }

  .metric-label {
    font-size: 11px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .price-band {
    background: rgba(232,98,10,0.08);
    border: 1px solid rgba(232,98,10,0.2);
    border-radius: 4px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .price-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #E8620A;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .price-range {
    font-size: 24px;
    font-weight: 800;
    color: #F2F2F2;
    letter-spacing: -0.5px;
  }

  .breakdown-table {
    border: 1px solid #2A2A2A;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid #1E1E1E;
    font-size: 14px;
  }

  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-row:nth-child(even) { background: #161616; }

  .breakdown-key { color: #888; }
  .breakdown-val {
    font-family: 'DM Mono', monospace;
    color: #F2F2F2;
    font-size: 13px;
  }

  .disclaimer {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #444;
    line-height: 1.7;
    padding: 16px;
    border: 1px solid #1E1E1E;
    border-radius: 4px;
    margin-bottom: 32px;
  }

  /* LEAD FORM */

  .lead-section {
    border-top: 1px solid #2A2A2A;
    padding-top: 40px;
    margin-top: 8px;
  }

  .lead-title {
    font-size: 22px;
    font-weight: 800;
    color: #F2F2F2;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }

  .lead-sub {
    font-size: 14px;
    color: #666;
    margin-bottom: 32px;
    line-height: 1.5;
  }

  .success-box {
    background: rgba(46,204,113,0.08);
    border: 1px solid rgba(46,204,113,0.2);
    border-radius: 4px;
    padding: 32px;
    text-align: center;
  }

  .success-icon { font-size: 40px; margin-bottom: 12px; display: block; }

  .success-title {
    font-size: 20px;
    font-weight: 800;
    color: #2ECC71;
    margin-bottom: 8px;
  }

  .success-text {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }

  .pdf-btn {
    background: transparent;
    color: #E8620A;
    border: 1px solid #E8620A;
    border-radius: 4px;
    padding: 14px 24px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: center;
    margin-bottom: 12px;
  }

  .pdf-btn:hover { background: rgba(232,98,10,0.1); }

  .progress-bar {
    height: 2px;
    background: #1A1A1A;
    margin-bottom: 48px;
    border-radius: 1px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #E8620A;
    transition: width 0.4s ease;
    border-radius: 1px;
  }

  .tag {
    display: inline-block;
    background: #1A1A1A;
    border: 1px solid #2A2A2A;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #666;
    padding: 3px 8px;
    letter-spacing: 0.5px;
    margin-right: 6px;
    margin-bottom: 16px;
  }

  .tag.orange {
    background: rgba(232,98,10,0.1);
    border-color: rgba(232,98,10,0.2);
    color: #E8620A;
  }

  select.input-field option {
    background: #161616;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-in {
    animation: fadeUp 0.3s ease forwards;
  }
`;

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────

function calcSolar(roofM2, billEur) {
    const usableArea = roofM2 * 0.75;
    const panels = Math.floor(usableArea / 1.7);
    const kWp = panels * 0.4;
    const annualKwh = kWp * 850;
    const annualSavings = annualKwh * 0.32 * 0.85; // post-saldering factor
    const costMin = kWp * 1400;
    const costMax = kWp * 1600;
    const payback = ((costMin + costMax) / 2) / annualSavings;
    const co2 = annualKwh * 0.4;
    return { panels, kWp: +kWp.toFixed(1), annualKwh: Math.round(annualKwh), annualSavings: Math.round(annualSavings), costMin: Math.round(costMin), costMax: Math.round(costMax), payback: +payback.toFixed(1), co2: Math.round(co2) };
}

function calcBattery(annualKwh, existingSolarKwh = 0) {
    const dailyUsage = annualKwh / 365;
    const storageNeed = dailyUsage * 0.8;
    const sizes = [5, 10, 15, 20];
    const recommended = sizes.find(s => s >= storageNeed) || 20;
    const costMin = recommended * 800;
    const costMax = recommended * 1200;
    return { recommended, costMin: Math.round(costMin), costMax: Math.round(costMax) };
}

function annualKwhFromBill(billEur) {
    return Math.round((billEur / 0.32) * 12);
}

function fmt(n) { return new Intl.NumberFormat('en-GB').format(n); }
function eur(n) { return `€ ${fmt(n)}`; }

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const MODES = [
    { id: "A", icon: "☀️", title: "No solar panels, no battery", desc: "I want to install solar panels, possibly with a battery" },
    { id: "C", icon: "🔋", title: "I already have solar panels", desc: "I want to add a home battery to my existing installation" },
    { id: "D", icon: "⚡", title: "Battery only", desc: "I want a home battery without solar panels" },
];

function ModeSelect({ onSelect }) {
    const [selected, setSelected] = useState(null);
    return (
        <div className="animate-in">
            <div className="step-label">Step 1 of 4</div>
            <h1 className="step-title">What is your<br />current situation?</h1>
            <p className="step-sub">We calculate the best system based on your situation.</p>
            <div className="mode-grid">
                {MODES.map(m => (
                    <div
                        key={m.id}
                        className={`mode-card${selected === m.id ? " selected" : ""}`}
                        onClick={() => setSelected(m.id)}
                    >
                        <div className="mode-icon">{m.icon}</div>
                        <div className="mode-title">{m.title}</div>
                        <div className="mode-desc">{m.desc}</div>
                    </div>
                ))}
                <div
                    className={`mode-card${selected === "B" ? " selected" : ""}`}
                    onClick={() => setSelected("B")}
                >
                    <div className="mode-icon">🏠</div>
                    <div className="mode-title">Solar panels + battery combination</div>
                    <div className="mode-desc">I want a complete system with storage right away</div>
                </div>
            </div>
            <button className="btn-primary" disabled={!selected} onClick={() => onSelect(selected)}>
                Continue →
            </button>
        </div>
    );
}

function RoofInput({ onNext, onBack }) {
    const [method, setMethod] = useState("manual");
    const [roofM2, setRoofM2] = useState(40);
    const [mapClicked, setMapClicked] = useState(false);

    return (
        <div className="animate-in">
            <div className="step-label">Step 2 of 4</div>
            <h1 className="step-title">Your roof area</h1>
            <p className="step-sub">We calculate how many panels fit on your roof.</p>

            <div className="input-group">
                <label className="input-label">Input method</label>
                <div className="toggle-row">
                    <button className={`toggle-btn${method === "manual" ? " active" : ""}`} onClick={() => setMethod("manual")}>
                        Manual input
                    </button>
                    <button className={`toggle-btn${method === "map" ? " active" : ""}`} onClick={() => setMethod("map")}>
                        📡 Via Google Maps
                    </button>
                </div>
            </div>

            {method === "map" ? (
                <div className="input-group">
                    <label className="input-label">Search for your address on the map</label>
                    <div className="map-placeholder">
                        <div className="map-grid" />
                        <span className="map-house">🛰️</span>
                        <span className="map-label">
                            {mapClicked ? "ROOF DRAWING ACTIVE — DEMO" : "GOOGLE MAPS API REQUIRED"}
                        </span>
                    </div>
                    <div className="api-note">
                        ↳ In production: Google Maps Javascript API + Geocoding API required.
                        User draws polygon on satellite photo — area is calculated automatically.
                    </div>
                    {!mapClicked ? (
                        <button className="btn-secondary" style={{ marginTop: 12, width: "100%" }} onClick={() => { setMapClicked(true); setRoofM2(52); }}>
                            Simulate roof detection (demo)
                        </button>
                    ) : (
                        <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 4 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2ECC71" }}>
                                ✓ Roof area detected: 52 m² (simulated)
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="input-group">
                    <label className="input-label">Estimated roof area (m²)</label>
                    <div className="slider-value">{roofM2} m²</div>
                    <div className="slider-container">
                        <input
                            type="range" min="10" max="120" step="5"
                            value={roofM2}
                            className="slider"
                            onChange={e => setRoofM2(+e.target.value)}
                        />
                        <div className="slider-labels"><span>10 m²</span><span>Small roof</span><span>Large roof</span><span>120 m²</span></div>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
                        Average Dutch terraced house: 25-40 m² usable roof area
                    </div>
                </div>
            )}

            <div className="input-group">
                <label className="input-label">Roof type</label>
                <select className="input-field">
                    <option>Slanted roof (tiles)</option>
                    <option>Slanted roof (slate)</option>
                    <option>Flat roof</option>
                </select>
            </div>

            <div className="btn-row">
                <button className="btn-secondary" onClick={onBack}>← Back</button>
                <button className="btn-primary" onClick={() => onNext(roofM2)}>Continue →</button>
            </div>
        </div>
    );
}

function EnergyInput({ mode, onNext, onBack }) {
    const [billEur, setBillEur] = useState(150);
    const [existingKwp, setExistingKwp] = useState(4);
    const [wantBattery, setWantBattery] = useState(true);

    return (
        <div className="animate-in">
            <div className="step-label">Step 3 of 4</div>
            <h1 className="step-title">Your energy consumption</h1>
            <p className="step-sub">We calculate your savings and payback period.</p>

            {mode === "C" && (
                <div className="input-group">
                    <label className="input-label">Current solar panel power (kWp)</label>
                    <div className="slider-value">{existingKwp} kWp</div>
                    <div className="slider-container">
                        <input type="range" min="1" max="15" step="0.5" value={existingKwp}
                            className="slider" onChange={e => setExistingKwp(+e.target.value)} />
                        <div className="slider-labels"><span>1 kWp</span><span>15 kWp</span></div>
                    </div>
                </div>
            )}

            <div className="input-group">
                <label className="input-label">Current monthly energy bill (€)</label>
                <div className="slider-value">€ {billEur}/mo</div>
                <div className="slider-container">
                    <input type="range" min="50" max="400" step="10" value={billEur}
                        className="slider" onChange={e => setBillEur(+e.target.value)} />
                    <div className="slider-labels"><span>€ 50</span><span>€ 400</span></div>
                </div>
            </div>

            {(mode === "A") && (
                <div className="input-group">
                    <label className="input-label">Are you also interested in a home battery?</label>
                    <div className="toggle-row">
                        <button className={`toggle-btn${wantBattery ? " active" : ""}`} onClick={() => setWantBattery(true)}>Yes, combination</button>
                        <button className={`toggle-btn${!wantBattery ? " active" : ""}`} onClick={() => setWantBattery(false)}>Solar panels only</button>
                    </div>
                </div>
            )}

            <div className="btn-row">
                <button className="btn-secondary" onClick={onBack}>← Back</button>
                <button className="btn-primary" onClick={() => onNext({ billEur, existingKwp, wantBattery })}>
                    Calculate →
                </button>
            </div>
        </div>
    );
}

function Results({ mode, roofM2, energy, onLeadSubmit, leadSent }) {
    const { billEur, existingKwp, wantBattery } = energy;
    const annualKwh = annualKwhFromBill(billEur);

    const solar = (mode !== "D" && mode !== "C") ? calcSolar(roofM2, billEur) : null;
    const includeBattery = mode === "B" || mode === "D" || mode === "C" || wantBattery;
    const battery = includeBattery ? calcBattery(annualKwh, solar ? solar.annualKwh : existingKwp * 850) : null;

    const totalMin = (solar?.costMin || 0) + (battery?.costMin || 0);
    const totalMax = (solar?.costMax || 0) + (battery?.costMax || 0);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [tel, setTel] = useState("");
    const [postcode, setPostcode] = useState("");

    const configLabel =
        mode === "D" ? `Home battery ${battery?.recommended} kWh` :
            mode === "C" ? `Home battery ${battery?.recommended} kWh (add-on)` :
                solar && battery ? `${solar.kWp} kWp + ${battery.recommended} kWh battery` :
                    solar ? `${solar.kWp} kWp solar panel system` : "";

    return (
        <div className="animate-in">
            <div className="step-label">Your indicative quote</div>
            <h1 className="step-title" style={{ marginBottom: 24 }}>Results</h1>

            <div className="results-hero">
                <div className="results-headline">Recommended configuration</div>
                <div className="results-config">{configLabel}</div>
                <div className="results-sub">
                    {solar && `${solar.panels} panels on ${Math.round(roofM2 * 0.75)} m² usable roof area`}
                    {mode === "C" && `Existing system: ${existingKwp} kWp`}
                </div>

                {solar && (
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-value">{fmt(solar.annualKwh)}</div>
                            <div className="metric-label">kWh/year generation</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">€ {fmt(solar.annualSavings)}</div>
                            <div className="metric-label">Savings/year</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">{solar.payback} yr</div>
                            <div className="metric-label">Payback period</div>
                        </div>
                    </div>
                )}

                {!solar && battery && (
                    <div className="metrics-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="metric-card">
                            <div className="metric-value">{battery.recommended} kWh</div>
                            <div className="metric-label">Battery capacity</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">~ 80%</div>
                            <div className="metric-label">Self-sufficiency</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="price-band">
                <div>
                    <div className="price-label">Indicative installation price</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Includes materials and labor, excl. VAT</div>
                </div>
                <div className="price-range">{eur(totalMin)} – {eur(totalMax)}</div>
            </div>

            <div className="breakdown-table">
                {solar && <>
                    <div className="breakdown-row">
                        <span className="breakdown-key">System power</span>
                        <span className="breakdown-val">{solar.kWp} kWp</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-key">Number of panels</span>
                        <span className="breakdown-val">{solar.panels} × 400 Wp</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-key">Annual generation (NL average)</span>
                        <span className="breakdown-val">{fmt(solar.annualKwh)} kWh</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-key">CO₂ savings/year</span>
                        <span className="breakdown-val">{fmt(solar.co2)} kg</span>
                    </div>
                </>}
                {battery && <>
                    <div className="breakdown-row">
                        <span className="breakdown-key">Battery capacity</span>
                        <span className="breakdown-val">{battery.recommended} kWh</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-key">Battery costs</span>
                        <span className="breakdown-val">{eur(battery.costMin)} – {eur(battery.costMax)}</span>
                    </div>
                </>}
                <div className="breakdown-row">
                    <span className="breakdown-key">Annual consumption (est.)</span>
                    <span className="breakdown-val">{fmt(annualKwh)} kWh</span>
                </div>
            </div>

            <div className="disclaimer">
                ↳ This calculation is indicative based on NL averages (850 kWh/kWp, € 0.32/kWh).
                Actual yield depends on roof orientation, shade, and installer.
                Net metering phase-out after 2027 discounted (–15% on annual savings).
                Final prices by certified installer after roof inspection.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
                <button className="pdf-btn" onClick={() => alert("PDF generation: in production via Puppeteer/server-side rendering. Includes: configuration, savings, Strohm.energy branding, reference number.")}>
                    📄 Download indicative quote (PDF)
                </button>
            </div>

            <div className="lead-section">
                {!leadSent ? (
                    <>
                        <div className="lead-title">Request installer</div>
                        <p className="lead-sub">
                            Leave your details. We will connect you within 24 hours to a certified Strohm.energy installer in your region. No obligations.
                        </p>

                        <div className="input-row" style={{ marginBottom: 16 }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Name</label>
                                <input className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Postcode</label>
                                <input className="input-field" placeholder="1234 AB" value={postcode} onChange={e => setPostcode(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-row" style={{ marginBottom: 24 }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Email</label>
                                <input className="input-field" placeholder="john@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Phone number</label>
                                <input className="input-field" placeholder="06 12345678" value={tel} onChange={e => setTel(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ fontSize: 11, color: "#444", marginBottom: 20, fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
                            By submitting, you agree that Strohm.energy shares your data with a certified installer in your region.
                        </div>

                        <button
                            className="btn-primary"
                            disabled={!name || !email || !postcode}
                            onClick={() => onLeadSubmit({ name, email, tel, postcode })}
                        >
                            Request installer →
                        </button>
                    </>
                ) : (
                    <div className="success-box">
                        <span className="success-icon">✅</span>
                        <div className="success-title">Request received</div>
                        <p className="success-text">
                            We will connect you within 24 hours to a certified installer in your region.<br />
                            You will receive a confirmation at your email address.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function SolarCalculator() {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState(null);
    const [roofM2, setRoofM2] = useState(null);
    const [energy, setEnergy] = useState(null);
    const [leadSent, setLeadSent] = useState(false);

    const totalSteps = 4;
    const progress = ((step + 1) / totalSteps) * 100;

    const STEP_NAMES = ["Situation", "Roof", "Consumption", "Results"];

    return (
        <>
            <style>{style}</style>
            <div className="calc-root">
                <header className="calc-header">
                    <div className="calc-logo">Strohm<span>.</span>energy</div>
                    <div className="calc-step-indicator">
                        {STEP_NAMES.map((s, i) => (
                            <span key={s} style={{
                                color: i === step ? "#E8620A" : i < step ? "#555" : "#333",
                                marginLeft: i > 0 ? 16 : 0
                            }}>
                                {i < step ? "✓ " : ""}{s}
                            </span>
                        ))}
                    </div>
                </header>

                <div className="calc-body">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    {step === 0 && (
                        <ModeSelect onSelect={m => { setMode(m); setStep(1); }} />
                    )}

                    {step === 1 && (mode === "A" || mode === "B") && (
                        <RoofInput
                            onBack={() => setStep(0)}
                            onNext={m2 => { setRoofM2(m2); setStep(2); }}
                        />
                    )}

                    {step === 1 && (mode === "C" || mode === "D") && (
                        <EnergyInput
                            mode={mode}
                            onBack={() => setStep(0)}
                            onNext={e => { setEnergy(e); setStep(3); }}
                        />
                    )}

                    {step === 2 && (
                        <EnergyInput
                            mode={mode}
                            onBack={() => setStep(1)}
                            onNext={e => { setEnergy(e); setStep(3); }}
                        />
                    )}

                    {step === 3 && energy && (
                        <Results
                            mode={mode}
                            roofM2={roofM2 || 40}
                            energy={energy}
                            leadSent={leadSent}
                            onLeadSubmit={data => {
                                console.log("Lead:", data);
                                setLeadSent(true);
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
}