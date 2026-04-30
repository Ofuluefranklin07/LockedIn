import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  setDoc,
  increment,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Goal, DailyLog, Task } from '../types';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Calendar,
  ChevronRight,
  Brain,
  Zap,
  ArrowRight,
  Timer,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate, getTodayDateString } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingHours, setLoggingHours] = useState('');
  const [loggingFocus, setLoggingFocus] = useState('7');
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch goals (sort in memory to avoid needing composite index)
      const goalsQuery = query(
        collection(db, 'goals'), 
        where('userId', '==', user.uid)
      );
      const goalsSnap = await getDocs(goalsQuery);
      const goalsData = goalsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Goal))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      setGoals(goalsData);

      // Fetch recent logs (sort in memory to avoid needing index)
      const logsQuery = query(
        collection(db, 'daily_logs'),
        where('userId', '==', user.uid)
      );
      const logsSnap = await getDocs(logsQuery);
      const logsData = logsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as DailyLog))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);
      setRecentLogs(logsData);

      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'dashboard_data');
    }
  };

  const streakStatus = () => {
    if (!profile?.currentStreak) return "Build a streak";
    if (profile.currentStreak === 1) return "Streak started";
    if (profile.currentStreak >= 5) return "You're locking in!";
    return `${profile.currentStreak} days strong`;
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const todayString = getTodayDateString();
    const logId = `${user.uid}_${todayString}`;

    try {
      const logRef = doc(db, 'daily_logs', logId);
      const logSnap = await getDoc(logRef);
      
      const newLogData = {
        userId: user.uid,
        date: todayString,
        hoursStudied: Number(loggingHours),
        focusLevel: Number(loggingFocus),
        tasksCompletedCount: 0,
      };

      if (!logSnap.exists()) {
        // New log for today, handle streak
        await setDoc(logRef, newLogData);
        
        let newStreak = (profile.currentStreak || 0) + 1;
        const lastLogDate = profile.lastLogDate;
        
        // If they missed more than 1 day, reset streak
        if (lastLogDate) {
          const last = new Date(lastLogDate);
          const today = new Date(todayString);
          const diffInDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 3600 * 24));
          if (diffInDays > 1) {
            newStreak = 1;
          }
        }

        await updateDoc(doc(db, 'users', user.uid), {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, profile.longestStreak || 0),
          lastLogDate: todayString
        });
      } else {
        // Update existing log
        await updateDoc(logRef, {
          hoursStudied: increment(Number(loggingHours)),
          focusLevel: Number(loggingFocus)
        });
      }

      setShowLogModal(false);
      setLoggingHours('');
      await fetchDashboardData();
      await refreshProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'daily_logs');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium italic">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#222] pb-12">
        <div className="relative">
          <h1 className="text-[80px] md:text-[100px] font-black italic uppercase leading-[0.8] tracking-tighter">Command</h1>
          <h1 className="text-[80px] md:text-[100px] font-black italic uppercase leading-[0.8] tracking-tighter translate-x-4">Center</h1>
          <p className="mt-8 text-[#888] font-mono text-[10px] uppercase tracking-[0.3em]">
            User: {profile?.name} — {profile?.academicLevel} — {profile?.fieldOfStudy}
          </p>
        </div>
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-[#F5F5F5] text-[#050505] px-8 py-5 font-black uppercase tracking-widest hover:bg-[#DDD] transition-all italic text-sm"
        >
          Deploy Log
        </button>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#222] bg-[#0A0A0A] p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase text-[#888] tracking-widest mb-4 italic">Operational Streak</p>
            <h3 className="text-6xl font-black italic text-[#F97316]">{profile?.currentStreak || 0}</h3>
            <p className="text-[9px] font-mono text-[#555] mt-4 uppercase tracking-widest">{streakStatus()}</p>
          </div>
          <Flame className="absolute -bottom-6 -right-6 text-orange-500/5 rotate-12" size={140} fill="currentColor" />
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-8">
          <p className="text-[10px] font-mono uppercase text-[#888] tracking-widest mb-4 italic">Weekly Intensity</p>
          <h3 className="text-6xl font-black italic">
            {recentLogs.reduce((acc, curr) => acc + curr.hoursStudied, 0).toFixed(1)}
            <span className="text-xl ml-2 font-mono uppercase tracking-normal">H</span>
          </h3>
          <p className="text-[9px] font-mono text-[#555] mt-4 uppercase tracking-widest">Total Study Hours</p>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-8">
          <p className="text-[10px] font-mono uppercase text-[#888] tracking-widest mb-4 italic">Active Objectives</p>
          <h3 className="text-6xl font-black italic">{goals.length}</h3>
          <p className="text-[9px] font-mono text-[#555] mt-4 uppercase tracking-widest">Ongoing Missions</p>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-8">
          <p className="text-[10px] font-mono uppercase text-[#888] tracking-widest mb-4 italic">Cognitive Load</p>
          <h3 className="text-6xl font-black italic">
            {(recentLogs.reduce((acc, curr) => acc + curr.focusLevel, 0) / (recentLogs.length || 1)).toFixed(1)}
          </h3>
          <p className="text-[9px] font-mono text-[#555] mt-4 uppercase tracking-widest">Avg Focus Intensity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Goals Progress */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Mission Status</h2>
            <Link to="/goals" className="text-[9px] font-mono font-bold text-[#555] hover:text-white uppercase tracking-widest transition-colors">
              Expand All Ops
            </Link>
          </div>
          
          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <Link 
                  key={goal.id} 
                  to={`/goals/${goal.id}`}
                  className="group block bg-[#0A0A0A] border border-[#222] p-8 hover:border-[#F5F5F5] transition-all"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-1 bg-[#222] text-[#888]">
                          {goal.priority}
                        </span>
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-1 border border-[#222] text-[#555]">
                          {goal.category}
                        </span>
                      </div>
                      <h4 className="text-4xl font-black uppercase italic tracking-tighter group-hover:text-white">{goal.title}</h4>
                    </div>
                    <ArrowRight className="text-[#333] group-hover:text-white group-hover:translate-x-2 transition-all" size={32} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#555] uppercase tracking-widest">
                      <Calendar size={12} /> Deadline: {formatDate(goal.deadline)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-[#0A0A0A] border border-[#222] border-dashed p-12 text-center">
                <p className="text-[#555] font-mono text-xs uppercase tracking-widest italic mb-6">No mission data deployed.</p>
                <Link 
                  to="/goals" 
                  className="inline-block border border-[#F5F5F5] px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-[#F5F5F5] hover:text-[#050505] transition-all"
                >
                  Initialize Goal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic pb-4 border-b border-[#222]">Tactical Actions</h2>
          
          <div className="space-y-4">
            <Link 
              to="/focus" 
              className="flex items-center justify-between p-6 bg-[#0A0A0A] border border-[#222] hover:border-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-[#222] flex items-center justify-center text-[#555] group-hover:border-white group-hover:text-white transition-all">
                  <Timer size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase italic">Focus Mode</h4>
                  <p className="text-[9px] font-mono text-[#555] uppercase tracking-widest mt-1">Engage Deep Work</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#333]" />
            </Link>

            <Link 
              to="/coach" 
              className="flex items-center justify-between p-6 bg-[#0A0A0A] border border-[#222] hover:border-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-[#222] flex items-center justify-center text-[#555] group-hover:border-white group-hover:text-white transition-all">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase italic">AI Coach</h4>
                  <p className="text-[9px] font-mono text-[#555] uppercase tracking-widest mt-1">Neural Advice</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#333]" />
            </Link>
          </div>

          <div className="border border-[#F97316] p-8 bg-[#0F0804] relative overflow-hidden">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#F97316] mb-6 italic">Advisor Flash</h4>
            <p className="text-sm italic leading-relaxed text-[#CCC] mb-8 font-medium">
              "Your focus is highest between 18:00 and 21:00. Maintain this velocity."
            </p>
            <div className="text-[60px] font-black text-[#F97316]/5 absolute bottom-0 right-0 leading-none pointer-events-none uppercase italic">
              INSIGHT
            </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg bg-[#050505] border border-[#222] p-12 relative"
          >
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-4xl font-black uppercase tracking-tighter italic">Operational Log</h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-[#555] hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Resource Consumption (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  value={loggingHours}
                  onChange={(e) => setLoggingHours(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#222] px-6 py-5 focus:outline-none focus:border-white transition-all text-5xl font-black italic tracking-tighter"
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Cognitive Focus</label>
                  <span className="text-[10px] font-mono text-[#F97316] font-black">{loggingFocus} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={loggingFocus}
                  onChange={(e) => setLoggingFocus(e.target.value)}
                  className="w-full h-1 bg-[#222] appearance-none cursor-pointer accent-[#F97316]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-5 font-black uppercase tracking-widest hover:bg-[#DDD] transition-all italic text-sm mt-8"
              >
                Commit Data
              </button>
            </form>

            <div className="absolute -bottom-8 -left-4 pointer-events-none opacity-5">
              <span className="text-[120px] font-black uppercase italic tracking-tighter select-none">DATA</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
