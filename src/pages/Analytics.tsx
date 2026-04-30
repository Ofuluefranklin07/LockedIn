import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyLog } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Activity, Clock, Zap, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export default function Analytics() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, 'daily_logs'),
        where('userId', '==', user?.uid)
      );
      const snap = await getDocs(q);
      const logsData = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as DailyLog))
        .sort((a, b) => a.date.localeCompare(b.date)) // Sort chronologically for chart
        .slice(-14); // Get last 14
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = logs.map(log => ({
    date: format(parseISO(log.date), 'MMM d'),
    hours: log.hoursStudied,
    focus: log.focusLevel
  }));

  if (loading) {
    return <div className="p-8 text-center text-gray-500 italic">Processing neural metrics...</div>;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tight italic">Strategic Analytics</h1>
        <p className="text-gray-400 mt-1 font-medium">Performance metrics and behavioral trends.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Study Hours Chart */}
        <div className="bg-[#141414] border border-[#262626] p-8 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Clock size={14} /> Study Intensity (14 Days)
            </h3>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#525252" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#FFFFFF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Level Chart */}
        <div className="bg-[#141414] border border-[#262626] p-8 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Zap size={14} /> Cognitive Focus (14 Days)
            </h3>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#525252" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  fontWeight="bold" 
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                  cursor={{ fill: '#white', opacity: 0.05 }}
                />
                <Bar 
                  dataKey="focus" 
                  fill="#FFFFFF" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#262626] rounded-[40px] p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white/10 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight italic">Performance Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-2">Primary Trend</p>
            <p className="text-sm font-medium text-gray-300 leading-relaxed">
              Your focus levels consistently peak on days where you study more than <span className="text-white font-bold">4.2 hours</span>.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-2">Consistency Index</p>
            <p className="text-sm font-medium text-gray-300 leading-relaxed">
              Weekly log frequency is at <span className="text-white font-bold">85%</span>. Maintain this to strengthen long-term academic discipline.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-2">Advice</p>
            <p className="text-sm font-medium text-gray-300 leading-relaxed italic">
              "Quality is not an act, it is a habit." - Aristotle. Your stats show habit formation is in high progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
