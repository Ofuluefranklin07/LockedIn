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
      // Fetch high priority goals
      const goalsQuery = query(
        collection(db, 'goals'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const goalsSnap = await getDocs(goalsQuery);
      setGoals(goalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));

      // Fetch recent logs
      const logsQuery = query(
        collection(db, 'daily_logs'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(7)
      );
      const logsSnap = await getDocs(logsQuery);
      setRecentLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DailyLog)));

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
    <div className="space-y-10">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Command Center</h1>
          <p className="text-gray-400 font-medium">Welcome back, <span className="text-white">{profile?.name}</span>. Today is {formatDate(new Date())}.</p>
        </div>
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-white text-black px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
          Log Activity
        </button>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="p-2 bg-orange-500/10 rounded-xl w-fit mb-4 text-orange-500">
              <Flame size={20} fill="currentColor" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Streak</p>
            <h3 className="text-4xl font-black">{profile?.currentStreak || 0}</h3>
            <p className="text-xs text-orange-500 font-bold mt-2 uppercase">{streakStatus()}</p>
          </div>
          <Flame className="absolute -bottom-4 -right-4 text-orange-500/5 rotate-12" size={120} fill="currentColor" />
        </div>

        <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl">
          <div className="p-2 bg-blue-500/10 rounded-xl w-fit mb-4 text-blue-500">
            <Clock size={20} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Study Hours (Week)</p>
          <h3 className="text-4xl font-black">
            {recentLogs.reduce((acc, curr) => acc + curr.hoursStudied, 0).toFixed(1)}
          </h3>
          <p className="text-xs text-blue-500 font-bold mt-2 uppercase">Consistent progress</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl">
          <div className="p-2 bg-green-500/10 rounded-xl w-fit mb-4 text-green-500">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Goals Tracked</p>
          <h3 className="text-4xl font-black">{goals.length}</h3>
          <p className="text-xs text-green-500 font-bold mt-2 uppercase">Core objectives</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl">
          <div className="p-2 bg-purple-500/10 rounded-xl w-fit mb-4 text-purple-500">
            <Brain size={20} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Focus Level</p>
          <h3 className="text-4xl font-black">
            {recentLogs.length > 0 
              ? (recentLogs.reduce((acc, curr) => acc + curr.focusLevel, 0) / recentLogs.length).toFixed(1)
              : '0.0'
            }
          </h3>
          <p className="text-xs text-purple-500 font-bold mt-2 uppercase">Cognitive intensity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={20} /> Current Goals
            </h2>
            <Link to="/goals" className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <Link 
                  key={goal.id} 
                  to={`/goals/${goal.id}`}
                  className="group block bg-[#141414] border border-[#262626] p-6 rounded-2xl hover:border-white transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] uppercase font-black px-2 py-0.5 rounded-md",
                          goal.priority === 'high' ? "bg-red-500/10 text-red-500" :
                          goal.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {goal.priority}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md">
                          {goal.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg group-hover:text-white">{goal.title}</h4>
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} /> {formatDate(goal.deadline)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-12 text-center">
                <p className="text-gray-500 font-medium mb-4 italic">No active goals found.</p>
                <Link 
                  to="/goals" 
                  className="inline-flex items-center gap-2 text-white bg-[#262626] px-4 py-2 rounded-lg font-bold hover:bg-[#333] transition-colors"
                >
                  <Plus size={16} /> Create your first goal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Zap size={20} /> Quick Actions
          </h2>
          
          <div className="space-y-3">
            <Link 
              to="/focus" 
              className="flex items-center justify-between p-5 bg-[#141414] border border-[#262626] rounded-2xl hover:bg-[#1A1A1A] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500 group-hover:scale-110 transition-transform">
                  <Timer size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Focus Mode</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Start Session</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </Link>

            <Link 
              to="/coach" 
              className="flex items-center justify-between p-5 bg-[#141414] border border-[#262626] rounded-2xl hover:bg-[#1A1A1A] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">AI Coach</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Get Insights</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </Link>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Today's Focus Status</h4>
            {recentLogs.find(l => l.date === getTodayDateString()) ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold">Activity logged for today</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-gray-400 italic">No activity logged yet</span>
              </div>
            )}
            <p className="text-[10px] leading-relaxed text-gray-500 italic">Consistency is the bridge between goals and achievement.</p>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight italic">Log Daily Work</h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hours Studied</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    autoFocus
                    value={loggingHours}
                    onChange={(e) => setLoggingHours(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-5 py-4 focus:outline-none focus:border-white transition-all text-xl font-black"
                    placeholder="2.5"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold uppercase text-[10px]">HRS</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  <label>Focus Level</label>
                  <span className="text-white bg-[#262626] px-2 py-0.5 rounded-md">{loggingFocus}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={loggingFocus}
                  onChange={(e) => setLoggingFocus(e.target.value)}
                  className="w-full h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                  <span>Vague</span>
                  <span>Dialed In</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
              >
                Commit Activity
              </button>
            </form>
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
