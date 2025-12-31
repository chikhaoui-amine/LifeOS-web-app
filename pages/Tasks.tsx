
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, CheckCircle2, Clock, CalendarDays, AlertCircle, ArrowRight } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { TaskForm } from '../components/TaskForm';
import { TaskCard } from '../components/TaskCard';
import { TaskDetail } from '../components/TaskDetail';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { getTodayKey } from '../utils/dateUtils';
import { Task, LanguageCode } from '../types';

const Tasks: React.FC = () => {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTask, toggleSubtask } = useTasks();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [t.common.all, ...Array.from(new Set(tasks.map(task => task.category)))];
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

  const handleSave = async (taskData: any) => {
    if (editingTask) { await updateTask(editingTask.id, taskData); setEditingTask(null); }
    else { await addTask(taskData); }
    setIsFormOpen(false);
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
          <div className="flex gap-2">
             <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}><List size={18} /></button>
                <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
             </div>
             <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary-600/20 transition-all active:scale-95 font-medium text-xs sm:text-sm"><Plus size={18} /> <span className="hidden sm:inline">{t.tasks.addTask}</span></button>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase">{t.common.all}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p></div>
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"><p className="text-[10px] text-gray-500 font-bold uppercase">{t.tasks.high}</p><p className="text-xl font-bold text-red-500">{stats.highPriority}</p></div>
           <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 md:col-span-2 flex flex-col justify-center"><div className="flex justify-between items-end mb-2"><div><p className="text-[10px] text-gray-500 font-bold uppercase">{t.tasks.completionRate}</p><p className="text-lg font-bold text-primary-600">{stats.progress}%</p></div><span className="text-[10px] text-gray-400">{stats.completed}/{stats.total} {t.nav.tasks}</span></div><div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${stats.progress}%` }} /></div></div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder={t.common.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 text-xs sm:text-sm" /></div><div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === cat ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>{cat}</button>)}</div></div>
      </div>
      <div className="flex-1 overflow-hidden">
        {loading ? <LoadingSkeleton count={4} type="list" /> : filteredTasks.length === 0 ? <EmptyState icon={CheckCircle2} title="No tasks found" description={searchQuery ? "No tasks match your filters." : "You're all caught up!"} actionLabel={!searchQuery ? t.tasks.addTask : undefined} onAction={() => setIsFormOpen(true)} /> : viewMode === 'list' ? <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
             {renderSection(t.tasks.overdue, groupedTasks.overdue, <AlertCircle size={14} />, 'text-red-500')}
             {renderSection(t.tasks.today, groupedTasks.today, <CheckCircle2 size={14} />, 'text-primary-600')}
             {renderSection(t.tasks.tomorrow, groupedTasks.tomorrow, <Clock size={14} />, 'text-orange-500')}
             {renderSection(t.tasks.upcoming, groupedTasks.upcoming, <CalendarDays size={14} />, 'text-blue-500')}
             {renderSection(t.tasks.noDate, groupedTasks.noDate, <LayoutGrid size={14} />, 'text-gray-500')}
             {groupedTasks.completed.length > 0 && <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700"><h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">{t.common.completed}</h3><div className="grid grid-cols-1 gap-2 opacity-60 hover:opacity-100 transition-opacity">{groupedTasks.completed.map(task => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} onEdit={() => {setEditingTask(task); setIsFormOpen(true);}} onDelete={() => handleDeleteWithConfirm(task.id)} onClick={() => setSelectedTask(task)} />)}</div></div>}
          </div> : <div className="h-full overflow-x-auto pb-4 custom-scrollbar"><div className="flex gap-3 h-full min-w-full w-max px-1">
                {renderKanbanColumn(t.tasks.high, filteredTasks.filter(task => !task.completed && task.priority === 'high'), 'bg-red-500')}
                {renderKanbanColumn(t.tasks.medium, filteredTasks.filter(task => !task.completed && task.priority === 'medium'), 'bg-orange-500')}
                {renderKanbanColumn(t.tasks.low, filteredTasks.filter(task => !task.completed && task.priority === 'low'), 'bg-blue-500')}
                {renderKanbanColumn(t.common.completed, filteredTasks.filter(task => task.completed), 'bg-green-500')}
             </div></div>}
      </div>
      {isFormOpen && <TaskForm initialData={editingTask || {}} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditingTask(null); }} onDelete={editingTask ? performDelete : undefined} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onToggle={() => toggleTask(selectedTask.id)} onEdit={() => { setEditingTask(selectedTask); setIsFormOpen(true); setSelectedTask(null); }} onDelete={() => handleDeleteWithConfirm(selectedTask.id)} onToggleSubtask={(sid) => toggleSubtask(selectedTask.id, sid)} />}
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type="danger" confirmText={t.common.delete} />
    </div>
  );
};

export default Tasks;
