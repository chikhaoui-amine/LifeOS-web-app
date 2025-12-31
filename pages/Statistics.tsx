
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, CheckCircle2, Award, Zap, 
  Crown, Star, Activity,
  Trophy, Medal, Target
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { formatDateKey, calculateBestStreak } from '../utils/dateUtils';
import { StatsCard } from '../components/StatsCard';
import { LineChart } from '../components/Charts';
import { HabitStatsDetail } from '../components/HabitStatsDetail';
import { Habit, LanguageCode } from '../types';

type TimeRange = '7d' | '30d' | '90d' | '1y';

const Statistics: React.FC = () => {
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const daysCount = useMemo(() => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }, [timeRange]);

  const statsSummary = useMemo(() => {
    const totalHabitCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
    const completedTasks = tasks.filter(t => t.completed);
    const totalTasksCompleted = completedTasks.length;
    const habitXP = totalHabitCompletions * 10;
    const taskXP = totalTasksCompleted * 20;
    const subtaskXP = tasks.reduce((acc, t) => acc + t.subtasks.filter(s => s.completed).length * 5, 0);
    const goalXP = goals.filter(g => g.status === 'completed').length * 100;
    const totalXP = habitXP + taskXP + subtaskXP + goalXP;
    
    let level = 1;
    let xpAccumulated = 0;
    while (totalXP >= xpAccumulated + level * 500) {
      xpAccumulated += level * 500;
      level++;
    }
    const xpInCurrentLevel = totalXP - xpAccumulated;
    const xpNeededForNext = level * 500;
    const levelPercentage = (xpInCurrentLevel / xpNeededForNext) * 100;
    const allTimeBestStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateBestStreak(h.completedDates))) : 0;
    const activeGoals = goals.filter(g => g.status === 'in-progress').length;

    return { totalHabitCompletions, totalTasksCompleted, totalXP, level, xpInCurrentLevel, xpNeededForNext, levelPercentage, allTimeBestStreak, activeGoals };
  }, [habits, tasks, goals]);

  const momentumData = useMemo(() => {
    const data: number[] = [];
    const labels: string[] = [];
    const step = daysCount > 31 ? Math.ceil(daysCount / 15) : 1; 
    
    for (let i = daysCount - 1; i >= 0; i -= step) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const dayIndex = d.getDay();
      const scheduledHabits = habits.filter(h => !h.archived && h.frequency.days.includes(dayIndex) && new Date(h.createdAt) <= d);
      const rate = scheduledHabits.length === 0 ? 0 : Math.round((scheduledHabits.filter(h => h.completedDates.includes(key)).length / scheduledHabits.length) * 100);
      data.push(rate);
      labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    }
    return { data, labels };
  }, [habits, daysCount]);

  const activityHeatmap = useMemo(() => {
    const heatmap = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const count = habits.reduce((acc, h) => acc + (h.completedDates.includes(key) ? 1 : 0), 0) +
                    tasks.filter(t => t.completed && t.completedAt?.startsWith(key)).length;
      heatmap.push({ date: key, count, month: d.toLocaleString('default', { month: 'short' }) });
    }
    return heatmap;
  }, [habits, tasks]);

  // Texture Class
  const boxClass = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] p-5 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 px-1">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{t.stats.title}</h1>
          <p className="text-gray-400 mt-1 font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2">
             <Activity size={12} className="text-primary-500" /> {t.stats.subtitle}
          </p>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur p-1 rounded-xl border border-gray-100 dark:border-gray-700 inline-flex shadow-sm self-start">
           {(['7d', '30d', '90d', '1y'] as TimeRange[]).map(r => (
             <button
               key={r}
               onClick={() => setTimeRange(r)}
               className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all ${timeRange === r ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
             >
               {r.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
         <div className="lg:col-span-2 relative group h-full">
            <div className="bg-primary-600 rounded-[2rem] p-5 sm:p-8 text-white shadow-xl relative z-10 overflow-hidden flex flex-col justify-between">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
               
               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 rotate-2 shadow-inner">
                       <Crown size={32} sm-size={40} className="text-yellow-300 drop-shadow-md" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-primary-900 font-black shadow-lg border-2 border-primary-600 text-[10px] sm:text-xs">
                       {statsSummary.level}
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                     <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2 text-center sm:text-left">
                        <div>
                           <p className="text-white/60 font-black uppercase tracking-widest text-[9px] mb-1">{t.stats.xpRank}</p>
                           <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{t.stats.architect}</h2>
                        </div>
                        <div className="sm:text-right">
                           <p className="text-lg sm:text-xl font-black">{statsSummary.totalXP} <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">XP</span></p>
                        </div>
                     </div>
                     <div className="h-2 sm:h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${statsSummary.levelPercentage}%` }} />
                     </div>
                     <p className="text-[9px] font-black uppercase text-white/50 mt-2 tracking-widest text-center sm:text-right">Level {statsSummary.level + 1} Progress</p>
                  </div>
               </div>
            </div>
         </div>

         <div className={`${boxClass} flex flex-col justify-between`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4 sm:mb-6">
               <Trophy size={14} className="text-amber-500" /> {t.stats.milestones}
            </h3>
            <div className="grid grid-cols-1 gap-3">
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${statsSummary.totalXP >= 1000 ? 'bg-amber-50 text-amber-500 shadow-sm' : 'bg-gray-50 text-gray-300 dark:bg-gray-700/50'}`}>
                     <Medal size={16} sm-size={20} />
                  </div>
                  <div>
                     <p className={`font-black text-[10px] uppercase tracking-widest ${statsSummary.totalXP >= 1000 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Power User</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase">1k XP</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${statsSummary.allTimeBestStreak >= 30 ? 'bg-indigo-50 text-indigo-500 shadow-sm' : 'bg-gray-50 text-gray-300 dark:bg-gray-700/50'}`}>
                     <Star size={16} sm-size={20} />
                  </div>
                  <div>
                     <p className={`font-black text-[10px] uppercase tracking-widest ${statsSummary.allTimeBestStreak >= 30 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>The Consistent</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase">30d Streak</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard title="Checks" value={statsSummary.totalHabitCompletions} icon={CheckCircle2} color="emerald" />
        <StatsCard title="Completed" value={statsSummary.totalTasksCompleted} icon={Award} color="primary" />
        <StatsCard title="Best Streak" value={`${statsSummary.allTimeBestStreak}d`} icon={Zap} color="orange" />
        <StatsCard title="Focus" value={statsSummary.activeGoals} icon={Target} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className={`${boxClass} lg:col-span-2 flex flex-col`}>
           <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm sm:text-lg">{t.stats.momentum}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{timeRange} Performance</p>
              </div>
           </div>
           <div className="flex-1 min-h-[200px] sm:min-h-[220px]">
              <LineChart data={momentumData.data} labels={momentumData.labels} color="rgb(var(--color-primary-rgb))" height={220} />
           </div>
        </div>

        <div className={`${boxClass} flex flex-col justify-center`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 sm:mb-6 flex items-center justify-between">
              <span>{t.stats.flow}</span>
              <span className="text-[9px]">90 Days</span>
            </h3>
            <div className="grid grid-cols-10 gap-1.5 justify-center">
               {activityHeatmap.map((day, i) => {
                  let color = 'bg-gray-50 dark:bg-gray-700/30';
                  if (day.count > 0) color = 'bg-primary-100 dark:bg-primary-900/30';
                  if (day.count > 3) color = 'bg-primary-400 shadow-sm';
                  if (day.count > 6) color = 'bg-primary-700 scale-105';
                  return <div key={i} className={`aspect-square rounded-sm transition-all ${color}`} />;
               })}
            </div>
        </div>
      </div>
      
      {selectedHabit && (
        <HabitStatsDetail habit={selectedHabit} onClose={() => setSelectedHabit(null)} />
      )}
    </div>
  );
};

export default Statistics;
