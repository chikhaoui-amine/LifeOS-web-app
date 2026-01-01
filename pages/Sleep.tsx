
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
  
  // Get recent logs for advanced analysis (Rolling 7 days for health status)
  const recentLogs = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return getLogForDate(formatDateKey(d));
    }).filter(Boolean) as any[]; // Need actual log type here, filtering out undefined
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

  // Enhanced Dynamic Status Logic
  const healthStatus = useMemo(() => {
    // 1. Not enough data
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
    
    // Calculate Schedule Consistency (Wake Time Variance)
    // Convert wake times to minutes from midnight
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

    // --- CRITICAL TIERS ---

    // 2. Critical Warning: Debt > 100% of target (one full night lost in a week)
    if (cumulativeDebtHours >= settings.targetHours) {
      return { 
        type: 'critical', 
        title: 'Severe Sleep Deprivation', 
        message: `Your sleep debt is ${cumulativeDebtHours} hours—equivalent to a full night lost. Your cognitive function and immune system are likely compromised. Prioritize recovery sleep immediately.`,
        color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200',
        icon: <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400 animate-pulse" />
      };
    }

    // 3. Burnout Risk: Moderate Debt + Low Quality
    if (cumulativeDebtHours > (settings.targetHours / 2) && avgQuality < 60) {
        return {
            type: 'critical',
            title: 'Burnout Risk Detected',
            message: "You're consistently getting low-quality sleep while accumulating debt. This combination accelerates burnout. Consider reviewing your sleep environment.",
            color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-200',
            icon: <Zap size={24} className="text-orange-600 dark:text-orange-400" />
        };
    }

    // --- WARNING TIERS ---

    // 4. Social Jetlag (Inconsistent Wake Times)
    if (maxWakeDiffMinutes > 120) { // > 2 hours variation
        return {
            type: 'warning',
            title: 'Irregular Sleep Rhythm',
            message: `Your wake-up times vary by over ${Math.round(maxWakeDiffMinutes/60)} hours this week. This "Social Jetlag" confuses your circadian rhythm and lowers energy.`,
            color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200',
            icon: <Clock size={24} className="text-amber-600 dark:text-amber-400" />
        };
    }

    // 5. Moderate Warning: Debt > 50% of target
    if (cumulativeDebtHours >= (settings.targetHours / 2)) {
      return { 
        type: 'warning', 
        title: 'Sleep Debt Accumulating', 
        message: `You are currently ${cumulativeDebtHours} hours behind schedule this week. Try going to bed 30 minutes earlier tonight to catch up.`,
        color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200',
        icon: <HeartPulse size={24} className="text-amber-600 dark:text-amber-400" />
      };
    }

    // 6. Insufficient Daily Average based on User Min setting
    if (avgDurationMins > 0 && avgDurationMins < settings.minHours * 60) {
      return { 
        type: 'warning', 
        title: 'Insufficient Daily Rest', 
        message: `Your 7-day average is only ${Math.floor(avgDurationMins/60)}h ${avgDurationMins%60}m, which is below your minimum threshold of ${settings.minHours}h. Consistent sleep deprivation is linked to long-term health risks.`,
        color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200',
        icon: <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
      };
    }

    // 7. Good Health
    return {
        type: 'success',
        title: 'Healthy Sleep Pattern',
        message: 'Great job! You are maintaining a consistent sleep schedule and meeting your duration targets.',
        color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
        icon: <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
    };
  }, [cumulativeDebtHours, avgDurationMins, logsLast7Days, settings.targetHours, settings.minHours, recentLogs]);

  const sleepScore = todayLog ? calculateSleepScore(todayLog) : 0;

  // --- Chart Logic: Start Sunday, End Saturday ---
  
  // 1. Determine Start of Week (Sunday) based on Selected Date
  const chartStartDate = useMemo(() => {
      // Parse YYYY-MM-DD string to Date, fixing timezone issues by appending time
      const parts = selectedDate.split('-').map(Number);
      // Create date at local midnight
      const current = new Date(parts[0], parts[1] - 1, parts[2]);
      
      const day = current.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = current.getDate() - day; // Adjust to Sunday
      return new Date(current.setDate(diff));
  }, [selectedDate]);

  // 2. Generate Data for Week (Sun-Sat)
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

  // 3. Highlight Selected Day
  const selectedIndex = useMemo(() => {
      const parts = selectedDate.split('-').map(Number);
      const selected = new Date(parts[0], parts[1] - 1, parts[2]);
      return selected.getDay(); // 0 (Sun) - 6 (Sat) corresponds directly to array index
  }, [selectedDate]);

  // Calendar Helpers
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

  // Texture Class
  const boxClass = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]";

  return (
    <div className="min-h-screen pb-20 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
             <Moon className="fill-primary-500 text-primary-500" size={24} sm-size={28} /> {t.sleep.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">{t.sleep.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <CalendarIcon size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white text-sm font-medium outline-none focus:ring-0"
              />
           </div>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all text-xs sm:text-sm active:scale-95"
             title="Configure Goals"
           >
              <Target size={16} /> 
              <span className="hidden sm:inline">Goals</span>
           </button>
        </div>
      </header>

      {/* Persistent Status Banner */}
      <div className={`rounded-[1.5rem] p-5 border border-l-4 flex flex-col sm:flex-row items-start gap-4 shadow-sm transition-all duration-300 ${healthStatus.color}`}>
         <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl shrink-0 backdrop-blur-sm">
            {healthStatus.icon}
         </div>
         <div>
            <h3 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
               {healthStatus.title}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed opacity-90">
               {healthStatus.message}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
         
         <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Recovery Hero Card */}
            <div className="bg-primary-600 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl transition-colors duration-500">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
               
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 relative z-10">
                  <div className="flex-1 text-center md:text-left">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full mb-4 sm:mb-6">
                        <Sparkles size={12} className="text-white/80" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/90">
                           {todayLog ? 'Daily Record' : 'No Record'}
                        </span>
                     </div>

                     {todayLog ? (
                        <div className="space-y-4 sm:space-y-6">
                           <div>
                              <div className="text-4xl sm:text-6xl md:text-7xl font-bold font-mono tracking-tighter mb-2 flex items-baseline gap-1 sm:gap-2 justify-center md:justify-start">
                                 {hoursSlept}<span className="text-xl sm:text-2xl text-white/60 font-sans uppercase">h</span> {minutesSlept}<span className="text-xl sm:text-2xl text-white/60 font-sans uppercase">m</span>
                              </div>
                              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-white/70 font-medium">
                                 <div className="flex items-center gap-1.5"><Moon size={14} className="text-white/80" /> {new Date(todayLog.bedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                 <ArrowRight size={12} className="opacity-50" />
                                 <div className="flex items-center gap-1.5"><Sun size={14} className="text-yellow-300" /> {new Date(todayLog.wakeTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                           </div>

                           <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start items-center">
                              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 rounded-2xl border border-white/10 flex flex-col backdrop-blur-sm">
                                 <span className="text-[8px] sm:text-[10px] font-bold text-white/50 uppercase">{t.sleep.quality}</span>
                                 <span className="text-xs sm:text-sm font-bold text-white">{todayLog.qualityRating}%</span>
                              </div>
                              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 rounded-2xl border border-white/10 flex flex-col backdrop-blur-sm">
                                 <span className="text-[8px] sm:text-[10px] font-bold text-white/50 uppercase">{t.sleep.mood}</span>
                                 <span className="text-xs sm:text-sm font-bold text-white capitalize">{todayLog.mood}</span>
                              </div>
                              <button 
                                onClick={() => setIsLogModalOpen(true)}
                                className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all text-white/80"
                                title="Edit Log"
                              >
                                 <Edit3 size={16} sm-size={20} />
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="py-6 sm:py-10">
                           <p className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">{globalSettings?.preferences?.language === 'ar' ? 'لا يوجد سجل لهذا اليوم' : 'No record for today'}</p>
                           <button 
                             onClick={() => setIsLogModalOpen(true)}
                             className="bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3 mx-auto md:mx-0 active:scale-95 uppercase tracking-widest text-xs sm:text-sm"
                           >
                              <Plus size={16} sm-size={20} strokeWidth={3} /> {t.sleep.logSleep}
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="shrink-0 relative group">
                     <ProgressRing 
                       progress={sleepScore} 
                       radius={70} 
                       stroke={10} 
                       color="stroke-white" 
                       trackColor="stroke-white/20" 
                       showValue={false}
                     />
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl sm:text-4xl font-black text-white">{sleepScore}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest">Score</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Weekly Analysis (Sun -> Sat of Selected Week) */}
            <div className={boxClass}>
               <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                        <BarChart2 size={18} sm-size={20} className="text-primary-500" /> {t.sleep.trends}
                     </h3>
                     <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Target: {settings.targetHours}h | Min: {settings.minHours}h</p>
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

         {/* Right Col: History Calendar */}
         <div className="space-y-4 sm:space-y-6">
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <div className="bg-primary-50/50 dark:bg-primary-950/30 p-4 sm:p-5 rounded-3xl border border-primary-100 dark:border-primary-900/50 backdrop-blur-sm">
                  <span className="text-[9px] sm:text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">{t.sleep.avg}</span>
                  <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                     {Math.floor(avgDurationMins/60)}h {avgDurationMins%60}m
                  </p>
               </div>
               <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-sm transition-all ${cumulativeDebtHours > (settings.targetHours/2) ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/50' : 'bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900/50'}`}>
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest block mb-1 ${cumulativeDebtHours > (settings.targetHours/2) ? 'text-red-400' : 'text-green-400'}`}>{t.sleep.debt}</span>
                  <p className={`text-lg sm:text-2xl font-black ${cumulativeDebtHours > (settings.targetHours/2) ? 'text-red-600' : 'text-green-600'}`}>
                     {cumulativeDebtHours}h
                  </p>
               </div>
            </div>

            <div className={`${boxClass} flex flex-col h-fit`}>
               <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                     <CalendarIcon size={16} sm-size={18} className="text-primary-500" /> {t.sleep.history}
                  </h3>
                  <div className="flex items-center gap-1">
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 transition-colors">
                        <ChevronLeft size={14} sm-size={16} />
                     </button>
                     <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 min-w-[70px] sm:min-w-[80px] text-center">
                        {calendarDate.toLocaleDateString(globalSettings?.preferences?.language || 'en', { month: 'short', year: 'numeric'})}
                     </span>
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 transition-colors">
                        <ChevronRight size={14} sm-size={16} />
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-7 mb-2">
                  {weekDays.map(d => <div key={d} className="text-[9px] sm:text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">{d}</div>)}
               </div>

               <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                     const dateKey = formatDateKey(day);
                     const isCurrentMonth = isSameMonth(day, calendarDate);
                     const isDayToday = isToday(day);
                     const log = getLogForDate(dateKey);
                     const isSelected = dateKey === selectedDate;
                     
                     let bgClass = '';
                     let textClass = 'text-gray-500 dark:text-gray-400';
                     
                     if (log) {
                        textClass = 'text-gray-900 dark:text-white font-black';
                        if (log.qualityRating >= 85) bgClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                        else if (log.qualityRating >= 60) bgClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
                        else bgClass = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
                     } else {
                        bgClass = 'hover:bg-gray-50 dark:hover:bg-gray-800';
                     }

                     if (isSelected) {
                        bgClass = 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 z-10';
                        textClass = 'text-indigo-600 dark:text-indigo-400 font-black';
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
                              <div className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
                           )}
                        </button>
                     );
                  })}
               </div>
               
               <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] text-gray-400 uppercase font-bold">Good</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[9px] text-gray-400 uppercase font-bold">Fair</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[9px] text-gray-400 uppercase font-bold">Poor</span></div>
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
