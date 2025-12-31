
import React, { useMemo } from 'react';
import { useIslamic } from '../../context/IslamicContext';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { StatsCard } from '../StatsCard';
import { CheckCircle2, BookOpen, Sun, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { DonutChart, BarChart } from '../Charts';
import { getHijriKey } from '../../utils/islamicUtils';
import { LanguageCode } from '../../types';

export const IslamicStats: React.FC = () => {
  const { prayers, quran, adhkar, settings: islamicSettings } = useIslamic();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  // --- Calculate Last 7 Days Data ---
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = getHijriKey(d, islamicSettings.hijriAdjustment);
        const dayName = d.toLocaleDateString(settings?.preferences?.language, { weekday: 'short' });
        
        const dayPrayer = prayers.find(p => p.date === key);
        const prayerCount = dayPrayer ? 
            (dayPrayer.fajr ? 1 : 0) + 
            (dayPrayer.dhuhr ? 1 : 0) + 
            (dayPrayer.asr ? 1 : 0) + 
            (dayPrayer.maghrib ? 1 : 0) + 
            (dayPrayer.isha ? 1 : 0) : 0;

        days.push({
            label: dayName,
            value: prayerCount,
            color: prayerCount === 5 ? '#10b981' : prayerCount > 0 ? '#3b82f6' : '#e5e7eb',
            payload: { fullDate: key }
        });
    }
    return days;
  }, [prayers, islamicSettings.hijriAdjustment, settings?.preferences?.language]);

  const adhkarChartData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = getHijriKey(d, islamicSettings.hijriAdjustment);
        const dayName = d.toLocaleDateString(settings?.preferences?.language, { weekday: 'short' });
        
        const dayAdhkar = adhkar.find(a => a.date === key);
        const count = dayAdhkar ? 
            (dayAdhkar.morningCompleted ? 1 : 0) + 
            (dayAdhkar.eveningCompleted ? 1 : 0) + 
            (dayAdhkar.nightCompleted ? 1 : 0) : 0;

        days.push({
            label: dayName,
            value: count,
            color: count === 3 ? '#fbbf24' : count > 0 ? '#fcd34d' : '#f3f4f6',
            payload: { fullDate: key }
        });
    }
    return days;
  }, [adhkar, islamicSettings.hijriAdjustment, settings?.preferences?.language]);

  const prayerRate = useMemo(() => {
    const totalPossible = 7 * 5;
    const totalDone = chartData.reduce((acc, d) => acc + d.value, 0);
    return Math.round((totalDone / totalPossible) * 100);
  }, [chartData]);

  const missedPrayers = useMemo(() => {
    // Count days with incomplete prayers in recorded history (excluding today)
    const todayKey = getHijriKey(new Date(), islamicSettings.hijriAdjustment);
    return prayers.filter(p => {
       if (p.date === todayKey) return false;
       const fardh = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
       // A prayer is missed if it's not done AND not qadha performed
       return fardh.some(f => !p[f] && !p[`${f}Qadha` as keyof typeof p]);
    }).length;
  }, [prayers, islamicSettings.hijriAdjustment]);

  return (
    <div className="space-y-6">
       
       {/* Top Row: Key Metrics */}
       <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatsCard 
            title="Consistency" 
            value={`${prayerRate}%`} 
            icon={Activity} 
            color={prayerRate > 80 ? 'emerald' : 'orange'} 
            subtitle="Last 7 Days" 
          />
          <StatsCard 
            title="Missed Days" 
            value={missedPrayers} 
            icon={AlertCircle} 
            color="red" 
            subtitle="Pending Makeup" 
          />
          <StatsCard 
            title={t.deen.quran} 
            value={quran.completedRubus.length} 
            icon={BookOpen} 
            color="blue" 
            subtitle={`/ 240 Rubu'`} 
          />
          <StatsCard 
            title="Adhkar Streak" 
            value={adhkar.filter(a => a.morningCompleted && a.eveningCompleted).length} 
            icon={Sun} 
            color="amber" 
            subtitle="Full Days" 
          />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Prayer Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
             <div className="mb-6">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <TrendingUp size={18} className="text-emerald-500" /> Prayer History
                </h4>
                <p className="text-xs text-gray-500">Prayers performed over the last 7 days.</p>
             </div>
             <div className="flex-1 min-h-[200px]">
                <BarChart data={chartData} height={200} goalValue={5} />
             </div>
          </div>

          {/* Adhkar Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
             <div className="mb-6">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <Sun size={18} className="text-amber-500" /> Adhkar Habit
                </h4>
                <p className="text-xs text-gray-500">Daily adhkar consistency.</p>
             </div>
             <div className="flex-1 min-h-[200px]">
                <BarChart data={adhkarChartData} height={200} goalValue={3} />
             </div>
          </div>

       </div>
    </div>
  );
};
