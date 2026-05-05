import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer as TimerIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Zap,
  Target,
  Bell,
  Coffee
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function FocusMode() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleSessionEnd();
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionEnd = () => {
    setIsActive(false);
    if (sessionType === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      setSessionType('break');
      setTimeLeft(5 * 60);
      alert("Work session finished! Take a 5 min break.");
    } else {
      setSessionType('work');
      setTimeLeft(25 * 60);
      alert("Break over! Get back in the zone.");
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(sessionType === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = sessionType === 'work' 
    ? (1 - timeLeft / (25 * 60)) * 100 
    : (1 - timeLeft / (5 * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ 
            scale: isActive ? [1, 1.1, 1] : 1,
            opacity: isActive ? [0.03, 0.08, 0.03] : 0.03
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={cn(
            "w-[800px] h-[800px] blur-[120px]",
            sessionType === 'work' ? "bg-white" : "bg-[#F97316]"
          )}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-2xl text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 border font-black uppercase tracking-[0.3em] text-[10px] transition-all italic",
            sessionType === 'work' ? "bg-white text-black border-white" : "bg-[#F97316] text-black border-[#F97316]"
          )}>
            {sessionType === 'work' ? <Zap size={16} fill="currentColor" /> : <Coffee size={16} />}
            {sessionType === 'work' ? 'SYSTEM LOCK-IN' : 'REFUEL DOWNTIME'}
          </div>
        </div>

        <div className="relative mb-16 md:mb-24 px-4 h-40 md:h-60 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.03] scale-150 md:scale-100">
            <span className="text-[120px] md:text-[200px] font-display font-black italic uppercase tracking-tighter">FOCUS</span>
          </div>
          
          <h1 className="text-[92px] sm:text-[128px] md:text-[168px] xl:text-[200px] font-display font-black leading-none tracking-tight tabular-nums select-none italic text-white drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)] relative z-10">
            {formatTime(timeLeft)}
          </h1>
          
          <div className="absolute left-0 right-0 -bottom-8 px-6 md:px-16">
            <div className="h-3 w-full bg-[#111] border border-[#222]/50 overflow-hidden">
              <motion.div 
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full relative",
                  sessionType === 'work' ? "bg-white" : "bg-[#F97316]"
                )} 
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 md:gap-10">
          <button 
            onClick={resetTimer}
            className="w-16 h-16 md:w-20 md:h-20 bg-[#0A0A0A] border border-[#222] text-[#444] hover:text-white hover:border-white transition-all active:scale-95 flex items-center justify-center"
          >
            <RotateCcw size={24} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={cn(
              "w-28 h-28 md:w-40 md:h-40 flex items-center justify-center transition-all active:scale-90 border-2 rounded-full",
              isActive 
                ? "bg-transparent border-white text-white hover:bg-white hover:text-black" 
                : "bg-white border-white text-black hover:bg-[#DDD]"
            )}
          >
            {isActive ? <Pause size={48} className="md:size-16" fill="currentColor" strokeWidth={0} /> : <Play size={48} className="md:size-16 ml-2" fill="currentColor" strokeWidth={0} />}
          </button>
          
       
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-xl mx-auto px-4">
          <div className="text-center group border border-[#222] p-8 md:p-10 bg-[#0A0A0A] relative overflow-hidden flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#555] mb-4 italic font-black">Cycles Logged</p>
            <h4 className="text-5xl md:text-6xl font-display font-black italic uppercase tracking-tighter">{sessionsCompleted}</h4>
            <div className="absolute -bottom-4 -left-4 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <Target size={80} />
            </div>
          </div>
          <div className="text-center group border border-[#222] p-8 md:p-10 bg-[#0A0A0A] relative overflow-hidden flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#555] mb-4 italic font-black">Focus Duration</p>
            <h4 className="text-3xl md:text-4xl font-display font-black italic uppercase tracking-tighter tabular-nums">
              {Math.floor((sessionsCompleted * 25) / 60)}H {(sessionsCompleted * 25) % 60}M
            </h4>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <TimerIcon size={80} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Aesthetic Accents */}
      <div className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none opacity-10">
        <p className="text-[180px] font-black uppercase italic leading-none whitespace-nowrap -rotate-90 select-none text-white/5 tracking-tighter">
          COGNITIVE LOCK
        </p>
      </div>
      <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none opacity-10">
        <p className="text-[180px] font-black uppercase italic leading-none whitespace-nowrap rotate-90 select-none text-white/5 tracking-tighter">
          PEAK EFFICIENCY
        </p>
      </div>
    </div>
  );
}
