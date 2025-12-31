
import React, { useState, useMemo } from 'react';
import { Plus, Target, LayoutGrid, List, Kanban, Search, Sparkles, BrainCircuit } from 'lucide-react';
import { useGoals } from '../context/GoalContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalForm } from '../components/goals/GoalForm';
import { GoalDetail } from '../components/goals/GoalDetail';
import { GoalTemplates } from '../components/goals/GoalTemplates';
import { LifeBalanceWheel } from '../components/goals/LifeBalanceWheel';
import { AIGoalPlannerModal } from '../components/goals/AIGoalPlannerModal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Goal, LanguageCode } from '../types';

const CATEGORIES = [
  'Career & Business', 'Financial & Wealth', 'Health & Fitness', 
  'Relationships & Family', 'Personal Development', 'Education & Learning', 
  'Spiritual & Faith', 'Adventure & Travel', 'Creativity & Hobbies', 'Contribution & Legacy'
];

const Goals: React.FC = () => {
  const { goals, loading, addGoal, updateGoal } = useGoals();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'board'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [formInitialData, setFormInitialData] = useState<Partial<Goal> | null>(null);

  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId) || null, [goals, selectedGoalId]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
        if (selectedStatus === 'Active' && (g.status === 'completed' || g.status === 'cancelled')) return false;
        if (selectedStatus === 'Completed' && g.status !== 'completed') return false;
        if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
        }
        return true;
    });
  }, [goals, selectedStatus, selectedCategory, searchQuery]);

  const activeCount = goals.filter(g => g.status !== 'completed' && g.status !== 'cancelled').length;
  const completedCount = goals.filter(g => g.status === 'completed').length;

  const handleSave = async (data: any) => {
    if (selectedGoalId) { await updateGoal(selectedGoalId, data); }
    else { await addGoal(data); }
    setIsFormOpen(false); setSelectedGoalId(null); setFormInitialData(null);
  };

  const handleTemplateSelect = (template: Partial<Goal>) => {
    setIsTemplateOpen(false); setFormInitialData(template); setIsFormOpen(true);
  };

  const handleAIGenerated = (aiGoal: Partial<Goal>) => {
    setIsAIPlannerOpen(false); setFormInitialData(aiGoal); setIsFormOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.goals.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs sm:text-sm">{t.goals.subtitle}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setIsAIPlannerOpen(true)} className="whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-all shadow-sm text-xs sm:text-sm">
            <BrainCircuit size={16} />
            <span>{t.goals.aiPlanner}</span>
          </button>
          <button onClick={() => setIsTemplateOpen(true)} className="whitespace-nowrap bg-white dark:bg-gray-800 text-primary-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-colors shadow-sm text-xs sm:text-sm">
            <Sparkles size={16} />
            <span>Templates</span>
          </button>
          <button onClick={() => { setFormInitialData(null); setSelectedGoalId(null); setIsFormOpen(true); }} className="whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary-600/20 transition-all active:scale-95 font-medium text-xs sm:text-sm">
            <Plus size={16} />
            <span>{t.goals.newGoal}</span>
          </button>
        </div>
      </header>

      {viewMode !== 'board' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-primary-600 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">{t.goals.activeFocus}</p>
                  <p className="text-2xl sm:text-4xl font-bold">{activeCount}</p>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5">{t.goals.inProgress}</p>
                </div>
                <Target className="absolute -bottom-4 -right-4 text-white opacity-20" size={80} />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">{t.goals.victories}</p>
                  <p className="text-2xl sm:text-4xl font-bold text-green-500">{completedCount}</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{t.common.completed}</p>
                </div>
              </div>
          </div>
          <div className="hidden sm:flex bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm items-center justify-center p-4">
             <div className="scale-75 origin-center"><LifeBalanceWheel goals={goals} size={240} /></div>
          </div>
        </section>
      )}

      {/* Floating Filter Bar */}
      <div className="sticky top-0 z-20 py-2 -mx-4 px-4 md:mx-0 md:px-0">
         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-3">
            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
               <div className="relative min-w-[160px] sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    placeholder={t.common.search} 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 text-xs sm:text-sm text-gray-900 dark:text-white transition-all" 
                  />
               </div>
               <select 
                 value={selectedCategory} 
                 onChange={(e) => setSelectedCategory(e.target.value)} 
                 className="px-3 py-2 rounded-xl bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 max-w-[120px] text-xs sm:text-sm text-gray-900 dark:text-white transition-all"
               >
                 <option value="All">{t.common.all}</option>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-1 rounded-xl flex shrink-0">
                 {[t.common.active, t.common.completed, t.common.all].map(s => (
                   <button 
                     key={s} 
                     onClick={() => setSelectedStatus(s)} 
                     className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${selectedStatus === s ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     {s}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="flex bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-1 rounded-xl shrink-0 self-start">
               <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
               <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400'}`}><List size={16} /></button>
               <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400'}`}><Kanban size={16} /></button>
            </div>
         </div>
      </div>

      {loading ? <LoadingSkeleton count={3} /> : filteredGoals.length === 0 ? <div className="py-10"><EmptyState icon={Target} title="No goals found" description="Try adjusting your filters." actionLabel="Clear Filters" onAction={() => { setSelectedCategory('All'); setSelectedStatus('Active'); setSearchQuery(''); }} /></div> : <>
          {viewMode === 'grid' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">{filteredGoals.map(goal => <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedGoalId(goal.id)} />)}</div>}
          {viewMode === 'list' && <div className="space-y-3">{filteredGoals.map(goal => <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedGoalId(goal.id)} />)}</div>}
          {viewMode === 'board' && <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-280px)] no-scrollbar">{['not-started', 'in-progress', 'completed'].map(statusId => <div key={statusId} className="min-w-[280px] max-w-[280px] flex flex-col h-full"><h3 className="font-bold mb-3 px-2 text-sm">{statusId === 'not-started' ? t.goals.notStarted : statusId === 'in-progress' ? t.goals.inProgress : t.common.completed}</h3><div className="flex-1 bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl p-2 overflow-y-auto space-y-3 custom-scrollbar">{filteredGoals.filter(goal => goal.status === statusId).map(goal => <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedGoalId(goal.id)} />)}</div></div>)}</div>}
        </>}

      {isFormOpen && <GoalForm initialData={selectedGoal || formInitialData || {}} onSave={handleSave} onClose={() => { setIsFormOpen(false); setFormInitialData(null); }} />}
      {isTemplateOpen && <GoalTemplates onSelect={handleTemplateSelect} onClose={() => setIsTemplateOpen(false)} />}
      {isAIPlannerOpen && <AIGoalPlannerModal onGoalGenerated={handleAIGenerated} onClose={() => setIsAIPlannerOpen(false)} />}
      {selectedGoal && !isFormOpen && !isTemplateOpen && !isAIPlannerOpen && <GoalDetail goal={selectedGoal} onClose={() => setSelectedGoalId(null)} onEdit={() => setIsFormOpen(true)} />}
    </div>
  );
};

export default Goals;
