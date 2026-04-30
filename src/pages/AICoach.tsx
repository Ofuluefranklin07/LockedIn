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
import { DailyLog, Goal } from '../types';
import { getAICoachFeedback } from '../services/geminiService';
import { Brain, Cpu, Sparkles, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function AICoach() {
  const { profile, user } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFeedback = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch relevant data for AI analysis
      const logsSnap = await getDocs(query(
        collection(db, 'daily_logs'),
        where('userId', '==', user.uid)
      ));
      const goalsSnap = await getDocs(query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      ));

      const logs = logsSnap.docs
        .map(d => d.data() as DailyLog)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14);
      const goals = goalsSnap.docs.map(d => d.data() as Goal);

      const result = await getAICoachFeedback(profile, logs, goals);
      setFeedback(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate AI insights. Ensure your GEMINI_API_KEY is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feedback && user) {
      generateFeedback();
    }
  }, [user]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2 italic">Neural Advisor</h1>
          <p className="text-gray-400 font-medium">AI-powered performance analysis and discipline coaching.</p>
        </div>
        <button 
          onClick={generateFeedback}
          disabled={loading}
          className="bg-white text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} fill="currentColor" />}
          Regenerate Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white mb-4">
              <Cpu size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Analysis Engine</h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">Using Gemini-3-Flash to correlate your study hours, focus levels, and goal progress into actionable discipline strategies.</p>
          </div>
          
          <div className="bg-[#141414] border border-[#262626] p-6 rounded-3xl">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white mb-4">
              <Brain size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Cognitive Load</h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium italic">"Discipline is doing what needs to be done, even if you don't feel like doing it."</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#262626] rounded-[40px] p-8 md:p-12 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
              <Sparkles size={160} fill="currentColor" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gray-500 font-black uppercase tracking-[0.2em] italic text-sm">Synthesizing Data...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Analysis Interrupted</h3>
                <p className="text-gray-500 max-w-sm mx-auto">{error}</p>
              </div>
            ) : feedback ? (
              <div className="markdown-body prose prose-invert prose-white max-w-none">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={48} className="text-gray-700 mb-4" />
                <h3 className="text-xl font-bold text-gray-500 mb-2 uppercase tracking-widest italic">No Data to Analyze</h3>
                <p className="text-gray-600 max-w-sm mx-auto">Start logging your study hours and focus levels to receive personalized coaching from the AI Advisor.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
