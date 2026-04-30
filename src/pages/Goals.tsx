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
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
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
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200"
        >
          <Plus size={20} /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <Link 
            key={goal.id} 
            to={`/goals/${goal.id}`}
            className="group block bg-[#141414] border border-[#262626] p-6 rounded-2xl hover:border-white transition-all"
          >
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[10px] uppercase font-black px-2 py-0.5 rounded-md",
                  goal.priority === 'high' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                  goal.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                  "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                )}>
                  {goal.priority}
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-[#262626] text-gray-400 rounded-md">
                  {goal.category}
                </span>
              </div>
              <button 
                onClick={(e) => handleDeleteGoal(goal.id, e)}
                className="text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <h3 className="text-xl font-black mb-4 group-hover:text-white uppercase italic">{goal.title}</h3>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 font-bold tracking-wider uppercase">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" /> {formatDate(goal.deadline)}
              </div>
            </div>
          </Link>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full py-20 bg-[#141414] border border-[#262626] border-dashed rounded-3xl text-center">
            <Target size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500 font-medium italic">Your objective board is empty.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-[#262626] p-8 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight uppercase italic">New Objective</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Goal Description</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-5 py-4 focus:outline-none focus:border-white transition-all text-lg"
                    placeholder="Finish Thermodynamics course..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as GoalCategory)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-4 focus:outline-none focus:border-white uppercase text-xs font-bold"
                    >
                      <option value="academic">Academic</option>
                      <option value="health">Health</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-4 focus:outline-none focus:border-white uppercase text-xs font-bold"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-5 py-4 focus:outline-none focus:border-white transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                >
                  Deploy Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
