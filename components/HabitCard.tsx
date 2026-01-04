
import React, { useState } from 'react';
import { Check, Flame, MoreHorizontal, Edit2, Archive, Trash2, X, Zap } from 'lucide-react';
import { Habit } from '../types';
import { calculateStreak, formatDateKey, getTodayKey } from '../utils/dateUtils';
import { useHabits } from '../context/HabitContext';
import { triggerConfetti } from '../utils/confetti';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  isCompleted, 
  onToggle,
  onEdit,
  onDelete,
  onArchive
}) => {
  const { incrementHabit } = useHabits();
  const [showMenu, setShowMenu] = useState(false);
  const streak = calculateStreak(habit.completedDates);
  const todayKey = getTodayKey();
  const todayProgress = habit.progress?.[todayKey] || 0;
  
  const isCounter = habit.type === 'counter';
  const isOneTime = habit.frequency.type === 'once';

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  let scheduledCount = 0;
  let completedCount = 0;
  last7Days.forEach(date => {
    const dayIndex = date.getDay();
    if (habit.frequency.days.includes(dayIndex) || isOneTime) {
      scheduledCount++;
      if (habit.completedDates.includes(formatDateKey(date))) completedCount++;
    }
  });

  const weeklyProgress = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    sky: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20',
    green: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    pink: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',
  };

  const buttonColorMap: Record<string, string> = {
    indigo: 'bg-indigo-600', blue: 'bg-blue-600', sky: 'bg-sky-600', green: 'bg-green-600',
    orange: 'bg-orange-600', red: 'bg-red-600', purple: 'bg-purple-600', pink: 'bg-pink-600',
  };

  const colorKey = habit.color.toLowerCase();
  const activeColorClass = colorMap[colorKey] || colorMap['indigo'];
  const completedButtonClass = buttonColorMap[colorKey] || 'bg-primary-600';

  const handleCheckToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) triggerConfetti();
    onToggle();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (todayProgress + 1 === habit.goal) triggerConfetti();
    // Vibrate on touch for feedback
    if (navigator.vibrate) navigator.vibrate(15);
    incrementHabit(habit.id, 1, todayKey);
  };

  const handleLongPress = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Reset today's progress?")) {
      incrementHabit(habit.id, -todayProgress, todayKey);
    }
  };

  // SVG Circumference Calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(100, (todayProgress / (habit.goal || 1)) * 100);
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Use the habit's theme color even when completed
  const strokeColorClass = habit.color === 'indigo' ? 'text-indigo-500' : `text-${habit.color}-500`;
  const textColorClass = isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white';

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      
      {showMenu && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex items-center justify-around px-4 animate-in fade-in duration-200">
          <button onClick={() => { onEdit(); setShowMenu(false); }} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black dark:hover:text-white"><div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center"><Edit2 size={16} /></div><span className="text-[9px] font-black uppercase">Edit</span></button>
          <button onClick={() => { onArchive(); setShowMenu(false); }} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black dark:hover:text-white"><div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center"><Archive size={16} /></div><span className="text-[9px] font-black uppercase">Archive</span></button>
          <button onClick={() => { onDelete(); setShowMenu(false); }} className="flex flex-col items-center gap-1 text-red-500"><div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><Trash2 size={16} /></div><span className="text-[9px] font-black uppercase">Delete</span></button>
          <button onClick={() => setShowMenu(false)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      <div className="p-3 sm:p-4 flex gap-4">
        {/* Toggle / Counter Area */}
        {!isCounter ? (
          <button 
            onClick={handleCheckToggle}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300 ${isCompleted ? `${completedButtonClass} text-white shadow-xl scale-105` : 'bg-gray-50 dark:bg-gray-700/50 text-gray-300 hover:bg-gray-100'}`}
          >
            {isCompleted ? <Check size={24} strokeWidth={4} className="animate-in zoom-in" /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
          </button>
        ) : (
          <button 
            onClick={handleIncrement}
            onContextMenu={handleLongPress}
            className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center group/counter active:scale-90 transition-transform"
          >
             <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle 
                  cx="50" cy="50" r={radius} 
                  className="stroke-gray-100 dark:stroke-gray-700 fill-none" 
                  strokeWidth="8" 
                />
                {/* Active Progress */}
                <circle 
                  cx="50" cy="50" r={radius} 
                  className={`fill-none transition-all duration-700 ease-out stroke-current ${strokeColorClass}`} 
                  strokeWidth="8" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                />
             </svg>
             <div className="flex flex-col items-center justify-center z-10">
                <span className={`text-sm sm:text-lg font-black tabular-nums leading-none ${isCompleted ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {todayProgress}
                </span>
             </div>
             
             {/* Subtle Hover Indicator */}
             {!isCompleted && (
                <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover/counter:opacity-5 transition-opacity" />
             )}
          </button>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xl shrink-0">{habit.icon}</span>
                <div className="flex flex-col min-w-0">
                   <h3 className={`font-black text-xs sm:text-base uppercase tracking-tight truncate ${textColorClass}`}>
                     {habit.name}
                   </h3>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{habit.category}</span>
                      {isOneTime && (
                         <span className="flex items-center gap-0.5 text-[8px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1 py-0.5 rounded-md">
                            <Zap size={8} fill="currentColor" /> One-time
                         </span>
                      )}
                   </div>
                </div>
             </div>
             <button onClick={() => setShowMenu(true)} className="text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60 group-hover:opacity-100 transition-all"><MoreHorizontal size={16} /></button>
          </div>

          <div className="flex items-center gap-3 mt-1.5 sm:mt-2">
             <div className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-lg ${activeColorClass}`}>
               <Flame size={10} className={streak > 0 ? 'fill-current' : ''} />
               <span>{isOneTime ? 'N/A' : streak}</span>
             </div>
             
             <div className="flex-1 flex items-center gap-2">
               <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-700 ease-out ${completedButtonClass}`}
                   style={{ width: `${weeklyProgress}%` }}
                 />
               </div>
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{isCounter ? `${todayProgress}/${habit.goal}` : `${weeklyProgress}%`}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
