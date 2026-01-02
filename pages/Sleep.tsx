
import React, { useState, useMemo } from 'react';
import { Moon, Calendar as CalendarIcon, BarChart2, Plus, ArrowRight, Sun, Edit3, Sparkles, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Info, Activity, Settings, Target, Clock, Zap, HeartPulse } from 'lucide-react';
import { useSleep } from '../context/SleepContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { SleepLogModal } from '../components/sleep/SleepLogModal';
import { SleepSettingsModal } from '../components/sleep/SleepSettingsModal';
import { ProgressRing } from '../components/ProgressRing';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { getTodayKey, formatDateKey, getDaysInMonth, isSameMonth, isToday } from '../utils/dateUtils';
import { LineChart } from '../components/Charts';
import { LanguageCode } from '../types';

const Sleep: React.FC = () => {
  const { logs, settings, loading, addSleepLog, updateSleepLog, getLogForDate, getAverageSleep, calculateSleepScore } = useSleep();
  const { settings: globalSettings } = useSettings();
  const t = useMemo(() => getTranslation((globalSettings?.preferences?.language || 'en') as LanguageCode), [globalSettings?.preferences?.language]);
  
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // --- Data Processing ---
  const todayLog = getLogForDate(selectedDate);
  const avgDurationMins = getAverageSleep(7);
  
  const recentLogs = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return getLogForDate(formatDateKey(d));
    }).filter(Boolean) as any[]; 
  }, [logs, getLogForDate]);

  const logsLast7Days = recentLogs.length;

  const cumulativeDebtHours = useMemo(() => {
    const targetMins = settings.targetHours * 60;
    let debt = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const log = getLogForDate(formatDateKey(d));
        if (log) {
            debt += (targetMins - log.durationMinutes);
        }
    }
    return Math.max(0, Math.round(debt / 60));
  }, [logs, settings.targetHours, getLogForDate]);

  const healthStatus = useMemo(() => {
    if (logsLast7Days < 3) {
        return {
            type: 'info',
            title: 'Calibrating Sleep Monitor',
            message: `Log your sleep for at least 3 days (currently ${logsLast7Days}/3) to unlock personalized health warnings.`,
            color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
            icon: <Activity size={24} className="text-blue-600 dark:text-blue-400" />
        };
    }

    const avgQuality = recentLogs.reduce((acc, l) => acc + l.qualityRating, 0) / (recentLogs.length || 1);
    
    let maxWakeDiffMinutes = 0;
    if (recentLogs.length > 1) {
        const wakeTimes = recentLogs.map(l => {
            const d = new Date(l.wakeTime);
            return d.getHours() * 60 + d.getMinutes();
        });
        const minWake = Math.min(...wakeTimes);
        const maxWake = Math.max(...wakeTimes);
        maxWakeDiffMinutes = maxWake - minWake;
    }

    if (cumulativeDebtHours >= settings.targetHours) {
      return { 
        type: 'critical', 
        title: 'Severe Sleep Deprivation', 
        message: `Your sleep debt is ${cumulativeDebtHours} hours—equivalent to a full night lost. Prioritize recovery sleep immediately.`,
        color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 shadow-lg shadow-rose-500/10',
        icon: <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400 animate-pulse" />
      };
    }

    if (cumulativeDebtHours > (settings.targetHours / 2) && avgQuality < 60) {
        return {
            type: 'critical',
            title: 'Burnout Risk Detected',
            message: "You're consistently getting low-quality sleep while accumulating debt. Consider reviewing your sleep environment.",
            color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-200 shadow-lg shadow-orange-500/10',
            icon: <Zap size={24} className="text-orange-600 dark:text-orange-400" />
        };
    }

    if (maxWakeDiffMinutes > 120) {
        return {
            type: 'warning',
            title: 'Irregular Sleep Rhythm',
            message: `Your wake-up times vary by over ${Math.round(maxWakeDiffMinutes/60)} hours this week. Social Jetlag lowers overall energy.`,
            color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 shadow-lg shadow-amber-500/10',
            icon: <Clock size={24} className="text-amber-600 dark:text-amber-400" />
        };
    }

    if (cumulativeDebtHours >= (settings.targetHours / 2)) {
      return { 
        type: 'warning', 
        title: 'Sleep Debt Accumulating', 
        message: `You are currently ${cumulativeDebtHours} hours behind schedule. Try going to bed 30 minutes earlier tonight.`,
        color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 shadow-lg shadow-amber-500/10',
        icon: <HeartPulse size={24} className="text-amber-600 dark:text-amber-400" />
      };
    }

    if (avgDurationMins > 0 && avgDurationMins < settings.minHours * 60) {
      return { 
        type: 'warning', 
        title: 'Insufficient Daily Rest', 
        message: `Your 7-day average is below your threshold of ${settings.minHours}h. Consistent sleep deprivation is a long-term risk.`,
        color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 shadow-lg shadow-red-500/10',
        icon: <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
      };
    }

    return {
        type: 'success',
        title: 'Healthy Sleep Pattern',
        message: 'Great job! You are maintaining a consistent sleep schedule and meeting your duration targets.',
        color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-lg shadow-emerald-500/10',
        icon: <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
    };
  }, [cumulativeDebtHours, avgDurationMins, logsLast7Days, settings.targetHours, settings.minHours, recentLogs]);

  const sleepScore = todayLog ? calculateSleepScore(todayLog) : 0;

  const chartStartDate = useMemo(() => {
      const parts = selectedDate.split('-').map(Number);
      const current = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = current.getDay(); 
      const diff = current.getDate() - day; 
      return new Date(current.setDate(diff));
  }, [selectedDate]);

  const lineChartData = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
     const d = new Date(chartStartDate);
     d.setDate(d.getDate() + i);
     const dateKey = formatDateKey(d);
     const log = getLogForDate(dateKey);
     return log ? Number((log.durationMinutes / 60).toFixed(1)) : 0;
  }), [logs, getLogForDate, chartStartDate]);

  const lineChartLabels = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
     const d = new Date(chartStartDate);
     d.setDate(d.getDate() + i);
     return d.toLocaleDateString(globalSettings?.preferences?.language || 'en', { weekday: 'short' });
  }), [globalSettings?.preferences?.language, chartStartDate]);

  const selectedIndex = useMemo(() => {
      const parts = selectedDate.split('-').map(Number);
      const selected = new Date(parts[0], parts[1] - 1, parts[2]);
      return selected.getDay(); 
  }, [selectedDate]);

  const days = getDaysInMonth(calendarDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleSaveLog = async (logData: any) => {
     if (todayLog) {
        await updateSleepLog(todayLog.id, logData);
     } else {
        await addSleepLog(logData);
     }
     setIsLogModalOpen(false);
  };

  const handleChartSelect = (index: number) => {
      const d = new Date(chartStartDate);
      d.setDate(d.getDate() + index);
      setSelectedDate(formatDateKey(d));
  };

  if (loading) return <LoadingSkeleton count={3} />;

  const hoursSlept = todayLog ? Math.floor(todayLog.durationMinutes / 60) : 0;
  const minutesSlept = todayLog ? todayLog.durationMinutes % 60 : 0;

  const boxClass = "bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] overflow-hidden hover:shadow-md transition-shadow duration-300";

  return (
    <div className="min-h-screen pb-20 space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-1">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2 font-serif uppercase tracking-tighter">
             <Moon className="fill-primary-500 text-primary-500" size={24} sm-size={32} /> {t.sleep.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base font-medium">{t.sleep.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <CalendarIcon size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white text-sm font-bold outline-none focus:ring-0"
              />
           </div>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all text-xs sm:text-sm active:scale-95"
           >
              <Target size={16} /> 
              <span className="hidden sm:inline">Settings</span>
           </button>
        </div>
      </header>

      {/* Dynamic Status Banner */}
      <div className={`rounded-3xl p-5 border border-l-8 flex flex-col sm:flex-row items-start gap-4 shadow-xl transition-all duration-300 ${healthStatus.color}`}>
         <div className="p-3 bg-white/40 dark:bg-black/20 rounded-2xl shrink-0 backdrop-blur-sm shadow-inner">
            {healthStatus.icon}
         </div>
         <div>
            <h3 className="font-black text-base sm:text-xl mb-1 flex items-center gap-2 uppercase tracking-tight">
               {healthStatus.title}
            </h3>
            <p className="text-sm sm:text-lg leading-relaxed font-medium opacity-90">
               {healthStatus.message}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
         
         <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Recovery Hero Card */}
            <div 
               className="bg-primary-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 transition-all duration-700 group"
               style={{
                 background: `linear-gradient(135deg, var(--color-primary-600) 0%, rgba(var(--color-primary-rgb), 0.8) 100%)`,
                 boxShadow: `0 25px 60px -15px rgba(var(--color-primary-rgb), 0.45), inset 0 2px 20px rgba(255,255,255,0.15)`
               }}
            >
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_12s_infinite_linear] pointer-events-none" />
               <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[110px] pointer-events-none mix-blend-soft-light group-hover:scale-110 transition-transform duration-1000" />
               <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-[90px] pointer-events-none opacity-60" />
               
               <div className="relative z-10 flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full mb-6 backdrop-blur-md shadow-sm">
                     <Sparkles size={12} className="text-white/80" />
                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white">
                        {todayLog ? 'Daily Sleep Record' : 'Log Pending'}
                     </span>
                  </div>

                  {todayLog ? (
                     <div className="space-y-6">
                        <div>
                           <div className="text-5xl sm:text-7xl font-bold font-mono tracking-tighter mb-3 flex items-baseline gap-2 justify-center md:justify-start drop-shadow-lg">
                              {hoursSlept}<span className="text-xl sm:text-2xl text-white/50 font-sans uppercase">h</span> {minutesSlept}<span className="text-xl sm:text-2xl text-white/50 font-sans uppercase">m</span>
                           </div>
                           <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/80 font-bold bg-black/10 w-fit px-4 py-2 rounded-2xl mx-auto md:mx-0 backdrop-blur-sm">
                              <div className="flex items-center gap-1.5"><Moon size={14} className="text-white/80" /> {new Date(todayLog.bedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              <ArrowRight size={12} className="opacity-40" />
                              <div className="flex items-center gap-1.5"><Sun size={14} className="text-yellow-400" /> {new Date(todayLog.wakeTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start items-center pt-2">
                           <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 flex flex-col backdrop-blur-md shadow-sm">
                              <span className="text-[8px] sm:text-[9px] font-black text-white/50 uppercase tracking-widest">{t.sleep.quality}</span>
                              <span className="text-xs sm:text-base font-black text-white">{todayLog.qualityRating}%</span>
                           </div>
                           <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 flex flex-col backdrop-blur-md shadow-sm">
                              <span className="text-[8px] sm:text-[9px] font-black text-white/50 uppercase tracking-widest">{t.sleep.mood}</span>
                              <span className="text-xs sm:text-base font-black text-white capitalize">{todayLog.mood}</span>
                           </div>
                           <button 
                             onClick={() => setIsLogModalOpen(true)}
                             className="p-3 bg-white/20 hover:bg-white text-white hover:text-primary-600 rounded-2xl border border-white/20 transition-all shadow-lg active:scale-95"
                           >
                              <Edit3 size={18} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="py-10">
                        <p className="text-2xl sm:text-4xl font-black mb-6 text-white tracking-tight drop-shadow-md">Track your rest tonight</p>
                        <button 
                          onClick={() => setIsLogModalOpen(true)}
                          className="bg-white text-primary-600 px-8 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto md:mx-0 uppercase tracking-widest text-xs sm:text-sm"
                        >
                           <Plus size={20} strokeWidth={4} /> {t.sleep.logSleep}
                        </button>
                     </div>
                  )}
               </div>

               <div className="shrink-0 relative group p-2">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-90 group-hover:scale-100 transition-transform duration-700" />
                  <ProgressRing 
                    progress={sleepScore} 
                    radius={80} 
                    stroke={12} 
                    color="stroke-white" 
                    trackColor="stroke-white/20" 
                    showValue={false}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-lg">
                     <span className="text-3xl sm:text-5xl font-black text-white">{sleepScore}</span>
                     <span className="text-[10px] sm:text-[12px] font-black text-white/60 uppercase tracking-[0.2em]">Score</span>
                  </div>
               </div>
            </div>

            {/* Weekly Analysis */}
            <div className={boxClass}>
               <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                     <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-lg uppercase tracking-tight">
                        <BarChart2 size={18} sm-size={22} className="text-primary-500" /> {t.sleep.trends}
                     </h3>
                     <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Target: {settings.targetHours}h | Threshold: {settings.minHours}h</p>
                  </div>
               </div>
               <LineChart 
                 data={lineChartData} 
                 labels={lineChartLabels}
                 goalValue={settings.targetHours}
                 color="#6366f1"
                 height={220}
                 onSelect={handleChartSelect}
                 selectedIndex={selectedIndex}
               />
            </div>

         </div>

         {/* History & Status Column */}
         <div className="space-y-4 sm:space-y-6">
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <div className="bg-primary-50/50 dark:bg-primary-950/30 p-5 rounded-[2rem] border border-primary-100 dark:border-primary-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1.5">{t.sleep.avg}</span>
                  <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                     {Math.floor(avgDurationMins/60)}h <span className="text-sm sm:text-base opacity-50 font-sans">{avgDurationMins%60}m</span>
                  </p>
               </div>
               <div className={`p-5 rounded-[2rem] border backdrop-blur-sm shadow-sm hover:shadow-md transition-all ${cumulativeDebtHours > (settings.targetHours/2) ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${cumulativeDebtHours > (settings.targetHours/2) ? 'text-rose-400' : 'text-emerald-400'}`}>{t.sleep.debt}</span>
                  <p className={`text-xl sm:text-3xl font-black tracking-tighter ${cumulativeDebtHours > (settings.targetHours/2) ? 'text-rose-600' : 'text-emerald-600'}`}>
                     {cumulativeDebtHours}h
                  </p>
               </div>
            </div>

            <div className={`${boxClass} flex flex-col h-fit`}>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base uppercase tracking-tight">
                     <CalendarIcon size={18} className="text-primary-500" /> {t.sleep.history}
                  </h3>
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-all hover:text-primary-600">
                        <ChevronLeft size={14} />
                     </button>
                     <span className="text-[10px] font-black text-gray-600 dark:text-slate-300 min-w-[70px] text-center uppercase tracking-widest">
                        {calendarDate.toLocaleDateString(globalSettings?.preferences?.language || 'en', { month: 'short', year: 'numeric'})}
                     </span>
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-all hover:text-primary-600">
                        <ChevronRight size={14} />
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-7 mb-3">
                  {weekDays.map(d => <div key={d} className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">{d}</div>)}
               </div>

               <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                     const dateKey = formatDateKey(day);
                     const isCurrentMonth = isSameMonth(day, calendarDate);
                     const isDayToday = isToday(day);
                     const log = getLogForDate(dateKey);
                     const isSelected = dateKey === selectedDate;
                     
                     let bgClass = '';
                     let textClass = 'text-gray-400 dark:text-gray-500';
                     
                     if (log) {
                        textClass = 'text-gray-900 dark:text-white font-black';
                        if (log.qualityRating >= 85) bgClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm';
                        else if (log.qualityRating >= 60) bgClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm';
                        else bgClass = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 shadow-sm';
                     } else {
                        bgClass = 'hover:bg-gray-50 dark:hover:bg-gray-800';
                     }

                     if (isSelected) {
                        bgClass = 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 z-10 scale-110';
                        textClass = 'text-primary-600 dark:text-primary-400 font-black';
                     }

                     return (
                        <button 
                          key={i}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`
                            aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group
                            ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                            ${bgClass}
                          `}
                        >
                           <span className={`text-[10px] sm:text-xs ${textClass}`}>
                              {day.getDate()}
                           </span>
                           {isDayToday && !isSelected && !log && (
                              <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500 animate-bounce" />
                           )}
                        </button>
                     );
                  })}
               </div>
               
               <div className="flex gap-4 justify-center mt-8 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" /><span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Great</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" /><span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Fair</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" /><span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Poor</span></div>
               </div>
            </div>

         </div>
      </div>

      {isLogModalOpen && (
         <SleepLogModal 
            date={selectedDate}
            initialData={todayLog}
            onSave={handleSaveLog}
            onClose={() => setIsLogModalOpen(false)}
         />
      )}

      {isSettingsOpen && (
         <SleepSettingsModal 
            onClose={() => setIsSettingsOpen(false)}
         />
      )}

    </div>
  );
};

export default Sleep;
