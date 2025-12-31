
import React, { useState, useMemo } from 'react';
import { Plus, SlidersHorizontal, Grid3X3, List, Layers, Sun, Moon, Sunrise, Clock, Settings, X, Sparkles } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { HabitForm } from '../components/HabitForm';
import { HabitCard } from '../components/HabitCard';
import { HabitGrid } from '../components/HabitGrid';
import { HabitTemplates } from '../components/HabitTemplates';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { getTodayKey } from '../utils/dateUtils';
import { Habit, LanguageCode } from '../types';

const Habits: React.FC = () => {
  const { habits, categories, loading, addHabit, updateHabit, deleteHabit, toggleHabit, archiveHabit, deleteCategory } = useHabits();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Partial<Habit> | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  
  const todayKey = getTodayKey();

  const handleSave = async (habitData: any) => {
    if (editingHabit && (editingHabit as Habit).id) {
      await updateHabit((editingHabit as Habit).id, habitData);
    } else {
      await addHabit(habitData);
    }
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleTemplateSelect = (template: Partial<Habit>) => {
    setEditingHabit(template);
    setIsTemplatesOpen(false);
    setIsModalOpen(true);
  };

  const requestDeleteHabit = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Habit',
      message: 'Are you sure you want to delete this habit? This action cannot be undone.',
      onConfirm: () => deleteHabit(id),
    });
  };

  const requestDeleteCategory = (category: string) => {
     setConfirmConfig({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${category}"? Habits in this category will become uncategorized.`,
      onConfirm: () => {
        deleteCategory(category);
        if (selectedCategory === category) setSelectedCategory('All');
      },
    });
  };
  
  const activeHabits = habits.filter(h => !h.archived);
  const filteredHabits = activeHabits.filter(h => {
    if (selectedCategory !== 'All' && h.category !== selectedCategory) return false;
    return true;
  });

  const groupedHabits = {
    morning: filteredHabits.filter(h => h.timeOfDay === 'morning'),
    afternoon: filteredHabits.filter(h => h.timeOfDay === 'afternoon'),
    evening: filteredHabits.filter(h => h.timeOfDay === 'evening'),
    anytime: filteredHabits.filter(h => !h.timeOfDay || h.timeOfDay === 'anytime'),
  };

  const timeSections = [
    { key: 'morning', label: t.habits.morning, icon: Sunrise, color: 'text-orange-500' },
    { key: 'afternoon', label: t.habits.afternoon, icon: Sun, color: 'text-yellow-500' },
    { key: 'evening', label: t.habits.evening, icon: Moon, color: 'text-indigo-500' },
    { key: 'anytime', label: t.habits.anytime, icon: Clock, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-700 min-h-screen pb-24 w-full px-1">
      
      {/* Refined Header Section */}
      <header className="space-y-3 sm:space-y-6 py-2">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">
            {t.habits.title}
          </h1>
          <p className="text-gray-400 dark:text-gray-500 mt-1 font-bold text-[10px] sm:text-sm uppercase tracking-widest">
            {t.habits.subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
           <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
             <button 
               onClick={() => setViewMode('list')} 
               className={`p-1.5 sm:p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}
             >
               <List size={18} strokeWidth={3} />
             </button>
             <button 
               onClick={() => setViewMode('grid')} 
               className={`p-1.5 sm:p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-400'}`}
             >
               <Grid3X3 size={18} strokeWidth={3} />
             </button>
           </div>

           <button 
             onClick={() => setIsTemplatesOpen(true)} 
             className="p-2 sm:p-3 bg-white dark:bg-gray-800 text-primary-600 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
           >
             <Sparkles size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
           </button>
           
           <button 
             onClick={() => { setEditingHabit(null); setIsModalOpen(true); }} 
             className="p-2 sm:p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-xl shadow-primary-600/20 transition-all active:scale-90"
           >
             <Plus size={18} strokeWidth={4} />
           </button>
        </div>
      </header>

      {/* Category Management Row */}
      <div className="flex items-center gap-2 py-1 border-t border-gray-100 dark:border-gray-800/50 pt-4">
        <button 
          onClick={() => setIsManagingCategories(!isManagingCategories)} 
          className={`p-1.5 sm:p-2 rounded-xl shrink-0 transition-all border-2 ${isManagingCategories ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 shadow-sm'}`} 
        >
          <Settings size={14} strokeWidth={3} />
        </button>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 items-center">
          <button 
            onClick={() => setSelectedCategory('All')} 
            className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategory === 'All' ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}
          >
            {t.common.all}
          </button>
          
          {categories.map(cat => (
            <div key={cat} className="relative group shrink-0">
              <button 
                onClick={() => setSelectedCategory(cat)} 
                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategory === cat ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-300'} ${isManagingCategories ? 'pr-7' : ''}`}
              >
                {cat}
              </button>
              {isManagingCategories && (
                <button 
                  onClick={(e) => { e.stopPropagation(); requestDeleteCategory(cat); }} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full transition-all hover:scale-110 z-10"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main List/Grid View */}
      <div className="min-h-[300px]">
        {loading ? (
          <LoadingSkeleton count={4} type="card" />
        ) : filteredHabits.length === 0 ? (
          <div className="py-16">
            <EmptyState 
              icon={Layers} 
              title="No habits found" 
              description={selectedCategory !== 'All' ? "No habits match this category." : "Start building consistency today!"} 
              onAction={() => setIsModalOpen(true)} 
            />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-12">
             {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredHabits.map(habit => (
                    <div key={habit.id} onClick={() => handleEdit(habit)} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-700">{habit.icon}</span>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate text-sm">{habit.name}</h3>
                      </div>
                      <HabitGrid completedDates={habit.completedDates} color={habit.color} size="sm" daysToShow={35} />
                    </div>
                  ))}
                </div>
             ) : (
               timeSections.map(section => {
                 const sectionHabits = groupedHabits[section.key as keyof typeof groupedHabits];
                 if (sectionHabits.length === 0) return null;
                 return (
                   <div key={section.key} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <div className={`p-1 rounded-lg bg-gray-50 dark:bg-gray-800 ${section.color}`}>
                           <section.icon size={14} strokeWidth={3} />
                        </div>
                        <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{section.label}</h2>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded-full font-black">
                          {sectionHabits.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4">
                         {sectionHabits.map(habit => (
                            <HabitCard 
                              key={habit.id} 
                              habit={habit} 
                              isCompleted={habit.completedDates.includes(todayKey)} 
                              onToggle={() => toggleHabit(habit.id)} 
                              onEdit={() => handleEdit(habit)} 
                              onDelete={() => requestDeleteHabit(habit.id)} 
                              onArchive={() => archiveHabit(habit.id)} 
                            />
                         ))}
                      </div>
                   </div>
                 );
               })
             )}
          </div>
        )}
      </div>

      {isModalOpen && <HabitForm initialData={editingHabit || {}} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingHabit(null); }} />}
      {isTemplatesOpen && <HabitTemplates onSelect={handleTemplateSelect} onClose={() => setIsTemplatesOpen(false)} />}
      <ConfirmationModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} onConfirm={confirmConfig.onConfirm} type={confirmConfig.title.includes('Delete') ? 'danger' : 'simple'} confirmText={t.common.delete} />
    </div>
  );
};

export default Habits;
