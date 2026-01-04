
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, List, CheckCircle2, Clock, 
  CalendarDays, AlertCircle, ArrowRight, CalendarRange, 
  Sparkles, Calendar as CalendarIcon, Inbox, ListTodo,
  ChevronLeft, ChevronRight, Filter, Target, BarChart, CalendarFold
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { TaskForm } from '../components/TaskForm';
import { TaskCard } from '../components/TaskCard';
import { TaskDetail } from '../components/TaskDetail';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ProgressRing } from '../components/ProgressRing';
import { getTodayKey, formatDateKey } from '../utils/dateUtils';
import { Task, LanguageCode } from '../types';

type PlanningSection = 'day' | 'week' | 'month';

const Tasks: React.FC = () => {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTask, toggleSubtask } = useTasks();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [activeSection, setActiveSection] = useState<PlanningSection>('day');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<Task> | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, });

  const todayKey = getTodayKey();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, progress };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  const dayData = useMemo(() => {
    const urgent = filteredTasks.filter(t => !t.completed && (t.dueDate === todayKey || (t.dueDate && t.dueDate < todayKey)));
    const completed = filteredTasks.filter(t => t.completed && t.dueDate === todayKey);
    const total = urgent.length + completed.length;
    const progress = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    
    return { urgent, completed, total, progress };
  }, [filteredTasks, todayKey]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isMondayStart = settings.preferences.startOfWeek === 'monday';
    const diffToStart = (dayOfWeek + (isMondayStart ? 6 : 0)) % 7;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToStart);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startKey = formatDateKey(startOfWeek);
    const endKey = formatDateKey(endOfWeek);

    const weekTasks = filteredTasks.filter(t => 
      t.dueDate && t.dueDate >= startKey && t.dueDate <= endKey
    );

    const completed = weekTasks.filter(t => t.completed).length;
    const total = weekTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sortedTasks = [...weekTasks].sort((a, b) => {
        const pMap = { high: 0, medium: 1, low: 2 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
        return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    return { tasks: sortedTasks, progress, total, completed, startKey, endKey };
  }, [filteredTasks, settings.preferences.startOfWeek]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthName = now.toLocaleDateString(undefined, { month: 'long' });
    
    const monthTasks = filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const completed = monthTasks.filter(t => t.completed).length;
    const total = monthTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sortedTasks = [...monthTasks].sort((a, b) => {
        const pMap = { high: 0, medium: 1, low: 2 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
        return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    return { tasks: sortedTasks, progress, total, completed, monthName, currentYear };
  }, [filteredTasks]);

  const handleSave = async (taskData: any) => {
    if (editingTask) { await updateTask(editingTask.id, taskData); setEditingTask(null); }
    else { await addTask(taskData); }
    setIsFormOpen(false);
    setFormInitialData(null);
  };

  const performDelete = async (id: string) => {
    await deleteTask(id);
    if (selectedTask?.id === id) setSelectedTask(null);
    if (editingTask?.id === id) { setEditingTask(null); setIsFormOpen(false); }
  };

  const handleDeleteWithConfirm = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t.common.delete,
      message: 'Are you sure you want to delete this task?',
      onConfirm: async () => { await performDelete(id); },
    });
  };

  const openAddForm = (initial?: Partial<Task>) => {
    setEditingTask(null);
    setFormInitialData(initial || null);
    setIsFormOpen(true);
  };

  const DayPlanning = () => (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg scale-90" />
               <ProgressRing 
                 progress={dayData.progress} 
                 radius={50} 
                 stroke={8} 
                 color="text-emerald-600" 
                 trackColor="text-gray-100 dark:text-gray-800" 
                 showValue={false} 
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{dayData.progress}%</span>
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Daily Focus</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                  {dayData.completed.length} OF {dayData.total} TASKS COMPLETED TODAY
               </p>
            </div>
         </div>
         <div className="flex gap-2 relative z-10">
            <button 
              onClick={() => openAddForm({ dueDate: todayKey })} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
            >
               <Plus size={16} strokeWidth={3} /> Add to Today
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white/40 dark:bg-gray-900/20 rounded-[3rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-inner overflow-hidden flex flex-col">
         <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={18} strokeWidth={2.5} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Scheduled & Overdue</span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 custom-scrollbar">
            {dayData.urgent.length > 0 ? (
               <div className="space-y-3">
                  {dayData.urgent.map(task => (
                     <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />
                  ))}
               </div>
            ) : dayData.completed.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Sparkles size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Your day is clear</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium max-w-xs mx-auto leading-relaxed">No tasks for today. A perfect time to plan ahead or focus on a bigger goal.</p>
               </div>
            ) : null}

            {dayData.completed.length > 0 && (
               <div className="pt-8">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Finished Today</h4>
                  <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                     {dayData.completed.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );

  const WeekPlanning = () => (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg scale-90" />
               <ProgressRing 
                 progress={weeklyData.progress} 
                 radius={50} 
                 stroke={8} 
                 color="text-primary-600" 
                 trackColor="text-gray-100 dark:text-gray-800" 
                 showValue={false} 
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{weeklyData.progress}%</span>
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Weekly Objectives</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                  {weeklyData.completed} OF {weeklyData.total} MISSION OBJECTIVES
               </p>
            </div>
         </div>
         <div className="flex gap-2 relative z-10">
            <button onClick={() => openAddForm({ dueDate: todayKey })} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-600/20 transition-all active:scale-95 flex items-center gap-2">
               <Plus size={16} strokeWidth={3} /> New Objective
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white/40 dark:bg-gray-900/20 rounded-[3rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-inner overflow-hidden flex flex-col">
         <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                  <Target size={18} strokeWidth={2.5} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Current Week Focus</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
               <CalendarDays size={12} />
               {new Date(weeklyData.startKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(weeklyData.endKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
            {weeklyData.tasks.length > 0 ? weeklyData.tasks.map(task => (
               <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />
            )) : (
               <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <BarChart size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">No weekly load</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium max-w-xs mx-auto leading-relaxed">A clear week is a fresh start. Add your major milestones to stay aligned.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );

  const MonthPlanning = () => (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-lg scale-90" />
               <ProgressRing 
                 progress={monthlyData.progress} 
                 radius={50} 
                 stroke={8} 
                 color="text-violet-600" 
                 trackColor="text-gray-100 dark:text-gray-800" 
                 showValue={false} 
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{monthlyData.progress}%</span>
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{monthlyData.monthName} Roadmap</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                  {monthlyData.completed} OF {monthlyData.total} KEY MILESTONES
               </p>
            </div>
         </div>
         <div className="flex gap-2 relative z-10">
            <button onClick={() => openAddForm({ dueDate: todayKey })} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-violet-600/20 transition-all active:scale-95 flex items-center gap-2">
               <Plus size={16} strokeWidth={3} /> New Milestone
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white/40 dark:bg-gray-900/20 rounded-[3rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-inner overflow-hidden flex flex-col">
         <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
                  <CalendarFold size={18} strokeWidth={2.5} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{monthlyData.monthName} {monthlyData.currentYear} Perspective</span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
            {monthlyData.tasks.length > 0 ? monthlyData.tasks.map(task => (
               <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />
            )) : (
               <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <CalendarIcon size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">No monthly targets</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium max-w-xs mx-auto leading-relaxed">Map out your long-term vision by setting monthly goals.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500 pb-2 md:pb-0 gap-4 sm:gap-6 overflow-hidden">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-gray-900/40 p-4 sm:p-6 rounded-[2.5rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-600/20 rotate-3">
              <ListTodo size={28} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{t.tasks.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                 <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{stats.pending} Pending</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stats.progress}% Complete</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-[1.25rem] border border-gray-200 dark:border-gray-700 shadow-inner">
              {[
                { id: 'day', label: 'Day', icon: List },
                { id: 'week', label: 'Week', icon: LayoutGrid },
                { id: 'month', label: 'Month', icon: CalendarRange }
              ].map(section => (
                 <button 
                   key={section.id}
                   onClick={() => setActiveSection(section.id as PlanningSection)}
                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === section.id ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-md scale-105 z-10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                 >
                    <section.icon size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">{section.label}</span>
                 </button>
              ))}
           </div>
           
           <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={14} />
              <input type="text" placeholder="Find..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2.5 w-32 md:w-48 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-primary-500/50 transition-all text-gray-900 dark:text-white" />
           </div>
           <button onClick={() => openAddForm()} className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-xl shadow-lg shadow-primary-600/30 transition-all active:scale-95"><Plus size={20} strokeWidth={4} /></button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        {loading ? <div className="space-y-4"><LoadingSkeleton count={3} type="list" /></div> : (
           <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-700">
              {activeSection === 'day' && <DayPlanning />}
              {activeSection === 'week' && <WeekPlanning />}
              {activeSection === 'month' && <MonthPlanning />}
           </div>
        )}
      </div>
      
      {isFormOpen && <TaskForm initialData={editingTask || formInitialData || {}} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditingTask(null); setFormInitialData(null); }} onDelete={editingTask ? performDelete : undefined} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onToggle={() => toggleTask(selectedTask.id)} onEdit={() => { setEditingTask(selectedTask); setIsFormOpen(true); setSelectedTask(null); }} onDelete={() => handleDeleteWithConfirm(selectedTask.id)} onToggleSubtask={(sid) => toggleSubtask(selectedTask.id, sid)} />}
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type="danger" confirmText={t.common.delete} />
    </div>
  );
};

export default Tasks;
