import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import StressMaterials from './pages/StressMaterials/StressMaterials'
import ShelfConfigurator from './pages/configurator/ShelfConfigurator'
import Metropolis from './pages/city/Metropolis'
import GlassExperience from './pages/glass/GlassExperience'

// Un componente simple para la página de inicio o selección
const Home = () => (
  <div className="p-20 text-white font-mono bg-slate-900 h-screen">
    <h1 className="text-3xl mb-8 border-b border-slate-800 pb-4">Experiments</h1>
    <nav className="flex flex-col gap-4">
      <Link to="/stress-materials" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2">
        <span className="opacity-50">/01</span> Stress Analysis Beam
      </Link>
      <Link to="/configurator" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/02</span> Configurator
      </Link>
      <Link to="/metropolis" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/03</span> Metropolis
      </Link>
      <Link to="/glass" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/04</span> Glass
      </Link>
    </nav>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stress-materials" element={<StressMaterials />} />
        <Route path="/configurator" element={<ShelfConfigurator />} />
        <Route path="/metropolis" element={<Metropolis />} />
        <Route path="/glass" element={<GlassExperience />} />
      </Routes>
    </BrowserRouter>
  )
}