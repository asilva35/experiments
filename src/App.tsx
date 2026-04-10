import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import StressMaterials from './pages/StressMaterials/StressMaterials'
import ShelfConfigurator from './pages/configurator/ShelfConfigurator'
import Metropolis from './pages/city/Metropolis'
import GlassExperience from './pages/glass/GlassExperience'
import NutritionalCalculator from './pages/nutritional-calculator/NutritionalCalculator'
import FaceConfigurator from './pages/glasses-tryon/FaceConfigurator'
import FloorPlanner from './pages/floor_planner/FloorPlanner'
import SolarMapPicker from './pages/solar_map/SolarMapPicker'
import ConcreteMapPicker from './pages/concrete_quoter/ConcreteMapPicker'
import MathVisualizer from './pages/math-visualizer/MathVisualizer'
import VRPhotoStudioTour from './pages/vr-showcase/VRPhotoStudioTour'
import SportManagementSystem from './pages/sport_managment/SportManagmentSystem'
import AcademicPage from './pages/academic/AcademicPage'
import ElectricBike from './pages/electric_bike/ElectricBike'
import Materials from './pages/materials/Materials'
import MatcapLab from './pages/matcaplab/MatcapLab'
import MatcapComposer from './pages/matcaplab/MatcapComposer'
import SmartLoader from './pages/matcaplab/SmartLoader'
import RealEstateDashboard from './pages/real-estate-insights/RealEstateDashboard'
import ArtGallery from './pages/art-gallery/ArtGallery'
import Shaders from './pages/shaders/Shaders'

// Un componente simple para la página de inicio o selección
const Home = () => (
  <div className="p-20 text-white font-mono bg-slate-900">
    <h1 className="text-3xl mb-8 border-b border-slate-800 pb-4">Projects</h1>
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
      <Link to="/nutritional-calculator" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/05</span> Nutritional Calculator
      </Link>
      <Link to="/face-configurator" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/06</span> Face Configurator
      </Link>
      <Link to="/floor-planner" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/07</span> Floor Planner
      </Link>
      <Link to="/solar-map" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/08</span> Solar Map
      </Link>
      <Link to="/concrete-map-picker" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/09</span> Concrete Map Picker
      </Link>
      <Link to="/math-visualizer" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/10</span> Math Visualizer
      </Link>
      <Link to="/vr-photostudio-tour" className="text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/11</span> VR Photo Studio Tour
      </Link>
      <Link to="/sport-management" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/12</span> Sport Management System
      </Link>
      <Link to="/academic" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/13</span> Academic Page
      </Link>
      <Link to="/electric-bike" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/14</span> Electric Bike
      </Link>
      <Link to="/materials" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/15</span> Materials
      </Link>
      <Link to="/matcaplab" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/16</span> Matcap Lab
      </Link>
      <Link to="/matcapcomposer" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/17</span> Matcap Composer
      </Link>
      <Link to="/smartloader" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/18</span> Smart Loader
      </Link>
      <Link to="/real-estate-dashboard" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/19</span> Real Estate Dashboard
      </Link>
      <Link to="/art-gallery" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2">
        <span className="opacity-50">/20</span> Art Gallery 3D
      </Link>
      <Link to="/shaders" className="text-pink-500 hover:text-pink-400 transition-colors flex items-center gap-2">
        <span className="opacity-50">/21</span> Shaders
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
        <Route path="/nutritional-calculator" element={<NutritionalCalculator />} />
        <Route path="/face-configurator" element={<FaceConfigurator />} />
        <Route path="/floor-planner" element={<FloorPlanner />} />
        <Route path="/solar-map" element={<SolarMapPicker />} />
        <Route path="/concrete-map-picker" element={<ConcreteMapPicker />} />
        <Route path="/math-visualizer" element={<MathVisualizer />} />
        <Route path="/vr-photostudio-tour" element={<VRPhotoStudioTour />} />
        <Route path="/sport-management" element={<SportManagementSystem />} />
        <Route path="/academic" element={<AcademicPage />} />
        <Route path="/electric-bike" element={<ElectricBike />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/matcaplab" element={<MatcapLab />} />
        <Route path="/matcapcomposer" element={<MatcapComposer />} />
        <Route path="/smartloader" element={<SmartLoader />} />
        <Route path="/real-estate-dashboard" element={<RealEstateDashboard />} />
        <Route path="/art-gallery" element={<ArtGallery />} />
        <Route path="/shaders" element={<Shaders />} />
      </Routes>
    </BrowserRouter>
  )
}