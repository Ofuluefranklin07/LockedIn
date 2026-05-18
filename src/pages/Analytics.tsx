import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyLog } from '../types';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, BarChart3, CalendarDays, Clock, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { format, isValid, parseISO, subDays } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

type ChartPoint = {
  dateKey: string;
  date: string;
  hours: number;
  focus: number;
  logged: boolean;
};

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeLog(id: string, data: Partial<DailyLog>): DailyLog | null {
  if (!data.date || typeof data.date !== 'string') return null;

  const parsedDate = parseISO(data.date);
  if (!isValid(parsedDate)) return null;

  return {
    id,
    userId: String(data.userId ?? ''),
    date: data.date,
    hoursStudied: Math.max(0, toNumber(data.hoursStudied)),
    focusLevel: Math.min(10, Math.max(0, toNumber(data.focusLevel))),
    tasksCompletedCount: Math.max(0, toNumber(data.tasksCompletedCount)),
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = {
    hero: isLight
      ? 'border-slate-200 bg-gradient-to-br from-blue-50 via-[#FFFFFF] to-orange-50 text-slate-950 shadow-xl shadow-slate-200/70'
      : 'border-white/10 bg-gradient-to-br from-[#1F1F1F] via-[#151515] to-[#0B0B0B] text-[#FFFFFF] shadow-2xl shadow-black/30',
    card: isLight
      ? 'bg-[#FFFFFF] border-slate-200 text-slate-950 shadow-xl shadow-slate-200/70'
      : 'bg-[#141414] border-white/10 text-[#FFFFFF] shadow-2xl shadow-black/20',
    muted: isLight ? 'text-slate-600' : 'text-gray-300',
    subtle: isLight ? 'text-slate-500' : 'text-gray-400',
    gridStroke: isLight ? '#E2E8F0' : '#2A2A2A',
    axisStroke: isLight ? '#64748B' : '#A3A3A3',
    tooltipBg: isLight ? '#FFFFFF' : '#141414',
    tooltipBorder: isLight ? '#CBD5E1' : '#333333',
    primaryStroke: isLight ? '#0F172A' : '#FFFFFF',
    accent: '#F97316',
  };

  const fetchLogs = async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const logsQuery = query(
        collection(db, 'daily_logs'),
        where('userId', '==', user.uid),
      );
      const snap = await getDocs(logsQuery);
      const logsData = snap.docs
        .map((doc) => normalizeLog(doc.id, doc.data() as Partial<DailyLog>))
        .filter((log): log is DailyLog => Boolean(log))
        .sort((a, b) => a.date.localeCompare(b.date));

      setLogs(logsData);
    } catch (err) {
      console.error('Analytics daily_logs error:', err);
      setError('Analytics could not read your daily logs. Please confirm Firestore rules are deployed and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const byDate = new Map(logs.map((log) => [log.date, log]));

    return Array.from({ length: 14 }, (_, index) => {
      const date = subDays(new Date(), 13 - index);
      const dateKey = format(date, 'yyyy-MM-dd');
      const log = byDate.get(dateKey);

      return {
        dateKey,
        date: format(date, 'MMM d'),
        hours: log?.hoursStudied ?? 0,
        focus: log?.focusLevel ?? 0,
        logged: Boolean(log),
      };
    });
  }, [logs]);

  const summary = useMemo(() => {
    const last14Logs = chartData.filter((point) => point.logged);
    const totalHours = chartData.reduce((sum, point) => sum + point.hours, 0);
    const averageFocus = last14Logs.length
      ? last14Logs.reduce((sum, point) => sum + point.focus, 0) / last14Logs.length
      : 0;
    const consistency = Math.round((last14Logs.length / 14) * 100);
    const bestDay = [...chartData].sort((a, b) => b.hours - a.hours)[0];

    return {
      totalHours,
      averageFocus,
      consistency,
      loggedDays: last14Logs.length,
      bestDay,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className={cn('rounded-lg border p-8 sm:p-10 text-center', styles.card)}>
        <RefreshCw className="mx-auto mb-4 animate-spin text-orange-500" size={34} />
        <p className={cn('font-black uppercase tracking-[0.2em] text-xs', styles.muted)}>
          Processing analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <header className={cn('rounded-lg border p-5 sm:p-6 md:p-8 overflow-hidden', styles.hero)}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">Strategic Analytics</h1>
            <p className={cn('mt-2 font-medium', styles.muted)}>
              Real performance metrics from your daily study logs.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className={cn(
              'w-full sm:w-auto px-5 py-3 rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
              isLight
                ? 'bg-slate-950 text-[#FFFFFF] hover:bg-orange-500'
                : 'bg-slate-50 text-black hover:bg-orange-500 hover:text-[#FFFFFF]',
            )}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-200 flex items-start gap-3">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={cn('border rounded-lg p-5 sm:p-6 transition-transform hover:-translate-y-1', styles.card)}>
          <Clock className="mb-4 text-orange-500" size={26} />
          <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', styles.subtle)}>14-Day Hours</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight">{summary.totalHours.toFixed(1)}h</h3>
        </div>
        <div className={cn('border rounded-lg p-5 sm:p-6 transition-transform hover:-translate-y-1', styles.card)}>
          <Zap className="mb-4 text-orange-500" size={26} />
          <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', styles.subtle)}>Average Focus</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight">{summary.averageFocus.toFixed(1)}/10</h3>
        </div>
        <div className={cn('border rounded-lg p-5 sm:p-6 transition-transform hover:-translate-y-1', styles.card)}>
          <CalendarDays className="mb-4 text-orange-500" size={26} />
          <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', styles.subtle)}>Logged Days</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight">{summary.loggedDays}/14</h3>
        </div>
        <div className={cn('border rounded-lg p-5 sm:p-6 transition-transform hover:-translate-y-1', styles.card)}>
          <TrendingUp className="mb-4 text-orange-500" size={26} />
          <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', styles.subtle)}>Consistency</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight">{summary.consistency}%</h3>
        </div>
      </div>

      {logs.length === 0 && !error && (
        <div className={cn('rounded-lg border p-6 sm:p-8 text-center', styles.card)}>
          <BarChart3 className="mx-auto mb-4 text-orange-500" size={44} />
          <h2 className="text-2xl font-black uppercase tracking-tight">No Analytics Yet</h2>
          <p className={cn('mt-2 max-w-xl mx-auto text-sm', styles.muted)}>
            Log study activity from the dashboard and this page will automatically turn it into trends.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className={cn('border p-4 sm:p-6 md:p-8 rounded-lg space-y-5 sm:space-y-6 overflow-hidden', styles.card)}>
          <h3 className={cn('text-xs font-black uppercase tracking-widest flex items-center gap-2', styles.subtle)}>
            <Clock size={14} /> Study Intensity (Last 14 Days)
          </h3>
          <div className="h-[260px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={styles.primaryStroke} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={styles.primaryStroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} vertical={false} />
                <XAxis dataKey="date" stroke={styles.axisStroke} fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke={styles.axisStroke} fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: styles.tooltipBg, border: `1px solid ${styles.tooltipBorder}`, borderRadius: '14px', color: isLight ? '#0F172A' : '#FFFFFF' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="hours" stroke={styles.primaryStroke} strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn('border p-4 sm:p-6 md:p-8 rounded-lg space-y-5 sm:space-y-6 overflow-hidden', styles.card)}>
          <h3 className={cn('text-xs font-black uppercase tracking-widest flex items-center gap-2', styles.subtle)}>
            <Zap size={14} /> Cognitive Focus (Last 14 Days)
          </h3>
          <div className="h-[260px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} vertical={false} />
                <XAxis dataKey="date" stroke={styles.axisStroke} fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke={styles.axisStroke} fontSize={11} fontWeight="bold" domain={[0, 10]} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: styles.tooltipBg, border: `1px solid ${styles.tooltipBorder}`, borderRadius: '14px', color: isLight ? '#0F172A' : '#FFFFFF' }}
                  cursor={{ fill: styles.accent, opacity: 0.08 }}
                />
                <Bar dataKey="focus" fill={styles.accent} radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className={cn('border rounded-lg p-5 sm:p-8 md:p-10', styles.card)}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-orange-500 text-[#FFFFFF] rounded-lg">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Performance Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className={cn('text-[10px] uppercase font-black tracking-[0.2em] mb-2', styles.subtle)}>Primary Trend</p>
            <p className={cn('text-sm font-medium leading-relaxed', styles.muted)}>
              Your strongest day in this window is <span className="font-black">{summary.bestDay?.date ?? 'not available'}</span> with <span className="font-black">{(summary.bestDay?.hours ?? 0).toFixed(1)} hours</span>.
            </p>
          </div>
          <div>
            <p className={cn('text-[10px] uppercase font-black tracking-[0.2em] mb-2', styles.subtle)}>Consistency Index</p>
            <p className={cn('text-sm font-medium leading-relaxed', styles.muted)}>
              You logged activity on <span className="font-black">{summary.loggedDays}</span> of the last 14 days. Keep the loop alive to make the charts sharper.
            </p>
          </div>
          <div>
            <p className={cn('text-[10px] uppercase font-black tracking-[0.2em] mb-2', styles.subtle)}>Advice</p>
            <p className={cn('text-sm font-medium leading-relaxed italic', styles.muted)}>
              {summary.loggedDays === 0
                ? 'Start with one daily log. The analytics engine needs a signal before it can spot patterns.'
                : 'Aim for small daily consistency first, then increase study intensity once the habit is stable.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
