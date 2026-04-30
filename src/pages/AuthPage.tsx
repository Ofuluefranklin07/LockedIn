import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AcademicLevel } from '../types';
import { Target, Lock, Mail, User as UserIcon, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 text-[#0A0A0A]">
              <Target size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">LockIn</h1>
            <p className="text-gray-400 text-sm mt-1">
              {type === 'login' ? 'Continue your journey' : 'Start your discipline journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon size={12} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Lock size={12} /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            {type === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap size={12} /> Academic Level
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors appearance-none"
                  >
                    <option value="secondary school">Secondary School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={12} /> Field of Study
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : type === 'login' ? 'Lock In' : 'Join the Discipline'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            {type === 'login' ? (
              <>
                New here?{' '}
                <Link to="/signup" className="text-white hover:underline">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-white hover:underline">Log in here</Link>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
