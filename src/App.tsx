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
import ArtGalleryV2 from './pages/art-gallery/ArtGalleryV2'
import Shaders from './pages/shaders/Shaders'
import PreCalcShaders from './pages/pre-calc-shaders/PreCalcShaders'
import NodeEditor from './pages/node-editor/NodeEditor'
import WebGLBakeExperience from './pages/webglrendertarget/WebGLBakeExperience'
import ImageToLines from './pages/image-to-lines/ImageToLines'
import InteractivePlane from './pages/interactive-plane/InteractivePlane'

const PROJECTS = [
  { id: '01', path: '/stress-materials', name: 'Stress Analysis Beam', color: 'text-cyan-400 group-hover:text-cyan-300' },
  { id: '02', path: '/configurator', name: 'Configurator', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '03', path: '/metropolis', name: 'Metropolis', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '04', path: '/glass', name: 'Glass', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '05', path: '/nutritional-calculator', name: 'Nutritional Calculator', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '06', path: '/face-configurator', name: 'Face Configurator', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '07', path: '/floor-planner', name: 'Floor Planner', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '08', path: '/solar-map', name: 'Solar Map', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '09', path: '/concrete-map-picker', name: 'Concrete Map Picker', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '10', path: '/math-visualizer', name: 'Math Visualizer', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '11', path: '/vr-photostudio-tour', name: 'VR Photo Studio Tour', color: 'text-slate-400 group-hover:text-slate-300' },
  { id: '12', path: '/sport-management', name: 'Sport Management System', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '13', path: '/academic', name: 'Academic Page', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '14', path: '/electric-bike', name: 'Electric Bike', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '15', path: '/materials', name: 'Materials', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '16', path: '/matcaplab', name: 'Matcap Lab', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '17', path: '/matcapcomposer', name: 'Matcap Composer', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '18', path: '/smartloader', name: 'Smart Loader', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '19', path: '/real-estate-dashboard', name: 'Real Estate Dashboard', color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: '20', path: '/art-gallery', name: 'Art Gallery 3D', color: 'text-amber-400 group-hover:text-amber-300' },
  { id: '21', path: '/art-gallery-v2', name: 'Art Gallery 3D V2', color: 'text-amber-400 group-hover:text-amber-300' },
  { id: '22', path: '/shaders', name: 'Shaders', color: 'text-pink-400 group-hover:text-pink-300' },
  { id: '23', path: '/pre-calc-shaders', name: 'Pre Calc Shaders', color: 'text-pink-400 group-hover:text-pink-300' },
  { id: '24', path: '/node-editor', name: 'Node Editor', color: 'text-pink-400 group-hover:text-pink-300' },
  { id: '25', path: '/webgl-bake-experience', name: 'WebGL Bake Experience', color: 'text-pink-400 group-hover:text-pink-300' },
  { id: '26', path: '/image-to-lines', name: 'Image to Lines', color: 'text-pink-400 group-hover:text-pink-300' },
  { id: '27', path: '/interactive-plane', name: 'Interactive Plane', color: 'text-pink-400 group-hover:text-pink-300' },
]

const Home = () => (
  <div className="min-h-screen p-8 md:p-16 lg:p-24 text-white font-sans bg-[#0B0F19] selection:bg-cyan-500/30">
    <div className="max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Experiments <span className="text-slate-500 font-light">Directory</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          A collection of interactive web experiences, 3D configurators, and architectural prototypes.
        </p>
      </header>

      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {PROJECTS.map((p) => (
          <Link
            key={p.id}
            to={p.path}
            className="group relative flex flex-col justify-between p-6 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 overflow-hidden"
          >
            {/* Subtle gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/[0.03] group-hover:to-transparent transition-colors duration-500 pointer-events-none" />

            <div className="flex justify-between items-start mb-12">
              <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                /{p.id}
              </span>

              <svg
                className={`w-5 h-5 opacity-0 -translate-x-4 translate-y-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ease-out ${p.color.split(' ')[0]}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            <div className={`text-lg font-medium transition-colors ${p.color}`}>
              {p.name}
            </div>
          </Link>
        ))}
      </nav>
    </div>
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
        <Route path="/art-gallery-v2" element={<ArtGalleryV2 />} />
        <Route path="/shaders" element={<Shaders />} />
        <Route path="/pre-calc-shaders" element={<PreCalcShaders />} />
        <Route path="/node-editor" element={<NodeEditor />} />
        <Route path="/webgl-bake-experience" element={<WebGLBakeExperience />} />
        <Route path="/image-to-lines" element={<ImageToLines />} />
        <Route path="/interactive-plane" element={<InteractivePlane />} />
      </Routes>
    </BrowserRouter>
  )
}