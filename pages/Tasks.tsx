
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, CheckCircle2, Clock, CalendarDays, AlertCircle, ArrowRight, CalendarRange, Sparkles } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { TaskForm } from '../components/TaskForm';
import { TaskCard } from '../components/TaskCard';
import { TaskDetail } from '../components/TaskDetail';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { getTodayKey, formatDateKey } from '../utils/dateUtils';
import { Task, LanguageCode } from '../types';

const Tasks: React.FC = () => {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTask, toggleSubtask } = useTasks();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<Task> | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'week'>('list');
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const todayKey = getTodayKey();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(task => !task.completed && task.priority === 'high').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, highPriority, progress };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === t.common.all || selectedCategory === 'All' || task.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchQuery, selectedCategory, t]);

  const groupedTasks = useMemo(() => {
    const groups = {
      overdue: [] as Task[],
      today: [] as Task[],
      tomorrow: [] as Task[],
      upcoming: [] as Task[],
      noDate: [] as Task[],
      completed: [] as Task[]
    };

    filteredTasks.forEach(task => {
      if (task.completed) { groups.completed.push(task); return; }
      if (!task.dueDate) { groups.noDate.push(task); return; }
      if (task.dueDate < todayKey) { groups.overdue.push(task); }
      else if (task.dueDate === todayKey) { groups.today.push(task); }
      else {
        const tomorrow = new Date(); tomorrow.setDate(new Date().getDate() + 1);
        const tomorrowKey = tomorrow.toISOString().split('T')[0];
        if (task.dueDate === tomorrowKey) groups.tomorrow.push(task);
        else groups.upcoming.push(task);
      }
    });

    const sortByPriority = (a: Task, b: Task) => {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
    };
    Object.values(groups).forEach(g => g.sort(sortByPriority));
    return groups;
  }, [filteredTasks, todayKey]);

  // Generate next 7 days for Week View
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

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
      message: 'Are you sure?',
      onConfirm: async () => { await performDelete(id); },
    });
  };

  const openAddForm = (initial?: Partial<Task>) => {
    setEditingTask(null);
    setFormInitialData(initial || null);
    setIsFormOpen(true);
  };

  const renderSection = (title: string, tasks: Task[], icon: React.ReactNode, colorClass: string) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className={`flex items-center gap-2 mb-2 px-1 ${colorClass}`}>
          {icon}
          <h3 className="font-bold text-xs uppercase tracking-wider">{title}</h3>
          <span className="text-[10px] bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 px-2 py-0.5 rounded-full font-bold opacity-70">{tasks.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {tasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />)}
        </div>
      </div>
    );
  };

  const renderKanbanColumn = (title: string, tasks: Task[], accentColor: string) => (
    <div className="flex-1 min-w-[280px] flex flex-col h-full">
      <div className={`flex items-center justify-between mb-3 p-2.5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50`}>
         <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${accentColor}`} /><h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">{title}</h3></div>
         <span className="text-xs font-medium text-gray-500">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar pb-20">
         {tasks.length > 0 ? tasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />) : <div className="h-24 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-xs italic">No tasks</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col pb-4 md:pb-0">
      <div className="shrink-0 space-y-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.tasks.title}</h1><p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs sm:text-sm">{t.tasks.subtitle}</p></div>
          <div className="flex items-center gap-2">
             <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm gap-1">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`} 
                  title="List View"
                >
                  <List size={20} strokeWidth={viewMode === 'list' ? 3 : 2} />
                </button>
                <button 
                  onClick={() => setViewMode('board')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'board' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`} 
                  title="Kanban Board"
                >
                  <LayoutGrid size={20} strokeWidth={viewMode === 'board' ? 3 : 2} />
                </button>
                
                {/* Highlighted Week View Button */}
                <button 
                  onClick={() => setViewMode('week')} 
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden
                    ${viewMode === 'week' 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105' 
                      : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                    }
                  `} 
                  title="Weekly Plan"
                >
                  <CalendarRange size={20} strokeWidth={viewMode === 'week' ? 3 : 2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Week</span>
                  {viewMode === 'week' && <Sparkles size={10} className="absolute top-1 right-1 opacity-70 animate-pulse" />}
                </button>
             </div>
             <button onClick={() => openAddForm()} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-primary-600/20 transition-all active:scale-95 font-black uppercase text-[10px] tracking-[0.1em]"><Plus size={18} strokeWidth={4} /> <span className="hidden sm:inline">New Task</span></button>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase">{t.common.all}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p></div>
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase">{t.tasks.high}</p><p className="text-xl font-bold text-red-500">{stats.highPriority}</p></div>
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 md:col-span-2 flex flex-col justify-center"><div className="flex justify-between items-end mb-2"><div><p className="text-[10px] text-gray-500 font-bold uppercase">{t.tasks.completionRate}</p><p className="text-lg font-bold text-primary-600">{stats.progress}%</p></div><span className="text-[10px] text-gray-400">{stats.completed}/{stats.total} {t.nav.tasks}</span></div><div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${stats.progress}%` }} /></div></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {loading ? <LoadingSkeleton count={4} type="list" /> : filteredTasks.length === 0 && viewMode !== 'week' ? <EmptyState icon={CheckCircle2} title="No tasks found" description={searchQuery ? "No tasks match your filters." : "You're all caught up!"} actionLabel={!searchQuery ? t.tasks.addTask : undefined} onAction={() => openAddForm()} /> : 
          
          /* VIEW SWITCHER LOGIC */
          viewMode === 'list' ? (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
               {renderSection(t.tasks.overdue, groupedTasks.overdue, <AlertCircle size={14} />, 'text-red-500')}
               {renderSection(t.tasks.today, groupedTasks.today, <CheckCircle2 size={14} />, 'text-primary-600')}
               {renderSection(t.tasks.tomorrow, groupedTasks.tomorrow, <Clock size={14} />, 'text-orange-500')}
               {renderSection(t.tasks.upcoming, groupedTasks.upcoming, <CalendarDays size={14} />, 'text-blue-500')}
               {renderSection(t.tasks.noDate, groupedTasks.noDate, <LayoutGrid size={14} />, 'text-gray-500')}
               {groupedTasks.completed.length > 0 && <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700"><h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">{t.common.completed}</h3><div className="grid grid-cols-1 gap-2 opacity-60 hover:opacity-100 transition-opacity">{groupedTasks.completed.map(task => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />)}</div></div>}
            </div>
          ) : viewMode === 'board' ? (
            <div className="h-full overflow-x-auto pb-4 custom-scrollbar"><div className="flex gap-3 h-full min-w-full w-max px-1">
                {renderKanbanColumn(t.tasks.high, filteredTasks.filter(task => !task.completed && task.priority === 'high'), 'bg-red-500')}
                {renderKanbanColumn(t.tasks.medium, filteredTasks.filter(task => !task.completed && task.priority === 'medium'), 'bg-orange-500')}
                {renderKanbanColumn(t.tasks.low, filteredTasks.filter(task => !task.completed && task.priority === 'low'), 'bg-blue-500')}
                {renderKanbanColumn(t.common.completed, filteredTasks.filter(task => task.completed), 'bg-green-500')}
             </div></div>
          ) : (
            /* WEEK VIEW - ALWAYS SHOWS DAYS */
            <div className="h-full overflow-x-auto pb-6 custom-scrollbar">
              <div className="flex gap-4 h-full min-w-max px-1">
                {weekDates.map(date => {
                  const dateKey = formatDateKey(date);
                  const dayTasks = filteredTasks.filter(t => t.dueDate === dateKey && !t.completed);
                  const isToday = dateKey === todayKey;
                  
                  return (
                     <div key={dateKey} className={`w-72 sm:w-80 flex flex-col h-full rounded-[2rem] border transition-all duration-300 ${isToday ? 'bg-primary-50/40 border-primary-200 ring-2 ring-primary-500/10 dark:bg-primary-900/10 dark:border-primary-800' : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'}`}>
                        {/* Column Header */}
                        <div className={`p-4 border-b ${isToday ? 'border-primary-200 dark:border-primary-800' : 'border-gray-100 dark:border-gray-800'} flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-t-[2rem]`}>
                           <div>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-primary-600' : 'text-gray-400'}`}>
                                {date.toLocaleDateString(undefined, { weekday: 'long' })}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <h3 className={`text-2xl font-black leading-none ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{date.getDate()}</h3>
                                 <span className="text-[10px] font-bold text-gray-400 opacity-50 uppercase">{date.toLocaleDateString(undefined, { month: 'short' })}</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => openAddForm({ dueDate: dateKey })}
                             className={`p-2 rounded-xl transition-all active:scale-90 ${isToday ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-primary-600'}`}
                           >
                             <Plus size={20} strokeWidth={3} />
                           </button>
                        </div>
                        
                        {/* Column Tasks */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[300px]">
                           {dayTasks.length > 0 ? (
                             dayTasks.map(task => (
                               <div key={task.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <TaskCard 
                                    task={task} 
                                    onToggle={() => toggleTask(task.id)} 
                                    onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} 
                                    onDelete={() => handleDeleteWithConfirm(task.id)} 
                                    onClick={() => setSelectedTask(task)} 
                                  />
                               </div>
                             ))
                           ) : (
                             <button 
                               onClick={() => openAddForm({ dueDate: dateKey })}
                               className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 group transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/30"
                             >
                               <Plus size={24} className="text-gray-200 dark:text-gray-700 group-hover:text-primary-400 transition-colors" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-600 group-hover:text-primary-400">Add to Day</span>
                             </button>
                           )}
                        </div>
                        
                        {/* Footer Status */}
                        {dayTasks.length > 0 && (
                          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex justify-center rounded-b-[2rem]">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{dayTasks.length} Pending</span>
                          </div>
                        )}
                     </div>
                  )
                })}
              </div>
            </div>
          )
        }
      </div>
      
      {isFormOpen && <TaskForm initialData={editingTask || formInitialData || {}} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditingTask(null); setFormInitialData(null); }} onDelete={editingTask ? performDelete : undefined} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onToggle={() => toggleTask(selectedTask.id)} onEdit={() => { setEditingTask(selectedTask); setIsFormOpen(true); setSelectedTask(null); }} onDelete={() => handleDeleteWithConfirm(selectedTask.id)} onToggleSubtask={(sid) => toggleSubtask(selectedTask.id, sid)} />}
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type="danger" confirmText={t.common.delete} />
    </div>
  );
};

export default Tasks;
