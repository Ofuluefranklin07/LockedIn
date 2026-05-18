import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
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
  getDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Goal, DailyLog, Task } from "../types";
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
  MessageSquare,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatDate, getTodayDateString } from "../lib/utils";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingHours, setLoggingHours] = useState("");
  const [loggingFocus, setLoggingFocus] = useState("7");
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
        collection(db, "goals"),
        where("userId", "==", user.uid),
      );
      const goalsSnap = await getDocs(goalsQuery);
      const goalsData = goalsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Goal)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3);
      setGoals(goalsData);

      // Fetch recent logs (sort in memory to avoid needing index)
      const logsQuery = query(
        collection(db, "daily_logs"),
        where("userId", "==", user.uid),
      );
      const logsSnap = await getDocs(logsQuery);
      const logsData = logsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as DailyLog)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);
      setRecentLogs(logsData);

      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "dashboard_data");
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
      const logRef = doc(db, "daily_logs", logId);
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
          const diffInDays = Math.floor(
            (today.getTime() - last.getTime()) / (1000 * 3600 * 24),
          );
          if (diffInDays > 1) {
            newStreak = 1;
          }
        }

        await updateDoc(doc(db, "users", user.uid), {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, profile.longestStreak || 0),
          lastLogDate: todayString,
        });
      } else {
        // Update existing log
        await updateDoc(logRef, {
          hoursStudied: increment(Number(loggingHours)),
          focusLevel: Number(loggingFocus),
        });
      }

      setShowLogModal(false);
      setLoggingHours("");
      await fetchDashboardData();
      await refreshProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "daily_logs");
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
    <div className="space-y-8 md:space-y-12">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-[#222] pb-10 md:pb-14">
        <div className="relative min-w-0">
          <h1 className="text-[clamp(3rem,10vw,5.75rem)] font-display font-bold uppercase leading-[0.88] tracking-tight break-words">
            Goals Track
          </h1>
          <h1 className="text-[clamp(3rem,10vw,5.75rem)] font-display font-bold uppercase leading-[0.88] tracking-tight translate-x-2 md:translate-x-4 break-words">
            Center
          </h1>
          <p className="mt-8 max-w-3xl text-[#666] font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] font-medium opacity-60 break-words">
            {profile?.name} <span className="mx-2 opacity-20">|</span>{" "}
            {profile?.academicLevel} <span className="mx-2 opacity-20">|</span>{" "}
            {profile?.fieldOfStudy}
          </p>
        </div>
       
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="border border-[#222] bg-[#0A0A0A] p-5 sm:p-6 md:p-8 rounded-lg relative overflow-hidden group transition-transform hover:-translate-y-1">
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase text-[#444] tracking-[0.2em] mb-4 font-semibold">
              Operational Streak
            </p>
            <h3 className="text-5xl md:text-6xl font-display font-bold text-[#F97316] tracking-tighter">
              {profile?.currentStreak || 0}
            </h3>
            <p className="text-[9px] font-mono text-[#333] mt-4 uppercase tracking-[0.15em] font-semibold">
              {streakStatus()}
            </p>
          </div>
          <Flame
            className="absolute -bottom-6 -right-6 text-[#F97316]/5 rotate-12 transition-transform group-hover:scale-110"
            size={140}
            fill="currentColor"
          />
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-5 sm:p-6 md:p-8 rounded-lg transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-mono uppercase text-[#444] tracking-[0.2em] mb-4 font-semibold">
            Weekly Intensity
          </p>
          <h3 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">
            {recentLogs
              .reduce((acc, curr) => acc + curr.hoursStudied, 0)
              .toFixed(1)}
            <span className="text-xl ml-2 font-mono uppercase tracking-normal opacity-40">
              H
            </span>
          </h3>
          <p className="text-[9px] font-mono text-[#333] mt-4 uppercase tracking-[0.15em] font-semibold">
            Total Study Hours
          </p>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-5 sm:p-6 md:p-8 rounded-lg transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-mono uppercase text-[#444] tracking-[0.2em] mb-4 font-semibold">
            Active Objectives
          </p>
          <h3 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">
            {goals.length}
          </h3>
          <p className="text-[9px] font-mono text-[#333] mt-4 uppercase tracking-[0.15em] font-semibold">
            Ongoing Missions
          </p>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-5 sm:p-6 md:p-8 rounded-lg transition-transform hover:-translate-y-1">
          <p className="text-[10px] font-mono uppercase text-[#444] tracking-[0.2em] mb-4 font-semibold">
            {" "}
            Goals Load
          </p>
          <h3 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">
            {(
              recentLogs.reduce((acc, curr) => acc + curr.focusLevel, 0) /
              (recentLogs.length || 1)
            ).toFixed(1)}
          </h3>
          <p className="text-[9px] font-mono text-[#333] mt-4 uppercase tracking-[0.15em] font-semibold">
            Avg Focus Intensity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Goals Progress */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">
              Mission Status
            </h2>
            <Link
              to="/goals"
              className="text-[9px] font-mono font-bold text-[#555] hover:text-white uppercase tracking-widest transition-colors"
            >
              Expand all Goals
            </Link>
          </div>

          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <Link
                  key={goal.id}
                  to={`/goals/${goal.id}`}
                  className="group block bg-[#0A0A0A] border border-[#222] p-5 sm:p-6 md:p-8 rounded-lg hover:border-[#F5F5F5] transition-all relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="space-y-3 min-w-0 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] px-2 py-1 bg-[#111] text-[#666] border border-[#222]">
                          {goal.priority}
                        </span>
                        <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] px-2 py-1 border border-[#222] text-[#444] italic">
                          {goal.category}
                        </span>
                      </div>
                      <h4 className="text-2xl sm:text-3xl md:text-4xl font-display font-black uppercase tracking-tight group-hover:text-white transition-colors break-words">
                        {goal.title}
                      </h4>
                    </div>
                    <ArrowRight
                      className="shrink-0 text-[#222] group-hover:text-white group-hover:translate-x-2 transition-all"
                      size={32}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#444] uppercase tracking-[0.2em] font-black">
                      <Calendar size={12} className="opacity-40" /> Terminal:{" "}
                      {formatDate(goal.deadline)}
                    </div>
                  </div>
                  {/* Decorative background text */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.02] pointer-events-none transition-opacity group-hover:opacity-10">
                    <Target size={100} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-[#0A0A0A] border border-[#222] border-dashed p-8 sm:p-12 rounded-lg text-center">
                <p className="text-[#555] font-mono text-xs uppercase tracking-widest italic mb-6">
                  No goals available.
                </p>
                <Link
                  to="/goals"
                  className="inline-block border border-[#F5F5F5] px-8 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#F5F5F5] hover:text-[#050505] transition-all active:scale-[0.98]"
                >
                  Start setting your Goals
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic pb-4 border-b border-[#222]">
            Tactical Actions
          </h2>

          <div className="space-y-12">
            <div className="space-y-4">
              <Link
                to="/focus"
                className="flex items-center justify-between p-5 sm:p-6 md:p-8 bg-[#0A0A0A] border border-[#222] rounded-lg hover:border-[#F5F5F5] transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 border border-[#222] rounded-lg flex items-center justify-center text-[#444] group-hover:border-white group-hover:text-white transition-all bg-[#050505]">
                    <Timer size={22} />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base md:text-lg uppercase tracking-tight">
                      Focus Mode
                    </h4>
                    <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] mt-1 font-black italic">
                      Engage Deep Work
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-[#222] group-hover:text-white transition-colors"
                />
              </Link>

              <Link
                to="/coach"
                className="flex items-center justify-between p-5 sm:p-6 md:p-8 bg-[#0A0A0A] border border-[#222] rounded-lg hover:border-[#F5F5F5] transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 border border-[#222] rounded-lg flex items-center justify-center text-[#444] group-hover:border-white group-hover:text-white transition-all bg-[#050505]">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-base md:text-lg uppercase tracking-tight">
                      AI Coach
                    </h4>
                    <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] mt-1 font-black italic">
                      Neural Advice
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-[#222] group-hover:text-white transition-colors"
                />
              </Link>
            </div>

            <div className="border border-[#F97316]/50 p-6 sm:p-8 md:p-10 bg-[#0F0804] rounded-lg relative overflow-hidden group">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#F97316] mb-6 italic font-black">
                Advisor Flash
              </h4>
              <p className="text-sm md:text-base leading-relaxed text-[#CCC] mb-8 font-medium">
                "Your focus is highest between 18:00 and 21:00. Maintain this
                velocity."
              </p>
              <div className="text-[70px] font-display font-black text-[#F97316]/5 absolute bottom-0 right-0 leading-none pointer-events-none uppercase italic tracking-tighter transition-all group-hover:opacity-10">
                INSIGHT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      
                
          </div>)}    
   


