import { Link, useLocation } from 'react-router-dom';
import { Activity, Settings, Home, Code2 } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Editor', path: '/editor', icon: Code2 },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-[#0F0F0F]/60 backdrop-blur-xl flex justify-between items-center text-white">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight transition-transform hover:scale-105 active:scale-95">
        <Activity className="text-[#008170]" size={24} />
        <span>Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008170] to-[#A888B5]">-State</span></span>
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link 
              key={link.path}
              to={link.path} 
              className={`flex items-center gap-3 text-base font-semibold transition-all duration-300 hover:scale-105 ${
                isActive ? 'text-[#008170] drop-shadow-[0_0_8px_rgba(0,129,112,0.8)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{link.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
}
