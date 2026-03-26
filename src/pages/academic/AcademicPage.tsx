import { useState } from 'react';
import {
    Calendar as CalendarIcon,
    Search,
    Mail,
    FileText,
    ExternalLink,
    Monitor,
    Bell,
    BookOpen,
    GraduationCap
} from 'lucide-react';

// --- MOCK DATA ---
const calendarEvents = [
    { id: 1, date: 'Oct 15, 2026', title: 'Midterm Examinations Begin', type: 'Exam' },
    { id: 2, date: 'Nov 01, 2026', title: 'Spring Registration Opens', type: 'Registration' },
    { id: 3, date: 'Nov 24, 2026', title: 'Thanksgiving Break', type: 'Holiday' },
    { id: 4, date: 'Dec 10, 2026', title: 'Last Day of Classes', type: 'Academic' },
];

const facultyMembers = [
    { id: 1, name: 'Dr. Sarah Jenkins', title: 'Professor of Computer Science', department: 'Engineering', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { id: 2, name: 'Dr. Marcus Webb', title: 'Associate Professor', department: 'Mathematics', image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80' },
    { id: 3, name: 'Prof. Elena Rodriguez', title: 'Department Chair', department: 'Physics', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
    { id: 4, name: 'Dr. James Chen', title: 'Assistant Professor', department: 'Biology', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
    { id: 5, name: 'Dr. Emily Carter', title: 'Lecturer', department: 'Literature', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
    { id: 6, name: 'Prof. William Davies', title: 'Senior Researcher', department: 'Computer Science', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
];

const announcements = [
    { id: 1, title: 'New Campus Wi-Fi Network', category: 'Campus News', type: 'portal', summary: 'Instructions for connecting to the new ultra-fast campus network and VPN setup for students and faculty.' },
    { id: 2, title: 'Fall 2026 Syllabus Template', category: 'Academic Alerts', type: 'pdf', summary: 'Updated template for the upcoming semester requirements. Ensure ADA compliance.' },
    { id: 3, title: 'Student Organization Fair', category: 'Student Life', type: 'link', summary: 'Discover over 100+ clubs and organizations this Friday at the main quad.' },
    { id: 4, title: 'Library Extended Hours', category: 'Campus News', type: 'portal', summary: 'Main library will be open 24/7 starting next week for the upcoming finals.' },
];

// --- COMPONENTS ---

const NavigationHeader = () => (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900 rounded-md flex items-center justify-center text-white shadow-sm">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                        Valerius <span className="text-blue-900">University</span>
                    </span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex space-x-10" aria-label="Main Navigation">
                    <a href="#calendar" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Calendar</a>
                    <a href="#directory" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Directory</a>
                    <a href="#resources" className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors">Resources</a>
                </nav>

                {/* Utilities & Mobile menu button wrapper */}
                <div className="flex items-center gap-4">
                    <button className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
                        Student Portal
                    </button>
                    <button className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-md" aria-label="Open menu">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </header>
);

const AcademicCalendar = () => {
    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'Exam': return 'bg-red-50 text-red-700 border-red-200';
            case 'Registration': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Holiday': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    return (
        <section id="calendar" className="py-20 bg-slate-50 border-b border-slate-200" aria-labelledby="calendar-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="h-8 w-8 text-blue-900" aria-hidden="true" />
                            <h2 id="calendar-heading" className="text-4xl font-serif font-bold text-slate-900">Academic Calendar</h2>
                        </div>
                        <p className="text-slate-500 text-lg">Key dates and deadlines for the upcoming semester.</p>
                    </div>
                    <button className="text-sm font-medium text-white-700 hover:text-white-900 hover:underline transition-all">
                        View Full Calendar &rarr;
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {calendarEvents.map((event) => (
                        <article key={event.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                            <div className="flex flex-col h-full">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border w-max mb-5 ${getBadgeColor(event.type)}`}>
                                    {event.type}
                                </span>
                                <time dateTime={event.date} className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{event.date}</time>
                                <h3 className="text-xl font-semibold text-slate-900 leading-tight group-hover:text-blue-900 transition-colors">{event.title}</h3>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FacultyDirectory = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFaculty = facultyMembers.filter(faculty =>
        faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section id="directory" className="py-20 bg-white border-b border-slate-200" aria-labelledby="directory-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div>
                        <h2 id="directory-heading" className="text-4xl font-serif font-bold text-slate-900 mb-2">Faculty Directory</h2>
                        <p className="text-slate-500 text-lg">Connect with our distinguished professors and researchers.</p>
                    </div>

                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-blue-900 sm:text-sm transition-all shadow-sm"
                            placeholder="Search by name or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search faculty by name or department"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredFaculty.length > 0 ? (
                        filteredFaculty.map((faculty) => (
                            <article key={faculty.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex items-center gap-5 mb-5">
                                        <img
                                            src={faculty.image}
                                            alt={`Photo of ${faculty.name}`}
                                            className="h-16 w-16 rounded-full object-cover border p-0.5 border-slate-200"
                                            loading="lazy"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{faculty.name}</h3>
                                            <p className="text-sm font-semibold text-blue-700 mt-0.5">{faculty.department}</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-6 pb-6 border-b border-slate-100">{faculty.title}</p>
                                    <button
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-white-700 bg-slate-50 hover:bg-slate-100 hover:text-white-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all"
                                        aria-label={`Contact ${faculty.name}`}
                                    >
                                        <Mail className="max-h-4 w-4 mr-2" aria-hidden="true" />
                                        Contact
                                    </button>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                            <Search className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-lg font-medium text-slate-700">No faculty members found</p>
                            <p className="text-sm">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const StudentResources = () => {
    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="h-5 w-5 text-red-400" aria-label="PDF Document" />;
            case 'link': return <ExternalLink className="h-5 w-5 text-emerald-400" aria-label="External Link" />;
            case 'portal': return <Monitor className="h-5 w-5 text-blue-400" aria-label="Portal Link" />;
            default: return <BookOpen className="h-5 w-5 text-slate-400" aria-hidden="true" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Campus News': return <BookOpen className="inline-block h-3.5 w-3.5 mr-1.5" />;
            case 'Academic Alerts': return <Bell className="inline-block h-3.5 w-3.5 mr-1.5" />;
            case 'Student Life': return <CalendarIcon className="inline-block h-3.5 w-3.5 mr-1.5" />;
            default: return null;
        }
    };

    return (
        <section id="resources" className="py-20 bg-slate-900 text-white" aria-labelledby="resources-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="max-w-2xl">
                        <h2 id="resources-heading" className="text-4xl font-serif font-bold mb-4 text-white">Student Resources & Announcements</h2>
                        <p className="text-slate-400 text-lg">Stay updated with the latest campus news, academic deadlines, and essential student resources.</p>
                    </div>
                    <button className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-all">
                        View All Announcements &rarr;
                    </button>
                </div>

                {/* Bento Box Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {announcements.map((item, index) => (
                        <article
                            key={item.id}
                            className={`bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all flex flex-col group cursor-pointer shadow-lg ${index === 0 ? 'md:col-span-2 md:row-span-2' : '' // Make the first item larger
                                }`}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <span className="inline-flex items-center text-xs font-semibold text-slate-300 bg-slate-900/50 border border-slate-700 px-3 py-1.5 rounded-full">
                                    {getCategoryIcon(item.category)}
                                    {item.category}
                                </span>
                                <div className="p-2.5 bg-slate-900/50 rounded-lg group-hover:scale-110 transition-transform border border-slate-700">
                                    {getResourceIcon(item.type)}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <h3 className={`font-bold text-white mb-3 group-hover:text-blue-400 transition-colors ${index === 0 ? 'text-2xl md:text-4xl leading-tight' : 'text-xl leading-snug'}`}>
                                    {item.title}
                                </h3>
                                <p className={`text-slate-400 leading-relaxed ${index === 0 ? 'text-lg max-w-2xl' : 'text-base line-clamp-2'}`}>
                                    {item.summary}
                                </p>
                            </div>

                            {/* Fake actionable area */}
                            <div className="mt-8 pt-5 border-t border-slate-700/50 flex items-center text-sm font-semibold text-blue-400 group-hover:translate-x-1 transition-transform w-max">
                                Access Resource <span aria-hidden="true" className="ml-2">&rarr;</span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-slate-950 py-12 text-slate-400 text-sm border-t border-slate-900" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded-md">
                    <GraduationCap className="h-5 w-5 text-slate-500" />
                </div>
                <span className="font-serif text-lg font-bold text-slate-300">Valerius University</span>
            </div>
            <div className="flex gap-8">
                <a href="#" className="hover:text-white transition-colors font-medium">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors font-medium">Accessibility</a>
                <a href="#" className="hover:text-white transition-colors font-medium">Contact</a>
            </div>
            <p>&copy; {new Date().getFullYear()} Valerius University. All rights reserved.</p>
        </div>
    </footer>
);

export default function AcademicPage() {
    return (
        <div className="fixed inset-0 h-full w-full overflow-y-auto overflow-x-hidden bg-slate-50 font-sans selection:bg-blue-900 selection:text-white text-left">
            <NavigationHeader />

            <main>
                <AcademicCalendar />
                <FacultyDirectory />
                <StudentResources />
            </main>

            <Footer />
        </div>
    );
}
