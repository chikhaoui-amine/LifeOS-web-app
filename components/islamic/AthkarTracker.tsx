
import React, { useMemo } from 'react';
import { Sun, Moon, Star, Check, AlertCircle } from 'lucide-react';
import { useIslamic } from '../../context/IslamicContext';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { getHijriKey } from '../../utils/islamicUtils';
import { LanguageCode } from '../../types';

interface AthkarTrackerProps {
  dateKey?: string;
}

export const AthkarTracker: React.FC<AthkarTrackerProps> = ({ dateKey }) => {
  const { getAdhkarForDate, updateAdhkarProgress, settings: islamicSettings } = useIslamic();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);

  const targetKey = dateKey || "";
  const dailyAdhkar = targetKey ? getAdhkarForDate(targetKey) : getAdhkarForDate("");
  
  // Determine if the viewed day is in the past
  const todayKey = useMemo(() => getHijriKey(new Date(), islamicSettings.hijriAdjustment), [islamicSettings.hijriAdjustment]);
  const isPast = targetKey < todayKey && targetKey !== "";

  const toggleMorning = () => updateAdhkarProgress({ morningCompleted: !dailyAdhkar.morningCompleted }, targetKey);
  const toggleEvening = () => updateAdhkarProgress({ eveningCompleted: !dailyAdhkar.eveningCompleted }, targetKey);
  const toggleNight = () => updateAdhkarProgress({ nightCompleted: !dailyAdhkar.nightCompleted }, targetKey);

  const completedCount = [dailyAdhkar.morningCompleted, dailyAdhkar.eveningCompleted, dailyAdhkar.nightCompleted].filter(Boolean).length;

  const renderItem = (label: string, isCompleted: boolean, toggle: () => void, Icon: any, timeColor: string) => {
    const isMissed = isPast && !isCompleted;
    
    return (
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all group hover:scale-[1.02] active:scale-[0.98]
          ${isCompleted 
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
              : isMissed
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800'
          }
        `}
      >
         <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors 
              ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isMissed ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}
            `}>
               <Icon size={18} />
            </div>
            <div className="text-left">
               <span className={`font-bold text-sm sm:text-base block ${isCompleted ? 'text-emerald-900 dark:text-emerald-100' : isMissed ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
               </span>
               {isMissed && (
                 <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <AlertCircle size={10} strokeWidth={3} /> Missed
                 </span>
               )}
            </div>
         </div>
         <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all 
            ${isCompleted 
               ? 'bg-emerald-500 border-emerald-500 text-white' 
               : isMissed
                 ? 'border-red-300 dark:border-red-800 text-transparent'
                 : 'border-gray-300 dark:border-gray-600'
            }
         `}>
            {isCompleted && <Check size={12} strokeWidth={3} />}
         </div>
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
       <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white font-serif text-base sm:text-lg">{t.deen.adhkar}</h3>
          <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
             {completedCount}/3 {t.common.done}
          </span>
       </div>

       <div className="space-y-3 sm:space-y-4 flex-1">
          {renderItem(t.deen.morningAdhkar, dailyAdhkar.morningCompleted, toggleMorning, Sun, 'text-orange-500')}
          {renderItem(t.deen.eveningAdhkar, dailyAdhkar.eveningCompleted, toggleEvening, Moon, 'text-indigo-500')}
          {renderItem(t.deen.beforeSleep, dailyAdhkar.nightCompleted, toggleNight, Star, 'text-purple-500')}
       </div>
    </div>
  );
};
