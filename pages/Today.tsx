
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, CheckCircle2, ListTodo, Sun, Moon, Coffee, Edit3, Target, Sunrise, Calendar as CalendarIcon, Sparkles, ArrowRight, DollarSign, Droplets, Wind, Focus, Zap, CheckSquare 
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';
import { useMeals } from '../context/MealContext';
import { getFormattedDate, getTodayKey } from '../utils/dateUtils';
import { ProgressRing } from '../components/ProgressRing';
import { HabitCard } from '../components/HabitCard';
import { TaskCard } from '../components/TaskCard';
import { HabitForm } from '../components/HabitForm';
import { TaskForm } from '../components/TaskForm';
import { TaskDetail } from '../components/TaskDetail';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Task, LanguageCode } from '../types';
import { getTranslation } from '../utils/translations';

const Today: React.FC = () => {
  const { habits, toggleHabit, addHabit } = useHabits();
  const { tasks, toggleTask, deleteTask, addTask, toggleSubtask, updateTask } = useTasks();
  const { settings, updateSettings } = useSettings();
  const { accounts, transactions, getFormattedCurrency } = useFinance();
  const { mealPlans } = useMeals();
  
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [activeModal, setActiveModal] = useState<'habit' | 'task' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const dateStr = getFormattedDate();
  const todayKey = getTodayKey();
  const currentHour = new Date().getHours();

  // Dynamic Greeting
  let greeting = t.today.morning;
  let GreetingIcon = Sunrise;
  let greetingSub = "Ready to conquer the day?";
  
  if (currentHour >= 12 && currentHour < 18) {
    greeting = t.today.afternoon;
    GreetingIcon = Sun;
    greetingSub = "Keep the momentum going.";
  } else if (currentHour >= 18) {
    greeting = t.today.evening;
    GreetingIcon = Moon;
    greetingSub = "Time to wind down and reflect.";
  }

  // --- Data Calculations ---
  const todaysHabits = useMemo(() => {
    const dayIndex = new Date().getDay();
    return habits.filter(h => !h.archived && h.frequency.days.includes(dayIndex));
  }, [habits]);

  const todaysTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate === todayKey && !t.completed)
      .sort((a, b) => {
         const pMap = { high: 3, medium: 2, low: 1 };
         return pMap[b.priority] - pMap[a.priority];
      });
  }, [tasks, todayKey]);

  const { topPriorityTasks, upNextTasks } = useMemo(() => {
    const topPriorityTasks = todaysTasks.filter(t => t.priority === 'high');
    const upNextTasks = todaysTasks.filter(t => t.priority !== 'high');
    return { topPriorityTasks, upNextTasks };
  }, [todaysTasks]);

  // Finance Widget Data
  const dailySpend = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(tx => tx.date === today && tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  // Progress Calculation
  const totalHabits = todaysHabits.length;
  const completedHabits = todaysHabits.filter(h => h.completedDates.includes(todayKey)).length;
  const habitProgress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  const totalTasks = tasks.filter(t => t.dueDate === todayKey).length;
  const completedTasks = tasks.filter(t => t.dueDate === todayKey && t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleHabitSave = async (data: any) => {
    await addHabit(data);
    setActiveModal(null);
  };

  const handleTaskSave = async (data: any) => {
    if (editingTask) {
        await updateTask(editingTask.id, data);
        setEditingTask(null);
    } else {
        await addTask(data);
    }
    setActiveModal(null);
  };

  const executeDeleteTask = async (id: string) => {
    await deleteTask(id);
    if (selectedTask?.id === id) setSelectedTask(null);
    if (editingTask?.id === id) {
        setEditingTask(null);
        setActiveModal(null);
    }
  };

  const confirmDeleteTask = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      onConfirm: () => executeDeleteTask(id),
    });
  };

  // Texture Class
  const boxClass = "bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] overflow-hidden hover:shadow-md transition-shadow duration-300";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-1">
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-min">
        
        {/* 1. Main Greeting Card */}
        <div 
           className="md:col-span-12 bg-primary-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px] transition-all duration-700 group"
           style={{
             background: `linear-gradient(135deg, var(--color-primary-600) 0%, rgba(var(--color-primary-rgb), 0.7) 100%)`,
             boxShadow: `0 25px 60px -15px rgba(var(--color-primary-rgb), 0.4), inset 0 2px 20px rgba(255,255,255,0.15)`
           }}
        >
           {/* Animated Background Layers for Glow */}
           <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_12s_infinite_linear] pointer-events-none" />
           <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[110px] pointer-events-none mix-blend-soft-light group-hover:scale-110 transition-transform duration-1000" />
           <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-[90px] pointer-events-none opacity-60" />
           
           <div className="relative z-10 flex justify-between items-start">
              <div className="animate-in slide-in-from-left duration-700">
                 <div className="flex items-center gap-2 text-primary-50 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-4 bg-white/15 w-fit px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/20 shadow-lg">
                    <CalendarIcon size={12} className="text-white" /> {dateStr}
                 </div>
                 <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3 leading-none drop-shadow-lg scale-in-center">{greeting},</h1>
                 <p className="text-primary-50 text-lg md:text-xl opacity-90 font-medium tracking-tight max-w-sm">{greetingSub}</p>
              </div>
              <div className="hidden sm:flex bg-white/20 backdrop-blur-2xl border border-white/40 p-4 rounded-3xl shadow-2xl hover:rotate-12 hover:scale-110 transition-all duration-500 animate-in zoom-in duration-1000">
                 <GreetingIcon size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {/* Quick Stats with subtle glow bars */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group/stat hover:-translate-y-1 shadow-lg">
                 <p className="text-[10px] uppercase font-black text-primary-100 mb-2 tracking-widest opacity-80">Tasks Done</p>
                 <div className="text-2xl font-black tracking-tighter">{completedTasks}<span className="text-sm opacity-50 ml-1">/{totalTasks}</span></div>
                 <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden shadow-inner">
                    <div className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_white]" style={{width: `${taskProgress}%`}} />
                 </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group/stat hover:-translate-y-1 shadow-lg">
                 <p className="text-[10px] uppercase font-black text-primary-100 mb-2 tracking-widest opacity-80">Habit Streak</p>
                 <div className="text-2xl font-black tracking-tighter">{completedHabits}<span className="text-sm opacity-50 ml-1">/{totalHabits}</span></div>
                 <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.8)]" style={{width: `${habitProgress}%`}} />
                 </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group/stat hover:-translate-y-1 shadow-lg overflow-hidden">
                 <p className="text-[10px] uppercase font-black text-primary-100 mb-2 tracking-widest opacity-80">Daily Spend</p>
                 <div className="text-xl font-black truncate drop-shadow-sm" title={getFormattedCurrency(dailySpend)}>{getFormattedCurrency(dailySpend)}</div>
                 <div className="mt-3 text-[10px] text-white/70 font-black italic uppercase tracking-tighter">Stay Disciplined</div>
              </div>
           </div>
        </div>

        {/* 2. Priority Tasks (Span 7) */}
        <div className={`md:col-span-7 ${boxClass} p-0 flex flex-col`}>
           <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Target className="text-red-500" size={18} />
                 <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">Priority Focus</h3>
              </div>
              <button 
                onClick={() => { setEditingTask(null); setActiveModal('task'); }} 
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg font-bold text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
              >
                 + New
              </button>
           </div>
           <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
              {topPriorityTasks.length > 0 ? topPriorityTasks.map(task => (
                 <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => { setEditingTask(task); setActiveModal('task'); }}
                    onDelete={() => confirmDeleteTask(task.id)}
                    onClick={() => setSelectedTask(task)}
                 />
              )) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                    <CheckSquare size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">No high priority tasks.</p>
                 </div>
              )}
              
              {/* Show Next Up if space permits */}
              {topPriorityTasks.length < 3 && upNextTasks.slice(0, 3 - topPriorityTasks.length).map(task => (
                 <div key={task.id} className="opacity-80">
                    <TaskCard
                       task={task}
                       onToggle={() => toggleTask(task.id)}
                       onEdit={() => { setEditingTask(task); setActiveModal('task'); }}
                       onDelete={() => confirmDeleteTask(task.id)}
                       onClick={() => setSelectedTask(task)}
                    />
                 </div>
              ))}
           </div>
        </div>

        {/* 3. Habits Widget (Span 5) */}
        <div className={`md:col-span-5 ${boxClass} p-0 flex flex-col h-[400px]`}>
           <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                 <CheckCircle2 size={18} className="text-emerald-500" /> Daily Habits
              </h3>
              <button onClick={() => setActiveModal('habit')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors shadow-sm">
                 <Plus size={16} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {todaysHabits.length > 0 ? todaysHabits.map(habit => (
                 <HabitCard 
                   key={habit.id}
                   habit={habit}
                   isCompleted={habit.completedDates.includes(todayKey)}
                   onToggle={() => toggleHabit(habit.id)}
                   onEdit={() => {}} 
                   onDelete={() => {}} 
                   onArchive={() => {}}
                 />
              )) : (
                 <div className="text-center py-10 text-gray-400 text-xs">No habits scheduled for today.</div>
              )}
           </div>
        </div>

      </div>

      {/* Modals */}
      {activeModal === 'habit' && <HabitForm onSave={handleHabitSave} onClose={() => setActiveModal(null)} />}
      {activeModal === 'task' && <TaskForm initialData={editingTask || {}} onSave={handleTaskSave} onClose={() => { setActiveModal(null); setEditingTask(null); }} onDelete={executeDeleteTask} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onToggle={() => toggleTask(selectedTask.id)} onEdit={() => { setEditingTask(selectedTask); setActiveModal('task'); setSelectedTask(null); }} onDelete={() => confirmDeleteTask(selectedTask.id)} onToggleSubtask={(sid) => toggleSubtask(selectedTask.id, sid)} />}
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type="danger" confirmText="Delete" />
    </div>
  );
};

export default Today;
