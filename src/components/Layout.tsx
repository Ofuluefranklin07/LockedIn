import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Target, 
  BarChart2, 
  Timer, 
  MessageSquare, 
  LogOut, 
  Flame,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: Timer, label: 'Focus Mode', path: '/focus' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: MessageSquare, label: 'AI Coach', path: '/coach' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-bottom border-[#1A1A1A] bg-[#0A0A0A] z-50">
        <div className="flex items-center gap-2">
          <Target className="text-white" size={24} />
          <span className="font-bold text-lg">LockIn</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-0 bg-[#050505] z-40 transition-transform duration-300 md:translate-x-0 w-64 border-r border-[#222] flex flex-col",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-8 hidden md:flex flex-col">
          <div className="flex items-center gap-3">
            <Target className="text-white" size={32} />
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">LockIn</h1>
          </div>
          <p className="mt-4 text-[#888] font-mono text-[9px] uppercase tracking-widest leading-tight">
            Status: {profile ? 'Locked In' : 'Standby'}
          </p>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 border border-transparent transition-all group",
                isActive 
                  ? "border-[#F5F5F5] bg-[#F5F5F5] text-[#050505]" 
                  : "text-[#888] hover:text-white hover:border-[#222]"
              )}
            >
              <item.icon size={18} />
              <span className="font-bold uppercase text-[11px] tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-[#222]">
          <div className="p-6 mb-4 bg-[#0A0A0A] border border-[#222]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-none bg-[#F5F5F5] flex items-center justify-center text-[#050505] font-black">
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase text-[#888] leading-none mb-1">Authenticated</p>
                <p className="text-sm font-black truncate uppercase italic">{profile?.name || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#F97316] font-mono uppercase tracking-widest">
              <Flame size={12} fill="currentColor" />
              {profile?.currentStreak || 0} DAY STREAK
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-[#555] hover:text-white transition-all font-mono text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
