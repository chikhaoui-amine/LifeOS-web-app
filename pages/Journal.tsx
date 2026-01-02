
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, LayoutGrid, List, Sparkles, TrendingUp, Heart, Image as ImageIcon, Calendar } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { JournalEntryCard } from '../components/journal/JournalEntryCard';
import { JournalForm } from '../components/journal/JournalForm';
import { JournalStats } from '../components/journal/JournalStats';
import { PinModal } from '../components/journal/PinModal';
import { JournalCalendar } from '../components/journal/JournalCalendar';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { JournalEntry, LanguageCode } from '../types';

const Journal: React.FC = () => {
  const { entries, loading, addEntry, updateEntry, deleteEntry, toggleFavorite } = useJournal();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [viewMode, setViewMode] = useState<'timeline' | 'stats' | 'calendar'>('timeline');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState(t.common.all);

  const [pinModalState, setPinModalState] = useState<{ isOpen: boolean; entry: JournalEntry | null }>({ isOpen: false, entry: null });

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
       const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             e.plainText.toLowerCase().includes(searchQuery.toLowerCase());
       const matchesTag = filterTag === t.common.all || filterTag === 'All' || e.tags.includes(filterTag);
       return matchesSearch && matchesTag;
    }).sort((a: JournalEntry, b: JournalEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchQuery, filterTag, t]);

  const handleSave = async (data: any) => {
    if (selectedEntry) {
       await updateEntry(selectedEntry.id, data);
       setSelectedEntry(null);
    } else {
       await addEntry(data);
    }
    setIsFormOpen(false);
  };

  const handleEntryClick = (entry: JournalEntry) => {
    if (entry.securityPin) {
       setPinModalState({ isOpen: true, entry });
    } else {
       openEditor(entry);
    }
  };

  const openEditor = (entry: JournalEntry) => {
     setSelectedEntry(entry);
     setIsFormOpen(true);
  };

  const handlePinVerify = (pin: string) => {
     if (pinModalState.entry && pin === pinModalState.entry.securityPin) {
        setPinModalState({ isOpen: false, entry: null });
        openEditor(pinModalState.entry);
     } else {
        alert("Incorrect PIN");
     }
  };

  const streak = useMemo(() => {
    const dates = entries.map(e => e.date.split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    return uniqueDates.length > 0 ? 1 : 0; 
  }, [entries]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-1">
      
      {/* Immersive Premium Header */}
      <header 
        className="relative p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-primary-600 text-white overflow-hidden transition-all duration-700 group"
        style={{
          background: `linear-gradient(135deg, var(--color-primary-600) 0%, rgba(var(--color-primary-rgb), 0.7) 100%)`,
          boxShadow: `0 25px 60px -15px rgba(var(--color-primary-rgb), 0.4), inset 0 2px 20px rgba(255,255,255,0.15)`
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_12s_infinite_linear] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[110px] pointer-events-none mix-blend-soft-light group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-black/20 rounded-full blur-[90px] pointer-events-none opacity-60" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
               <Sparkles size={12} className="animate-pulse" /> {settings?.preferences?.language === 'ar' ? 'مركز التأمل' : 'Reflection Sanctuary'}
            </div>
            <h1 className="text-3xl sm:text-6xl font-black font-serif tracking-tighter drop-shadow-xl leading-none">{t.journal.title}</h1>
            <p className="text-white/80 max-w-md text-sm sm:text-xl font-serif italic leading-relaxed">{t.journal.subtitle}</p>
            
            <div className="flex gap-6 pt-4">
               <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight">{entries.length}</span>
                  <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">{t.journal.entries}</span>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <div className="flex flex-col text-orange-200">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                     <TrendingUp size={22} className="drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" /> {streak}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t.journal.dayStreak}</span>
               </div>
            </div>
          </div>

          <button 
            onClick={() => { setSelectedEntry(null); setIsFormOpen(true); }}
            className="group shrink-0 bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 sm:px-10 sm:py-5 rounded-[2rem] flex items-center gap-4 font-black text-sm sm:text-lg shadow-2xl shadow-black/10 transition-all active:scale-95 active:rotate-1 border-b-4 border-gray-200"
          >
            <Plus size={24} strokeWidth={4} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="uppercase tracking-widest">{t.journal.newEntry}</span>
          </button>
        </div>
      </header>

      {/* Navigation and Content Controls */}
      <div className="sticky top-0 z-20 py-2 -mx-2 px-2 md:mx-0 md:px-0">
         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-1 rounded-xl self-start overflow-x-auto no-scrollbar max-w-full">
               <button 
                  onClick={() => setViewMode('timeline')} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                  <List size={16} strokeWidth={3} /> {t.journal.timeline}
               </button>
               <button 
                  onClick={() => setViewMode('calendar')} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                  <Calendar size={16} strokeWidth={3} /> {t.journal.calendar}
               </button>
               <button 
                  onClick={() => setViewMode('stats')} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'stats' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                  <LayoutGrid size={16} strokeWidth={3} /> {t.journal.insights}
               </button>
            </div>

            {viewMode === 'timeline' && (
               <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="text" 
                       placeholder={t.journal.search} 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/20 text-xs sm:text-sm font-bold text-gray-900 dark:text-white"
                     />
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <LoadingSkeleton count={6} type="card" />
        ) : (
          <>
            {viewMode === 'timeline' && (
               filteredEntries.length === 0 ? (
                 <EmptyState 
                    icon={BookOpen} 
                    title={t.journal.empty} 
                    description={searchQuery ? "No entries match your search." : t.journal.emptyDesc}
                    actionLabel={!searchQuery ? t.journal.newEntry : undefined}
                    onAction={() => setIsFormOpen(true)}
                 />
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredEntries.map(entry => (
                       <JournalEntryCard 
                          key={entry.id} 
                          entry={entry} 
                          onClick={() => handleEntryClick(entry)} 
                          onFavorite={() => toggleFavorite(entry.id)}
                       />
                    ))}
                 </div>
               )
            )}

            {viewMode === 'calendar' && (
               <JournalCalendar 
                  entries={entries} 
                  onDateSelect={() => {}} 
                  onEntryClick={handleEntryClick} 
               />
            )}

            {viewMode === 'stats' && <JournalStats />}
          </>
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
         <JournalForm 
           initialData={selectedEntry || {}} 
           onSave={handleSave} 
           onClose={() => { setIsFormOpen(false); setSelectedEntry(null); }} 
           onDelete={deleteEntry}
         />
      )}

      <PinModal 
         isOpen={pinModalState.isOpen}
         onClose={() => setPinModalState({ isOpen: false, entry: null })}
         onVerify={handlePinVerify}
      />
    </div>
  );
};

export default Journal;
