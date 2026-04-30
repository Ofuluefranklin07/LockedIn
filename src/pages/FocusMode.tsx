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
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.05, 0.1, 0.05] : 0.05
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={cn(
            "w-[500px] h-[500px] rounded-full blur-[100px]",
            sessionType === 'work' ? "bg-white" : "bg-green-500"
          )}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-colors",
            sessionType === 'work' ? "bg-white text-black border-white" : "bg-green-500 text-black border-green-500"
          )}>
            {sessionType === 'work' ? <Zap size={14} fill="currentColor" /> : <Coffee size={14} />}
            {sessionType === 'work' ? 'Lock In Mode' : 'Refuel Phase'}
          </div>
        </div>

        <div className="relative mb-16 px-4">
          <h1 className="text-[120px] md:text-[180px] font-black font-mono leading-none tracking-tighter tabular-nums select-none italic">
            {formatTime(timeLeft)}
          </h1>
          
          <div className="absolute left-0 right-0 -bottom-4 px-12 md:px-24">
            <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full transition-colors",
                  sessionType === 'work' ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                )} 
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={resetTimer}
            className="p-5 rounded-3xl bg-[#141414] border border-[#262626] text-gray-500 hover:text-white hover:border-white transition-all active:scale-95"
          >
            <RotateCcw size={28} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={cn(
              "w-24 h-24 rounded-[40px] flex items-center justify-center transition-all shadow-2xl active:scale-90",
              isActive 
                ? "bg-[#141414] border-2 border-white text-white hover:bg-white hover:text-black" 
                : "bg-white text-black hover:bg-gray-200"
            )}
          >
            {isActive ? <Pause size={40} fill="currentColor" strokeWidth={0} /> : <Play size={40} fill="currentColor" strokeWidth={0} className="ml-2" />}
          </button>

          <button className="p-5 rounded-3xl bg-[#141414] border border-[#262626] text-gray-500 hover:text-white transition-all active:scale-95 cursor-not-allowed opacity-50">
            <Settings size={28} />
          </button>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-8 max-w-sm mx-auto">
          <div className="text-center group ring-1 ring-[#262626] p-6 rounded-3xl hover:ring-white transition-all">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400 w-fit mx-auto mb-2 group-hover:bg-white group-hover:text-black transition-all">
              <Target size={18} />
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Sessions Today</p>
            <h4 className="text-2xl font-black">{sessionsCompleted}</h4>
          </div>
          <div className="text-center group ring-1 ring-[#262626] p-6 rounded-3xl hover:ring-white transition-all">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400 w-fit mx-auto mb-2 group-hover:bg-white group-hover:text-black transition-all">
              <TimerIcon size={18} />
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Total Focus</p>
            <h4 className="text-2xl font-black">{Math.floor((sessionsCompleted * 25) / 60)}h { (sessionsCompleted * 25) % 60 }m</h4>
          </div>
        </div>
      </motion.div>

      {/* Aesthetic Accents */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none opacity-20">
        <p className="text-[150px] font-black uppercase italic leading-none whitespace-nowrap -rotate-90 select-none text-white/5">
          NO DISTRACTIONS
        </p>
      </div>
      <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none opacity-20">
        <p className="text-[150px] font-black uppercase italic leading-none whitespace-nowrap rotate-90 select-none text-white/5">
          STAY DISCIPLINED
        </p>
      </div>
    </div>
  );
}
