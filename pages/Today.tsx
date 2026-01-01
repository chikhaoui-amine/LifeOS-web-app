
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, CheckCircle2, ListTodo, Sun, Moon, Coffee, Edit3, Target, StickyNote, Sunrise, Calendar as CalendarIcon, Sparkles, ArrowRight, DollarSign, Droplets, Wind, Focus, Zap, CheckSquare 
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
  const [noteInput, setNoteInput] = useState(settings?.scratchpad || '');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);

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

  // Hydration Widget Data
  const waterIntake = useMemo(() => {
    const plan = mealPlans.find(p => p.date === todayKey);
    return plan ? plan.waterIntake : 0;
  }, [mealPlans, todayKey]);

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

  const handleNoteBlur = () => {
    updateSettings({ scratchpad: noteInput });
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

  // Breathing Logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (breathingActive) {
      timeout = setTimeout(() => setBreathingActive(false), 10000); // Stop after 10s automatically
    }
    return () => clearTimeout(timeout);
  }, [breathingActive]);

  // Texture Class
  const boxClass = "bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] overflow-hidden hover:shadow-md transition-shadow duration-300";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-1">
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-min">
        
        {/* 1. Main Greeting Card (Span 8) */}
        <div className="md:col-span-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
           {/* Background Art */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none mix-blend-overlay" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
           
           <div className="relative z-10 flex justify-between items-start">
              <div>
                 <div className="flex items-center gap-2 text-indigo-100 font-bold uppercase tracking-widest text-xs mb-3">
                    <CalendarIcon size={12} /> {dateStr}
                 </div>
                 <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 leading-tight">{greeting},</h1>
                 <p className="text-indigo-100 text-lg opacity-90 font-medium">{greetingSub}</p>
              </div>
              <div className="hidden sm:flex bg-white/20 backdrop-blur-md border border-white/20 p-2 rounded-2xl">
                 <GreetingIcon size={32} className="text-white" />
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {/* Quick Stats in Hero */}
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                 <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Tasks Done</p>
                 <div className="text-2xl font-bold">{completedTasks}<span className="text-sm opacity-60">/{totalTasks}</span></div>
                 <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-white transition-all" style={{width: `${taskProgress}%`}} /></div>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                 <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Habit Streak</p>
                 <div className="text-2xl font-bold">{completedHabits}<span className="text-sm opacity-60">/{totalHabits}</span></div>
                 <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-400 transition-all" style={{width: `${habitProgress}%`}} /></div>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                 <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Hydration</p>
                 <div className="text-2xl font-bold">{waterIntake}<span className="text-sm opacity-60"> gls</span></div>
                 <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-400 transition-all" style={{width: `${Math.min(100, (waterIntake/8)*100)}%`}} /></div>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                 <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Daily Spend</p>
                 <div className="text-xl font-bold truncate" title={getFormattedCurrency(dailySpend)}>{getFormattedCurrency(dailySpend)}</div>
                 <div className="mt-2 text-[10px] text-white/60">Keep it lean!</div>
              </div>
           </div>
        </div>

        {/* 2. Focus / Zen Widget (Span 4) */}
        <div className={`md:col-span-4 ${boxClass} relative flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${breathingActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}`}>
           {breathingActive ? (
              <div className="relative">
                 <div className="w-32 h-32 bg-blue-400/20 rounded-full animate-ping absolute inset-0" />
                 <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold relative z-10 animate-pulse shadow-lg shadow-blue-500/30">
                    Breathe
                 </div>
              </div>
           ) : (
              <>
                 <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mb-4">
                    <Wind size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Need a Moment?</h3>
                 <p className="text-gray-500 text-xs mb-6">Take a 10-second deep breath to reset.</p>
                 <button 
                   onClick={() => setBreathingActive(true)}
                   className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
                 >
                    Start Pulse
                 </button>
              </>
           )}
        </div>

        {/* 3. Priority Tasks (Span 7) */}
        <div className={`md:col-span-7 ${boxClass} p-0 flex flex-col`}>
           <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Target className="text-red-500" size={18} />
                 <h3 className="font-bold text-gray-900 dark:text-white">Priority Focus</h3>
              </div>
              <button 
                onClick={() => { setEditingTask(null); setActiveModal('task'); }} 
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg font-bold text-gray-600 dark:text-gray-300 transition-colors"
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

        {/* 4. Habits Widget (Span 5) */}
        <div className={`md:col-span-5 ${boxClass} p-0 flex flex-col h-[400px]`}>
           <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-emerald-500" /> Daily Habits
              </h3>
              <button onClick={() => setActiveModal('habit')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
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

        {/* 5. Scratchpad (Span 12) */}
        <div className={`md:col-span-12 ${boxClass} p-6 relative group bg-yellow-50/30 dark:bg-yellow-900/5 border-yellow-100 dark:border-yellow-900/30`}>
           <div className="flex items-center gap-2 mb-3 text-yellow-600 dark:text-yellow-500">
              <StickyNote size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">{t.today.scratchpad}</h3>
           </div>
           <textarea 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Capture a quick thought..."
              className="w-full bg-transparent border-none resize-none text-base text-gray-700 dark:text-gray-300 focus:ring-0 h-20 leading-relaxed placeholder:text-gray-400 font-medium"
           />
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
