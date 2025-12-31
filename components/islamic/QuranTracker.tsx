
import React, { useState, useMemo } from 'react';
import { BookOpen, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useIslamic } from '../../context/IslamicContext';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { LanguageCode } from '../../types';

export const QuranTracker: React.FC = () => {
  const { quran, updateQuranProgress, resetQuranProgress } = useIslamic();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  const [expandedHizb, setExpandedHizb] = useState<number | null>(null);

  const TOTAL_HIZB = 60;
  const RUBUS_PER_HIZB = 4;
  const TOTAL_RUBUS = TOTAL_HIZB * RUBUS_PER_HIZB; 

  const totalCompleted = quran.completedRubus.length;
  const progressPercentage = Math.round((totalCompleted / TOTAL_RUBUS) * 100);

  const toggleRubu = (rubuIndex: number) => {
    const isCompleted = quran.completedRubus.includes(rubuIndex);
    let newCompleted;
    if (isCompleted) {
      newCompleted = quran.completedRubus.filter(i => i !== rubuIndex);
    } else {
      newCompleted = [...quran.completedRubus, rubuIndex];
    }
    updateQuranProgress({ completedRubus: newCompleted });
  };

  const toggleHizb = (hizbIndex: number) => {
    const startRubu = hizbIndex * RUBUS_PER_HIZB;
    const hizbRubus = Array.from({length: RUBUS_PER_HIZB}, (_, k) => startRubu + k);
    const allCompleted = hizbRubus.every(r => quran.completedRubus.includes(r));
    let newCompleted = [...quran.completedRubus];
    if (allCompleted) {
        newCompleted = newCompleted.filter(r => !hizbRubus.includes(r));
    } else {
        hizbRubus.forEach(r => {
            if (!newCompleted.includes(r)) newCompleted.push(r);
        });
    }
    updateQuranProgress({ completedRubus: newCompleted });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col h-[600px] w-full">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        
        <div className="flex items-start justify-between mb-6 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                 <BookOpen size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-gray-900 dark:text-white font-serif text-lg">{t.deen.quran}</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{totalCompleted} / {TOTAL_RUBUS} Rubu'</p>
              </div>
           </div>
           
           <button 
             onClick={resetQuranProgress}
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
             title="Reset"
           >
              <RefreshCw size={18} />
           </button>
        </div>

        <div className="mb-6 shrink-0">
           <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>{t.deen.overallProgress}</span>
              <span>{progressPercentage}%</span>
           </div>
           <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercentage}%` }}
              >
                 <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30 animate-pulse" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 custom-scrollbar flex-1 content-start pb-4">
           {Array.from({ length: TOTAL_HIZB }).map((_, hizbIndex) => {
              const startRubu = hizbIndex * RUBUS_PER_HIZB;
              const hizbRubus = Array.from({length: RUBUS_PER_HIZB}, (_, k) => startRubu + k);
              const completedInHizb = hizbRubus.filter(r => quran.completedRubus.includes(r)).length;
              const isHizbComplete = completedInHizb === RUBUS_PER_HIZB;
              const isExpanded = expandedHizb === hizbIndex;

              return (
                 <div key={hizbIndex} className={`rounded-xl border transition-all duration-300 flex flex-col ${isHizbComplete ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div 
                        className="flex items-center justify-between p-3 cursor-pointer select-none"
                        onClick={() => setExpandedHizb(isExpanded ? null : hizbIndex)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isHizbComplete ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {hizbIndex + 1}
                            </div>
                            <div className="flex flex-col">
                                <h4 className={`text-xs font-bold uppercase tracking-wide ${isHizbComplete ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>{t.deen.hizb} {hizbIndex + 1}</h4>
                                <div className="flex gap-0.5 mt-1">
                                   {hizbRubus.map(r => (
                                      <div key={r} className={`w-1.5 h-1.5 rounded-full ${quran.completedRubus.includes(r) ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                                   ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="p-3 pt-0 border-t border-gray-100 dark:border-gray-700/50 mt-1 animate-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {hizbRubus.map((rubuId, i) => (
                                    <button
                                        key={rubuId}
                                        onClick={() => toggleRubu(rubuId)}
                                        className={`h-8 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${quran.completedRubus.includes(rubuId) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleHizb(hizbIndex); }}
                                className="mt-3 w-full py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                                {isHizbComplete ? t.deen.markUndone : t.deen.completeHizb}
                            </button>
                        </div>
                    )}
                 </div>
              );
           })}
        </div>
    </div>
  );
};
