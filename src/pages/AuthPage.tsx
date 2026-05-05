import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AcademicLevel } from '../types';
import { Target, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ThemeToggle from '../components/ThemeToggle';

interface AuthPageProps {
  type: 'login' | 'signup';
}

export default function AuthPage({ type }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('undergraduate');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          academicLevel,
          fieldOfStudy,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 md:p-10 font-sans relative overflow-hidden">
      <ThemeToggle className="absolute right-6 top-6 z-20" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-[#0A0A0A] border border-[#222] relative z-10 overflow-hidden lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,560px)]"
      >
        <div className="hidden lg:flex min-h-[620px] flex-col justify-between border-r border-[#222] p-12 xl:p-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-black">
              <Target size={24} />
            </div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-tight">LockIn</h1>
          </div>
          <div>
            <p className="text-[#666] font-mono text-[10px] uppercase tracking-[0.14em] font-semibold mb-8">
              // DISCIPLINE OPERATING SYSTEM
            </p>
            <h2 className="text-[72px] xl:text-[88px] font-display font-bold uppercase tracking-tight leading-[0.88]">
              Stay<br />Locked<br />In
            </h2>
          </div>
          <p className="max-w-sm text-[#666] font-mono text-[10px] uppercase tracking-[0.14em] font-medium leading-relaxed opacity-70">
            Build goals, track focus sessions, and keep your study system in one place.
          </p>
        </div>

        <div className="p-8 md:p-12 xl:p-16">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-white flex items-center justify-center text-black">
                <Target size={24} />
              </div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-tight">LockIn</h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight break-words">
              {type === 'login' ? '// AUTHENTICATE_USER' : '// INITIALIZE_DISCIPLINE'}
            </h2>
            <p className="text-[#666] font-mono text-[10px] mt-4 uppercase tracking-[0.14em] font-medium leading-relaxed opacity-60">
              {type === 'login' 
                ? "Establish connection to previously authorized neural profile." 
                : "Register new operative for systematic cognitive optimization."}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'signup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Operator Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] px-4 py-3 focus:outline-none focus:border-white transition-all text-sm font-semibold uppercase"
                  placeholder="NAME_REQUIRED"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Email Identifier</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] px-4 py-3 focus:outline-none focus:border-white transition-all text-sm font-semibold uppercase"
                  placeholder="EMAIL@LOCKIN.DEV"
                />
              </div>
            </div>
          )}

          {type === 'login' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Email Identifier</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] px-4 py-4 focus:outline-none focus:border-white transition-all text-sm font-semibold uppercase"
                  placeholder="EMAIL@LOCKIN.DEV"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Access Cipher</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050505] border border-[#222] px-4 py-4 focus:outline-none focus:border-white transition-all text-sm font-semibold uppercase tracking-widest"
              placeholder="••••••••"
            />
          </div>

          {type === 'signup' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Academic Tier</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full bg-[#050505] border border-[#222] px-4 py-3 focus:outline-none focus:border-white transition-all text-xs font-semibold uppercase"
                  >
                    <option value="secondary school">Secondary School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] font-semibold">Operational Sector</label>
                  <input
                    type="text"
                    required
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full bg-[#050505] border border-[#222] px-4 py-3 focus:outline-none focus:border-white transition-all text-sm font-semibold uppercase"
                    placeholder="E.G. QUANTUM_PHYSICS"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-mono uppercase tracking-[0.15em] font-semibold">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-display font-bold py-5 uppercase tracking-[0.2em] hover:bg-[#DDD] transition-all disabled:opacity-50 mt-6 text-sm active:scale-[0.98]"
          >
            {loading ? 'SYNCING_DATA...' : type === 'login' ? 'ESTABLISH_LOCK' : 'INITIALIZE_DISCIPLINE'}
          </button>
        </form>

        <p className="mt-12 text-center text-[10px] font-mono uppercase tracking-[0.14em] text-[#444] font-semibold">
          {type === 'login' ? (
            <span className="flex flex-col md:flex-row items-center justify-center gap-2">
              No operative profile?
              <Link to="/signup" className="text-white hover:underline underline-offset-4 decoration-white/20 ml-1">Register Operative</Link>
            </span>
          ) : (
            <span className="flex flex-col md:flex-row items-center justify-center gap-2">
              Operative profile exists?
              <Link to="/login" className="text-white hover:underline underline-offset-4 decoration-white/20 ml-1">Re-authenticate</Link>
            </span>
          )}
        </p>

        {/* Decorative background text */}
        <div className="absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none select-none">
          <span className="text-[120px] font-display font-black italic uppercase tracking-tighter leading-none">LOCK</span>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
