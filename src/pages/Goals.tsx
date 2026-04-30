import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Goal, GoalCategory, PriorityLevel } from '../types';
import { Plus, Target, Calendar, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('academic');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const q = query(
        collection(db, 'goals'), 
        where('userId', '==', user?.uid)
      );
      const snap = await getDocs(q);
      const fetchedGoals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
      setGoals(fetchedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.uid,
        title,
        category,
        deadline,
        priority,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      resetForm();
      fetchGoals();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'goals');
    }
  };

  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteDoc(doc(db, 'goals', id));
      fetchGoals();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${id}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('academic');
    setDeadline('');
    setPriority('medium');
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 italic">Preparing goals...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Objectives</h1>
          <p className="text-gray-400 text-sm mt-1">Define what you're locking in for.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-8 py-3 font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:bg-[#DDD] transition-all italic"
        >
          <Plus size={20} /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <Link 
            key={goal.id} 
            to={`/goals/${goal.id}`}
            className="group block bg-[#0A0A0A] border border-[#222] p-10 hover:border-white transition-all relative overflow-hidden"
          >
            <div className="flex justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] uppercase font-mono tracking-widest px-2 py-0.5",
                  goal.priority === 'high' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                  goal.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                  "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                )}>
                  {goal.priority}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-[#222] text-gray-400">
                  {goal.category}
                </span>
              </div>
              <button 
                onClick={(e) => handleDeleteGoal(goal.id, e)}
                className="text-[#333] hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <h3 className="text-3xl font-black mb-6 group-hover:text-white uppercase italic tracking-tighter leading-none">{goal.title}</h3>
            
            <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" /> Deadline: {formatDate(goal.deadline)}
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 pointer-events-none opacity-[0.03]">
              <Target size={120} />
            </div>
          </Link>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full py-32 bg-[#0A0A0A] border border-[#222] border-dashed text-center">
            <Target size={64} className="mx-auto text-[#222] mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-sm italic">Clearance Required: No Active Objectives</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-white">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-xl bg-[#050505] border border-[#222] p-12 relative"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">New Objective</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#444] hover:text-white transition-colors">
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Goal Definition</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#222] px-6 py-5 focus:outline-none focus:border-white transition-all text-2xl font-black italic tracking-tighter"
                    placeholder="FINISH THERMODYNAMICS..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Sector</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as GoalCategory)}
                      className="w-full bg-[#0A0A0A] border border-[#222] px-4 py-5 focus:outline-none focus:border-white uppercase text-xs font-black tracking-widest italic"
                    >
                      <option value="academic">Academic</option>
                      <option value="health">Health</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className="w-full bg-[#0A0A0A] border border-[#222] px-4 py-5 focus:outline-none focus:border-white uppercase text-xs font-black tracking-widest italic"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#888] italic">Terminal Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#222] px-6 py-5 focus:outline-none focus:border-white transition-all font-mono text-sm tracking-widest text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black font-black py-6 uppercase tracking-[0.3em] hover:bg-[#DDD] transition-all italic text-sm mt-4"
                >
                  Commit Objective
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
