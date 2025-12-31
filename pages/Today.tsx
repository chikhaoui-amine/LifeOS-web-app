
import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, ListTodo, Sun, Moon, Coffee, Edit3, Target, StickyNote, Sunrise, Calendar as CalendarIcon, Sparkles, ArrowRight } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
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
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [activeModal, setActiveModal] = useState<'habit' | 'task' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [noteInput, setNoteInput] = useState(settings?.scratchpad || '');
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
  
  if (currentHour >= 12 && currentHour < 18) {
    greeting = t.today.afternoon;
    GreetingIcon = Sun;
  } else if (currentHour >= 18) {
    greeting = t.today.evening;
    GreetingIcon = Moon;
  }

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

  // Reusable Texture Class - Adjusted to use bg-white instead of bg-white/80
  const boxClass = "bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] overflow-hidden";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-1">
      
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] p-6 sm:p-10 text-white overflow-hidden shadow-2xl bg-primary-600 transition-colors duration-500">
        
        {/* Texture & Abstract Shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[image:radial-gradient(circle,_rgba(255,255,255,0.4)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs mb-2">
               <CalendarIcon size={12} /> {dateStr}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">{greeting}</h1>
            <p className="text-white/90 text-sm sm:text-lg font-medium leading-relaxed opacity-90">
              "Focus on being productive instead of busy."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10 w-full xl:w-auto justify-center xl:justify-end">
             
             {/* Tasks Stats */}
             <div className="flex items-center gap-4 flex-1 sm:flex-none justify-center">
                <div className="relative shrink-0">
                   <ProgressRing progress={taskProgress} radius={32} stroke={4} color="stroke-white" trackColor="stroke-white/20" showValue={false} />
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">{Math.round(taskProgress)}%</div>
                </div>
                <div className="min-w-[80px]">
                   <p className="text-2xl font-black text-white leading-none mb-1">{completedTasks}/{totalTasks}</p>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">Tasks</p>
                </div>
             </div>

             {/* Divider */}
             <div className="w-full h-px sm:w-px sm:h-12 bg-white/20"></div>

             {/* Habits Stats */}
             <div className="flex items-center gap-4 flex-1 sm:flex-none justify-center">
                <div className="relative shrink-0">
                   <ProgressRing progress={habitProgress} radius={32} stroke={4} color="stroke-white" trackColor="stroke-white/20" showValue={false} />
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">{Math.round(habitProgress)}%</div>
                </div>
                <div className="min-w-[80px]">
                   <p className="text-2xl font-black text-white leading-none mb-1">{completedHabits}/{totalHabits}</p>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">Habits</p>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tasks & Focus (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Priority Focus */}
           {topPriorityTasks.length > 0 && (
             <div className={`${boxClass} p-6 relative group border-l-4 border-l-orange-500`}>
                <div className="flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-400">
                   <Target size={20} className="animate-pulse" />
                   <h2 className="text-sm font-black uppercase tracking-widest">Top Priority</h2>
                </div>
                <div className="space-y-3">
                   {topPriorityTasks.map(task => (
                     <div key={task.id} className="transform transition-transform hover:scale-[1.01]">
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
           )}

           {/* Up Next Tasks */}
           <div className={boxClass}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                      <ListTodo size={20} />
                   </div>
                   <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.today.upNext}</h2>
                </div>
                <button 
                  onClick={() => { setEditingTask(null); setActiveModal('task'); }} 
                  className="flex items-center gap-1.5 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                   <Plus size={14} /> {t.today.addTask}
                </button>
              </div>

              <div className="p-4 space-y-3 min-h-[150px]">
                {upNextTasks.length > 0 ? upNextTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => { setEditingTask(task); setActiveModal('task'); }}
                    onDelete={() => confirmDeleteTask(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                )) : (
                   <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      <Sparkles size={24} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">All clear! No pending tasks.</p>
                   </div>
                )}
              </div>
           </div>

        </div>

        {/* Right Column: Habits & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Habits Widget */}
           <div className={`${boxClass} flex flex-col h-[400px]`}>
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Habits
                 </h3>
                 <button onClick={() => setActiveModal('habit')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
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

           {/* Quick Note (Scratchpad) */}
           <div className={`${boxClass} p-5 relative group`}>
              <div className="flex items-center gap-2 mb-3 text-yellow-600 dark:text-yellow-500">
                 <StickyNote size={16} />
                 <h3 className="text-xs font-black uppercase tracking-widest">{t.today.scratchpad}</h3>
              </div>
              <textarea 
                 value={noteInput}
                 onChange={(e) => setNoteInput(e.target.value)}
                 onBlur={handleNoteBlur}
                 placeholder="Type something..."
                 className="w-full bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl p-3 border-none resize-none text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500/20 h-32 leading-relaxed placeholder:text-gray-400 font-medium"
              />
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
