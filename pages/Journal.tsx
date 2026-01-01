
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, LayoutGrid, List, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { JournalEntryCard } from '../components/journal/JournalEntryCard';
import { JournalForm } from '../components/journal/JournalForm';
import { JournalStats } from '../components/journal/JournalStats';
import { PinModal } from '../components/journal/PinModal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { JournalEntry, LanguageCode } from '../types';

const Journal: React.FC = () => {
  const { entries, loading, addEntry, updateEntry, deleteEntry, toggleFavorite } = useJournal();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('timeline');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState(t.common.all);

  const [pinModalState, setPinModalState] = useState<{ isOpen: boolean; entry: JournalEntry | null }>({ isOpen: false, entry: null });

  const allTags = [t.common.all, ...Array.from(new Set(entries.flatMap(e => e.tags)))];

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Immersive Header - Themed */}
      <header className="relative p-5 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] bg-primary-600 text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80">
               <Sparkles size={12} /> {settings?.preferences?.language === 'ar' ? 'مركز التأمل' : 'Reflection Hub'}
            </div>
            <h1 className="text-2xl sm:text-5xl font-black font-serif tracking-tight">{t.journal.title}</h1>
            <p className="text-white/70 max-w-md text-sm sm:text-lg font-serif italic">{t.journal.subtitle}</p>
            
            <div className="flex gap-4 pt-2">
               <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold">{entries.length}</span>
                  <span className="text-[9px] font-black uppercase text-white/50 tracking-widest">{t.journal.entries}</span>
               </div>
               <div className="w-px h-8 bg-white/10" />
               <div className="flex flex-col text-orange-300">
                  <span className="text-xl sm:text-2xl font-bold flex items-center gap-1.5">
                     <TrendingUp size={18} /> {streak}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.journal.dayStreak}</span>
               </div>
            </div>
          </div>

          <button 
            onClick={() => { setSelectedEntry(null); setIsFormOpen(true); }}
            className="group shrink-0 bg-white hover:bg-gray-100 text-primary-600 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl flex items-center gap-3 font-black text-sm sm:text-lg shadow-xl shadow-white/5 transition-all active:scale-95"
          >
            <Plus size={20} sm-size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>{t.journal.newEntry}</span>
          </button>
        </div>
      </header>

      {/* Navigation and Content Controls */}
      <div className="sticky top-0 z-20 py-2 -mx-2 px-2 md:mx-0 md:px-0">
         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-1 rounded-xl self-start overflow-x-auto no-scrollbar max-w-full">
               <button 
                  onClick={() => setViewMode('timeline')} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'timeline' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                  <List size={16} strokeWidth={2.5} /> {t.journal.timeline}
               </button>
               <button 
                  onClick={() => setViewMode('stats')} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'stats' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                  <LayoutGrid size={16} strokeWidth={2.5} /> {t.journal.insights}
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
                       className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                     />
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />
                  <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[140px] md:max-w-none">
                     {allTags.slice(0, 3).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilterTag(tag)}
                          className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterTag === tag ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50'}`}
                        >
                           {tag}
                        </button>
                     ))}
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
