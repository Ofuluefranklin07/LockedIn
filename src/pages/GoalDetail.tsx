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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <button 
        onClick={() => navigate('/goals')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-4"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-xs">Back to all goals</span>
      </button>

      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-[10px] uppercase font-black px-3 py-1 rounded-lg border",
                goal.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                goal.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {goal.priority} Priority
              </span>
              <span className="text-[10px] uppercase font-black px-3 py-1 bg-[#141414] text-gray-400 border border-[#262626] rounded-lg">
                {goal.category}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight uppercase italic">{goal.title}</h1>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Completion Progress</p>
              <h3 className="text-4xl font-black font-mono">{progress}%</h3>
            </div>
          </div>
        </div>

        <div className="h-1.5 w-full bg-[#141414] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Deadline</p>
              <p className="font-bold">{formatDate(goal.deadline)}</p>
            </div>
          </div>
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400">
              <Flag size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Milestones</p>
              <p className="font-bold">{tasks.filter(t => t.completed).length} / {tasks.length} Completed</p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight italic">Tactical Tasks</h2>
        </div>

        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            required
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new sub-task..."
            className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-5 py-3 focus:outline-none focus:border-white transition-all"
          />
          <button 
            type="submit"
            className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg"
          >
            <Plus size={20} /> Add
          </button>
        </form>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center justify-between p-5 rounded-2xl border transition-all group",
                task.completed 
                  ? "bg-[#141414]/50 border-transparent opacity-60" 
                  : "bg-[#141414] border-[#262626] hover:border-gray-500"
              )}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={cn(
                    "w-6 h-6 rounded-lg transition-colors border",
                    task.completed 
                      ? "bg-white border-white text-black flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                      : "border-[#262626] hover:border-white"
                  )}
                >
                  {task.completed && <CheckCircle2 size={16} strokeWidth={3} />}
                </button>
                <span className={cn(
                  "font-medium transition-all text-lg",
                  task.completed ? "line-through text-gray-500 italic" : "text-gray-200"
                )}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="py-12 border border-[#262626] border-dashed rounded-3xl text-center">
              <p className="text-gray-600 font-medium italic">Break this objective into actionable tasks.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
