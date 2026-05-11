import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyLog, Goal } from '../types';
import {
  AcademicChatMessage,
  getAcademicChatReply,
  getAICoachFeedbackResult,
} from '../services/geminiService';
import {
  AlertCircle,
  Brain,
  Cpu,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

const starterQuestions = [
  'Help me make a study plan for this week.',
  'Explain active recall in simple terms.',
  'How do I prepare better for exams?',
];

export default function AICoach() {
  const { profile, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AcademicChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask me anything academic: difficult concepts, assignments, exam prep, study plans, notes, or how to stay consistent.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const page = {
    hero: isLight
      ? 'border-orange-200 bg-gradient-to-br from-orange-50 via-[#FFFFFF] to-blue-50 text-slate-950 shadow-xl shadow-orange-100/70'
      : 'border-white/10 bg-gradient-to-br from-[#1F1F1F] via-[#151515] to-[#0B0B0B] text-[#FFFFFF] shadow-2xl shadow-black/30',
    card: isLight
      ? 'bg-[#FFFFFF] border-slate-200 text-slate-950 shadow-xl shadow-slate-200/70'
      : 'bg-[#1D1D1D] border-white/10 text-[#FFFFFF] shadow-xl shadow-black/20',
    panel: isLight
      ? 'bg-[#FFFFFF] border-slate-200 text-slate-950 shadow-xl shadow-slate-200/70'
      : 'bg-[#1A1A1A] border-white/10 text-[#FFFFFF] shadow-2xl shadow-black/25',
    chatHeader: isLight
      ? 'border-slate-200 bg-gradient-to-r from-orange-50 via-[#FFFFFF] to-blue-50'
      : 'border-white/10 bg-gradient-to-r from-[#242424] via-[#1A1A1A] to-[#101010]',
    chatBody: isLight ? 'bg-slate-50' : 'bg-[#111111]',
    chatFooter: isLight ? 'border-slate-200 bg-[#FFFFFF]' : 'border-white/10 bg-[#202020]',
    muted: isLight ? 'text-slate-600' : 'text-gray-300',
    subtle: isLight ? 'text-slate-500' : 'text-gray-400',
    assistantBubble: isLight
      ? 'bg-[#FFFFFF] border-slate-200 text-slate-900 shadow-md shadow-slate-200/80'
      : 'bg-[#252525] border-white/10 text-gray-100 shadow-lg shadow-black/20',
    userBubble: isLight
      ? 'bg-slate-950 text-[#FFFFFF] shadow-md shadow-slate-300/80'
      : 'bg-slate-50 text-black shadow-lg shadow-white/5',
    input: isLight
      ? 'bg-[#FFFFFF] border-slate-300 text-slate-950 placeholder:text-slate-400'
      : 'bg-[#F7F7F7] border-white/20 text-black placeholder:text-gray-500',
    quickButton: isLight
      ? 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-500 hover:text-[#FFFFFF] hover:border-orange-500'
      : 'border-white/15 bg-white/5 text-gray-200 hover:bg-[#FFFFFF] hover:text-black hover:border-white',
  };

  const generateFeedback = async () => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      const logsSnap = await getDocs(query(
        collection(db, 'daily_logs'),
        where('userId', '==', user.uid),
      ));
      const goalsSnap = await getDocs(query(
        collection(db, 'goals'),
        where('userId', '==', user.uid),
      ));

      const logs = logsSnap.docs
        .map((d) => d.data() as DailyLog)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14);
      const goals = goalsSnap.docs.map((d) => d.data() as Goal);

      const result = await getAICoachFeedbackResult(profile, logs, goals);

      if (result.ok) {
        setFeedback(result.text);
      } else {
        setFeedback(null);
        setError(result.text);
      }
    } catch (err) {
      console.error(err);
      setFeedback(null);
      setError('Insights are temporarily unavailable. You can still use the academic chat below while we reconnect the analysis engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feedback && user) {
      generateFeedback();
    }
  }, [user]);

  const askAcademicCoach = async (questionOverride?: string) => {
    const question = (questionOverride ?? chatInput).trim();
    if (!question || chatLoading) return;

    const nextMessages: AcademicChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: question },
    ];

    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const reply = await getAcademicChatReply(question, profile, chatMessages);
      setChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: reply || 'I could not answer that yet. Try asking it another way.',
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Something interrupted the chat. Please check your API key and try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await askAcademicCoach();
  };

  return (
    <div className="space-y-10">
      <header className={cn('flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[36px] border p-6 md:p-8', page.hero)}>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2 italic">Neural Advisor</h1>
          <p className={cn('font-medium', page.muted)}>
            AI-powered performance analysis, academic chat, and discipline coaching.
          </p>
        </div>
        <button
          onClick={generateFeedback}
          disabled={loading}
          className={cn(
            'px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50',
            isLight
              ? 'bg-slate-950 text-[#FFFFFF] hover:bg-orange-500 shadow-lg shadow-slate-300/80'
              : 'bg-slate-50 text-black hover:bg-orange-500 hover:text-[#FFFFFF] shadow-lg shadow-white/5',
          )}
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} fill="currentColor" />}
          Regenerate Insights
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className={cn('border p-6 rounded-3xl', page.card)}>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', isLight ? 'bg-slate-950 text-[#FFFFFF]' : 'bg-slate-50 text-black')}>
              <Cpu size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Analysis Engine</h4>
            <p className={cn('text-sm leading-relaxed font-medium', page.muted)}>
              Reviews your study history, focus patterns, and active goals to surface practical coaching insights.
            </p>
          </div>

          <div className={cn('border p-6 rounded-3xl', page.card)}>
            <div className="w-12 h-12 bg-orange-500 text-[#FFFFFF] rounded-xl flex items-center justify-center mb-4">
              <Brain size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Academic Chat</h4>
            <p className={cn('text-sm leading-relaxed font-medium', page.muted)}>
              Ask questions about schoolwork, concepts, exams, research, and study systems.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('border rounded-[40px] p-8 md:p-12 relative overflow-hidden group min-h-[280px]', page.panel)}
          >
            <div className={cn('absolute top-0 right-0 p-8 transition-colors pointer-events-none', isLight ? 'text-orange-200 group-hover:text-orange-300' : 'text-white/10 group-hover:text-orange-500/20')}>
              <Sparkles size={160} fill="currentColor" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className={cn('font-black uppercase tracking-[0.2em] italic text-sm', page.muted)}>
                  Synthesizing Data...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                <AlertCircle size={48} className="text-orange-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Insights Temporarily Unavailable</h3>
                <div className={cn(
                  'markdown-body prose max-w-xl mx-auto',
                  isLight
                    ? 'prose-slate prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-950 prose-headings:text-slate-950'
                    : 'prose-invert prose-white prose-p:text-gray-200 prose-li:text-gray-200 prose-strong:text-white',
                )}>
                  <ReactMarkdown>{error}</ReactMarkdown>
                </div>
                <p className={cn('mt-5 text-sm font-medium', page.subtle)}>
                  The academic chat below can still answer questions while insights recover.
                </p>
              </div>
            ) : feedback ? (
              <div className={cn(
                'markdown-body prose max-w-none relative z-10',
                isLight
                  ? 'prose-slate prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-950 prose-headings:text-slate-950'
                  : 'prose-invert prose-white text-gray-100 prose-p:text-gray-200 prose-li:text-gray-200 prose-strong:text-white prose-headings:text-white',
              )}>
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={48} className={cn('mb-4', page.subtle)} />
                <h3 className="text-xl font-bold mb-2 uppercase tracking-widest italic">No Data to Analyze</h3>
                <p className={cn('max-w-sm mx-auto', page.subtle)}>
                  Start logging your study hours and focus levels to receive personalized coaching.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn('border rounded-[40px] overflow-hidden', page.panel)}
      >
        <div className={cn('p-6 md:p-8 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-5', page.chatHeader)}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-[#FFFFFF] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">Ask The Coach</h2>
            </div>
            <p className={cn('text-sm font-medium max-w-2xl', page.muted)}>
              Chat with the AI about academics, assignments, study systems, exams, and difficult concepts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => askAcademicCoach(question)}
                disabled={chatLoading}
                className={cn('px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all', page.quickButton)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('p-4 md:p-6 space-y-4 max-h-[520px] overflow-y-auto', page.chatBody)}>
          {chatMessages.map((message, index) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={`${message.role}-${index}`}
                className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-orange-500 text-[#FFFFFF] border border-orange-400 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10">
                    <Brain size={18} />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[88%] md:max-w-[72%] rounded-[28px] px-5 py-4 text-sm leading-relaxed',
                    isUser ? 'rounded-tr-md' : 'border rounded-tl-md',
                    isUser ? page.userBubble : page.assistantBubble,
                  )}
                >
                  {isUser ? (
                    <p className="font-semibold">{message.content}</p>
                  ) : (
                    <div className={cn(
                      'markdown-body prose max-w-none prose-p:my-2 prose-li:my-1',
                      isLight
                        ? 'prose-slate prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-950 prose-headings:text-slate-950'
                        : 'prose-invert prose-white prose-p:text-gray-100 prose-li:text-gray-100 prose-strong:text-white',
                    )}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0', isLight ? 'bg-slate-950 text-[#FFFFFF]' : 'bg-slate-50 text-black')}>
                    <UserRound size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {chatLoading && (
            <div className={cn('flex items-center gap-3 pl-12', page.muted)}>
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest italic">Coach is thinking...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleChatSubmit} className={cn('p-4 md:p-6 border-t', page.chatFooter)}>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleChatSubmit(event);
                }
              }}
              placeholder="Ask about a topic, assignment, exam strategy, or study plan..."
              className={cn('min-h-[56px] max-h-40 flex-1 resize-y border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-colors', page.input)}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className={cn(
                'sm:w-36 h-14 rounded-2xl bg-orange-500 text-[#FFFFFF] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20',
                isLight ? 'hover:bg-slate-950' : 'hover:bg-slate-50 hover:text-black',
              )}
            >
              {chatLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              Send
            </button>
          </div>
          <p className={cn('mt-3 text-[10px] uppercase tracking-[0.2em] font-black', page.subtle)}>
            Press Enter to send. Use Shift + Enter for a new line.
          </p>
        </form>
      </motion.section>
    </div>
  );
}
