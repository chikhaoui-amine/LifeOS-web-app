
import React, { useMemo } from 'react';
import { Check, Clock, Compass, Sun, Moon, Star, Sunrise, AlertCircle } from 'lucide-react';
import { useIslamic } from '../../context/IslamicContext';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { getPrayerTimes } from '../../utils/islamicUtils';
import { PrayerName, DailyPrayers, LanguageCode } from '../../types';

interface SalahTrackerProps {
  dateKey?: string;
  gregorianDate?: Date;
}

export const SalahTracker: React.FC<SalahTrackerProps> = ({ dateKey, gregorianDate }) => {
  const { getPrayersForDate, updatePrayerStatus, qiblaDirection, settings: islamicSettings } = useIslamic();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);

  // Use passed date or fallback to today
  const targetDate = gregorianDate || new Date();
  const targetKey = dateKey || ""; 

  // Determine if date is in the past
  const isPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewDate = new Date(targetDate);
    viewDate.setHours(0, 0, 0, 0);
    return viewDate.getTime() < today.getTime();
  }, [targetDate]);

  // Get data for specific day
  const dailyData = targetKey ? getPrayersForDate(targetKey) : getPrayersForDate(""); 
  
  // Calculate prayer times for the SPECIFIC day being viewed
  const dailyPrayerTimes = useMemo(() => {
     return getPrayerTimes(targetDate, islamicSettings.location.lat, islamicSettings.location.lng);
  }, [targetDate, islamicSettings.location]);

  const fardhPrayers: { key: PrayerName; label: string; icon: any }[] = [
    { key: 'Fajr', label: 'Fajr', icon: Sunrise },
    { key: 'Dhuhr', label: 'Dhuhr', icon: Sun },
    { key: 'Asr', label: 'Asr', icon: Sun },
    { key: 'Maghrib', label: 'Maghrib', icon: Moon },
    { key: 'Isha', label: 'Isha', icon: Star },
  ];

  const sunnahPrayers = [
    { key: 'sunnahFajr', label: 'Fajr Sunnah', count: 2 },
    { key: 'duha', label: 'Duha', count: 2 },
    { key: 'sunnahDhuhr', label: 'Dhuhr Sunnah', count: 4 },
    { key: 'sunnahMaghrib', label: 'Maghrib Sunnah', count: 2 },
    { key: 'sunnahIsha', label: 'Isha Sunnah', count: 2 },
    { key: 'witr', label: 'Witr', count: '1+' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-serif">{t.deen.fardh}</h2>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-white border border-emerald-100 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full shadow-sm">
             <Compass size={12} className={`transition-transform duration-700 ease-out`} style={{ transform: `rotate(${qiblaDirection}deg)` }} />
             {t.deen.qibla}: {Math.round(qiblaDirection)}°
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {fardhPrayers.map((prayer) => {
            const prayerKey = prayer.key.toLowerCase() as keyof DailyPrayers;
            const qadhaKey = `${prayerKey}Qadha` as keyof DailyPrayers;
            
            const isDone = dailyData[prayerKey] as boolean;
            const isQadha = dailyData[qadhaKey] as boolean;
            const time = dailyPrayerTimes[prayer.key];
            
            return (
              <div key={prayer.key} className="group">
                <div className={`
                  flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border 
                  ${isDone 
                    ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 shadow-sm' 
                    : isQadha
                      ? 'bg-white border-red-200 dark:bg-red-900/10 dark:border-red-800'
                      : 'bg-white border-gray-100 dark:bg-gray-800/50 dark:border-gray-700'
                  }
                `}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        if(isQadha) updatePrayerStatus(qadhaKey, false, targetKey);
                        updatePrayerStatus(prayerKey, !isDone, targetKey);
                      }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-gray-700 text-gray-300 dark:text-gray-500 border border-gray-200 dark:border-gray-600 hover:border-emerald-200'}`}
                    >
                      <Check size={16} strokeWidth={3} className={isDone ? 'scale-100' : 'scale-0'} />
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-sm sm:text-base ${isDone ? 'text-emerald-900 dark:text-emerald-100' : isQadha ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200'}`}>{prayer.label}</h3>
                          {isQadha && <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded font-bold uppercase">{t.deen.missed}</span>}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-1">
                         <Clock size={10} /> {time || '--:--'}
                      </p>
                    </div>
                  </div>

                  {!isDone && (
                    <button 
                      onClick={() => updatePrayerStatus(qadhaKey, !isQadha, targetKey)}
                      className={`text-[9px] sm:text-[10px] font-medium px-2 py-1 rounded border transition-colors ${isQadha ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-400'}`}
                    >
                       {t.deen.makeup}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
         <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-serif mb-4 sm:mb-6">{t.deen.sunnah}</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {sunnahPrayers.map((prayer) => {
               const isDone = dailyData[prayer.key as keyof typeof dailyData];
               const isMissed = isPast && !isDone;

               return (
                 <div key={prayer.key} className="group">
                    <div className={`
                      flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border h-full
                      ${isDone 
                        ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 shadow-sm' 
                        : isMissed
                          ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                          : 'bg-white border-gray-100 dark:bg-gray-800/50 dark:border-gray-700'
                      }
                    `}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => updatePrayerStatus(prayer.key as any, !isDone, targetKey)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center transition-all 
                            ${isDone 
                                ? 'bg-emerald-500 text-white shadow-md' 
                                : isMissed
                                    ? 'bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/30 dark:border-red-800'
                                    : 'bg-white dark:bg-gray-700 text-gray-300 dark:text-gray-500 border border-gray-200 dark:border-gray-600 hover:border-emerald-200'
                            }`}
                        >
                          {isMissed ? <AlertCircle size={16} /> : <Check size={16} strokeWidth={3} className={isDone ? 'scale-100' : 'scale-0'} />}
                        </button>
                        
                        <div className="min-w-0">
                          <h3 className={`font-bold text-xs sm:text-sm truncate ${isDone ? 'text-emerald-900 dark:text-emerald-100' : isMissed ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200'}`}>
                            {prayer.label}
                          </h3>
                          <div className="flex items-center gap-1.5">
                              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                                {prayer.count} {t.deen.rakat}
                              </p>
                              {isMissed && (
                                <span className="text-[8px] font-black text-red-500 uppercase tracking-wider bg-red-100 dark:bg-red-900/40 px-1 rounded flex items-center gap-0.5">
                                   Missed
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
               )
            })}
         </div>
      </div>
    </div>
  );
};
