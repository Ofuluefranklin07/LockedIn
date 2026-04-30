import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Goal, Task } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, ArrowLeft, Calendar, Flag, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchGoalDetails();
    }
  }, [id]);

  const fetchGoalDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const gDoc = await getDoc(doc(db, 'goals', id));
      if (!gDoc.exists()) {
        navigate('/goals');
        return;
      }
      setGoal({ id: gDoc.id, ...gDoc.data() } as Goal);

      const tQuery = query(
        collection(db, `goals/${id}/tasks`),
        orderBy('createdAt', 'asc')
      );
      const tSnap = await getDocs(tQuery);
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `goals/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;

    try {
      await addDoc(collection(db, `goals/${id}/tasks`), {
        goalId: id,
        title: newTaskTitle,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setNewTaskTitle('');
      fetchGoalDetails();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `goals/${id}/tasks`);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `goals/${id}/tasks`, taskId), {
        completed: !currentStatus
      });
      fetchGoalDetails();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `goals/${id}/tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, `goals/${id}/tasks`, taskId));
      fetchGoalDetails();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${id}/tasks/${taskId}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 italic">Accessing objective data...</div>;
  }

  if (!goal) return null;

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <button 
        onClick={() => navigate('/goals')}
        className="flex items-center gap-2 text-[#444] hover:text-white transition-colors group mb-8"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-mono uppercase tracking-[0.3em] text-[10px]">Return to Tactical Hub</span>
      </button>

      <header className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-[10px] uppercase font-mono tracking-widest px-3 py-1 border font-black",
                goal.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                goal.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {goal.priority} PRIORITY
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-3 py-1 bg-[#222] text-gray-400 border border-[#333] font-black">
                {goal.category}
              </span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none">{goal.title}</h1>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-gray-500 mb-2 italic">Operation Completion</p>
              <h3 className="text-6xl font-black font-mono tracking-tighter">{progress}%</h3>
            </div>
          </div>
        </div>

        <div className="h-4 w-full bg-[#111] border border-[#222] overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-white relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A0A0A] border border-[#222] p-8 flex items-center gap-6">
            <div className="p-3 bg-[#111] border border-[#222] text-white">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-gray-500 italic mb-1">Terminal Date</p>
              <p className="font-black text-xl tracking-tight italic uppercase">{formatDate(goal.deadline)}</p>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-[#222] p-8 flex items-center gap-6">
            <div className="p-3 bg-[#111] border border-[#222] text-white">
              <Flag size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-gray-500 italic mb-1">Milestone Status</p>
              <p className="font-black text-xl tracking-tight italic uppercase">{tasks.filter(t => t.completed).length} / {tasks.length} LOCKED IN</p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-10">
        <div className="flex items-center justify-between border-b border-[#222] pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Tactical Sub-Tasks</h2>
        </div>

        <form onSubmit={addTask} className="flex gap-4">
          <input
            type="text"
            required
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="NEW TASK DEFINITION..."
            className="flex-1 bg-[#0A0A0A] border border-[#222] px-8 py-5 focus:outline-none focus:border-white transition-all text-xl font-black italic tracking-tighter"
          />
          <button 
            type="submit"
            className="bg-white text-black px-10 py-5 font-black flex items-center gap-2 hover:bg-[#DDD] transition-all uppercase tracking-widest italic text-sm"
          >
            <Plus size={20} /> Add
          </button>
        </form>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center justify-between p-8 border transition-all group",
                task.completed 
                  ? "bg-[#050505] border-[#222] opacity-40" 
                  : "bg-[#0A0A0A] border-[#222] hover:border-[#444]"
              )}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={cn(
                    "w-10 h-10 transition-all border flex items-center justify-center",
                    task.completed 
                      ? "bg-white border-white text-black" 
                      : "bg-[#111] border-[#333] hover:border-white"
                  )}
                >
                  {task.completed ? <CheckCircle2 size={24} strokeWidth={3} /> : <Circle size={24} className="text-[#333] group-hover:text-white" />}
                </button>
                <span className={cn(
                  "font-black transition-all text-3xl uppercase italic tracking-tighter",
                  task.completed ? "line-through text-gray-500" : "text-white"
                )}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-500 transition-all p-2"
              >
                <Trash2 size={24} />
              </button>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="py-24 border border-[#222] border-dashed text-center">
              <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-xs italic">No Active Milestones Defined</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
