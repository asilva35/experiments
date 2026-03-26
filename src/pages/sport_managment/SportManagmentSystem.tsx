import React, { useState } from 'react';
import { 
  Users, TrendingUp, ClipboardList, FileText, 
  Search, Plus, ChevronRight, X, Download, Shield, Medal, Star
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RadarTooltip
} from 'recharts';
import { jsPDF } from 'jspdf';

// --- Types & Mock Data ---

type Player = {
  id: number;
  name: string;
  age: number;
  position: string;
  rating: number;
  image: string;
  skills: { speed: number; technical: number; tactical: number; physical: number; passing: number; shooting: number };
  potential: 'High' | 'Medium' | 'Low';
};

const TREND_DATA = [
  { month: 'Jan', rating: 65 },
  { month: 'Feb', rating: 68 },
  { month: 'Mar', rating: 74 },
  { month: 'Apr', rating: 72 },
  { month: 'May', rating: 79 },
  { month: 'Jun', rating: 85 },
];

const MOCK_PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Marcus Silva',
    age: 19,
    position: 'FW',
    rating: 88,
    image: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=200&h=200',
    skills: { speed: 90, technical: 85, tactical: 75, physical: 80, passing: 78, shooting: 92 },
    potential: 'High'
  },
  {
    id: 2,
    name: 'David Chen',
    age: 18,
    position: 'MF',
    rating: 82,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200',
    skills: { speed: 75, technical: 88, tactical: 85, physical: 70, passing: 90, shooting: 78 },
    potential: 'High'
  },
  {
    id: 3,
    name: 'Leo Fernández',
    age: 17,
    position: 'DF',
    rating: 76,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    skills: { speed: 82, technical: 70, tactical: 78, physical: 88, passing: 65, shooting: 50 },
    potential: 'Medium'
  },
  {
    id: 4,
    name: 'Thomas Müller Jr.',
    age: 20,
    position: 'FW',
    rating: 85,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200',
    skills: { speed: 78, technical: 82, tactical: 92, physical: 75, passing: 85, shooting: 88 },
    potential: 'High'
  },
  {
    id: 5,
    name: 'Arthur Gomes',
    age: 16,
    position: 'GK',
    rating: 74,
    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200&h=200',
    skills: { speed: 60, technical: 65, tactical: 70, physical: 85, passing: 75, shooting: 40 },
    potential: 'High'
  }
];

export default function SportManagementSystem() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handlers
  const handleViewProfile = (player: Player) => {
    setSelectedPlayer(player);
    setActiveTab('profile');
  };

  const generatePDF = (player: Player) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129); // Emerald-500 (#10b981)
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('NEXTGEN FOOTBALL', 105, 25, { align: 'center' });
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('OFFICIAL SCOUT REPORT', 105, 55, { align: 'center' });

    // Player Info
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Player Name:`, 20, 75);
    doc.setFont('helvetica', 'bold');
    doc.text(player.name, 55, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Age:`, 20, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(`${player.age}`, 55, 85);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Position:`, 20, 95);
    doc.setFont('helvetica', 'bold');
    doc.text(player.position, 55, 95);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Overall Rating:`, 20, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`${player.rating}/100`, 55, 105);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Potential:`, 20, 115);
    doc.setFont('helvetica', 'bold');
    doc.text(player.potential, 55, 115);

    // Skills
    doc.setFont('helvetica', 'bold');
    doc.text('Technical & Physical Assessment', 110, 75);
    doc.setFont('helvetica', 'normal');
    
    const startY = 85;
    const skillsList = [
      { label: 'Speed', val: player.skills.speed },
      { label: 'Technical', val: player.skills.technical },
      { label: 'Tactical', val: player.skills.tactical },
      { label: 'Physical', val: player.skills.physical },
      { label: 'Passing', val: player.skills.passing },
      { label: 'Shooting', val: player.skills.shooting },
    ];

    skillsList.forEach((skill, idx) => {
      doc.text(`${skill.label}: ${skill.val}/100`, 110, startY + (idx * 10));
    });

    // Decorative Line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(20, 160, 190, 160);

    // Scout Notes Placeholder
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Scout Notes', 20, 175);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Player shows excellent awareness and positioning. Physical attributes are \nwell above average for their age group. Room for improvement in weak foot \ndistribution.', 20, 185);

    // Footer note
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated centrally by NextGen Football Dashboard', 105, 280, { align: 'center' });

    doc.save(`${player.name.replace(' ', '_')}_ScoutReport.pdf`);
  };

  const filteredPlayers = MOCK_PLAYERS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-all">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="w-8 h-8 text-emerald-500 mr-3" />
          <h1 className="text-xl font-bold tracking-wider text-emerald-50">NEXTGEN</h1>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <NavItem 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Dashboard" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Player Database" 
            isActive={activeTab === 'database'} 
            onClick={() => setActiveTab('database')} 
          />
          <NavItem 
            icon={<ClipboardList className="w-5 h-5" />} 
            label="Skill Assessments" 
            isActive={activeTab === 'assessments'} 
            onClick={() => {}} 
          />
          <NavItem 
            icon={<FileText className="w-5 h-5" />} 
            label="Scout Reports" 
            isActive={activeTab === 'reports'} 
            onClick={() => {}} 
          />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
              ES
            </div>
            <div>
              <p className="text-sm font-medium">Head Scout</p>
              <p className="text-xs text-gray-400">Elite Academy</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search players by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Talent</span>
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-950 to-gray-900">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Total Players" value="142" icon={<Users className="w-6 h-6 text-emerald-400" />} trend="+12 this month" />
                <SummaryCard title="High Potential Talents" value="28" icon={<Star className="w-6 h-6 text-yellow-400" />} trend="Top 20%" />
                <SummaryCard title="Pending Assessments" value="15" icon={<ClipboardList className="w-6 h-6 text-orange-400" />} trend="Requires action" />
              </div>

              <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> 
                  Academy Performance Trend
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TREND_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <LineTooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#059669', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* DATABASE TAB */}
          {activeTab === 'database' && (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/60">
                <h3 className="text-lg font-semibold">Active Roster</h3>
                <div className="text-sm text-gray-400">Total: {filteredPlayers.length} players</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Player</th>
                      <th className="px-6 py-4 font-medium">Position</th>
                      <th className="px-6 py-4 font-medium">Age</th>
                      <th className="px-6 py-4 font-medium tracking-wide">OVR Rating</th>
                      <th className="px-6 py-4 font-medium">Potential</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredPlayers.map(player => (
                      <tr key={player.id} className="hover:bg-gray-800/60 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img src={player.image} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-gray-600 group-hover:border-emerald-500 transition-colors shadow-sm" />
                            <span className="font-medium text-gray-100">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-md font-semibold font-mono tracking-wider">{player.position}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-medium">{player.age}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 text-center font-bold text-emerald-400">{player.rating}</div>
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${player.rating}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                            player.potential === 'High' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                           }`}>
                             {player.potential}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleViewProfile(player)}
                            className="bg-gray-700 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center ml-auto"
                            title="View Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPlayers.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    No players found matching your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE VIEW TAB */}
          {activeTab === 'profile' && selectedPlayer && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                onClick={() => setActiveTab('database')}
                className="flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                Back to Database
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Summary Info */}
                <div className="col-span-1 space-y-6">
                  <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10" />
                    
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <img 
                          src={selectedPlayer.image} 
                          alt={selectedPlayer.name} 
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 ring-2 ring-emerald-500 shadow-xl"
                        />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-900 shadow-lg">
                          {selectedPlayer.rating}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <span className="px-3 py-1 bg-gray-700 text-emerald-400 text-xs rounded-md font-bold font-mono tracking-wider">{selectedPlayer.position}</span>
                        <span className="text-sm text-gray-400 font-medium">{selectedPlayer.age} y/o</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 text-center">
                        <p className="text-xs text-gray-400 mb-1">Potential</p>
                        <p className="font-semibold text-emerald-400">{selectedPlayer.potential}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 text-center">
                        <p className="text-xs text-gray-400 mb-1">Pref. Foot</p>
                        <p className="font-semibold text-white">Right</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => generatePDF(selectedPlayer)}
                      className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    >
                      <Download className="w-5 h-5" />
                      <span>Generate Scout Report (PDF)</span>
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3 px-4">This will generate a ready-to-print assessment file.</p>
                  </div>
                </div>

                {/* Right Side: Radar Chart */}
                <div className="col-span-1 lg:col-span-2">
                  <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 h-full flex flex-col items-center justify-center">
                    <div className="w-full flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Medal className="w-5 h-5 mr-2 text-emerald-500" />
                        Skill Assessment Radar
                      </h3>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Updated 2 days ago
                      </span>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[350px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          cx="50%" cy="50%" outerRadius="75%" 
                          data={[
                            { subject: 'Speed', A: selectedPlayer.skills.speed, fullMark: 100 },
                            { subject: 'Technical', A: selectedPlayer.skills.technical, fullMark: 100 },
                            { subject: 'Tactical', A: selectedPlayer.skills.tactical, fullMark: 100 },
                            { subject: 'Physical', A: selectedPlayer.skills.physical, fullMark: 100 },
                            { subject: 'Passing', A: selectedPlayer.skills.passing, fullMark: 100 },
                            { subject: 'Shooting', A: selectedPlayer.skills.shooting, fullMark: 100 },
                          ]}
                        >
                          <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1d5db', fontSize: 13, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <RadarTooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#fff' }}
                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                          />
                          <Radar 
                            name={selectedPlayer.name} 
                            dataKey="A" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fill="#10b981" 
                            fillOpacity={0.4} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Talent</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Bukayo Saka" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Position</label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option>FW (Forward)</option>
                    <option>MF (Midfielder)</option>
                    <option>DF (Defender)</option>
                    <option>GK (Goalkeeper)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Age</label>
                  <input type="number" min="14" max="23" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 18" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Assessment Score (1-100)</label>
                <input type="number" min="1" max="100" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 75" required />
              </div>
              
              <div className="pt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/20">
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      }`}
    >
      <div className={`${isActive ? 'text-emerald-500' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}

function SummaryCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 shadow-inner">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-gray-400 text-sm font-medium mb-1">{title}</h4>
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <div className="text-xs text-gray-500 font-medium bg-gray-900/50 inline-block px-2.5 py-1 rounded-md border border-gray-800">{trend}</div>
      </div>
    </div>
  );
}
