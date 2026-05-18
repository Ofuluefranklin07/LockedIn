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
import ThemeToggle from './ThemeToggle';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col lg:flex-row font-sans overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 sm:px-5 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Target className="text-white" size={20} />
          <h1 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight">LockIn</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle className="h-9 w-9" />
          <div className="flex items-center gap-1 text-[10px] text-[#F97316] font-mono font-semibold border border-[#F97316]/20 px-2 py-0.5 bg-[#F97316]/5">
            <Flame size={10} fill="currentColor" />
            {profile?.currentStreak || 0}
          </div>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} className="text-[#888]" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-xl border-t border-[#1A1A1A] grid grid-cols-5 px-1 z-50 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 min-w-0 transition-all relative rounded-lg",
              isActive ? "text-white" : "text-[#555]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={cn(isActive && "text-white")} />
                <span className="w-full truncate text-center text-[8px] sm:text-[9px] font-semibold uppercase tracking-widest">{item.label}</span>
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="mobileNavIndicator"
                      className="w-1 h-1 bg-[#F97316] rounded-full absolute -bottom-1"
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar (Desktop or Mobile Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-[#050505] z-[100] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] w-[min(20rem,88vw)] border-r border-[#222] flex flex-col lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8 lg:mb-0">
            <div className="flex items-center gap-3">
              <Target className="text-white" size={28} />
              <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight leading-none">LockIn</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <X size={24} className="text-[#444]" />
            </button>
          </div>
          <p className="mt-4 text-[#666] font-mono text-[9px] uppercase tracking-[0.2em] leading-tight font-semibold opacity-60">
            // Operational Status: {profile ? 'LOCKED_IN' : 'STANDBY'}
          </p>
          <ThemeToggle className="mt-6 hidden lg:inline-flex" />
        </div>

        <nav className="flex-1 px-4 sm:px-6 mt-2 lg:mt-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-4 border border-transparent transition-all group relative overflow-hidden rounded-lg",
                isActive 
                  ? "border-[#222] bg-[#F5F5F5] text-[#050505]" 
                  : "text-[#666] hover:text-white hover:bg-[#111]"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={cn("transition-transform group-hover:scale-110")} />
                  <span className="font-display font-bold uppercase text-[12px] tracking-[0.1em]">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActive"
                      className="absolute left-0 w-1 h-2/3 bg-[#F97316]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 sm:p-6 mt-auto">
          <div className="p-5 sm:p-6 mb-4 sm:mb-6 bg-[#0A0A0A] border border-[#222] rounded-lg relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white flex items-center justify-center text-black font-display font-bold text-xl rounded-md">
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono uppercase text-[#444] tracking-[0.2em] mb-1 font-bold opacity-60">Authorized Personnel</p>
                <p className="text-lg font-display font-bold truncate uppercase tracking-tight">{profile?.name || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#F97316] font-mono font-bold uppercase tracking-[0.15em]">
              <Flame size={14} fill="currentColor" />
              {profile?.currentStreak || 0} DAY STREAK
            </div>
            <div className="absolute top-0 right-0 opacity-[0.03] translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity">
              <Target size={120} />
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-3 w-full py-4 text-[#444] hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-mono text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0 lg:ml-80 lg:w-[calc(100%-20rem)]">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:px-8 lg:p-10 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
