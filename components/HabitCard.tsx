
import React, { useState } from 'react';
import { Check, Flame, MoreHorizontal, Edit2, Archive, Trash2, X } from 'lucide-react';
import { Habit } from '../types';
import { calculateStreak, formatDateKey } from '../utils/dateUtils';
import { HabitGrid } from './HabitGrid';
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
  const [showMenu, setShowMenu] = useState(false);
  const streak = calculateStreak(habit.completedDates);
  
  // Calculate Weekly Progress (Last 7 Days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  let scheduledCount = 0;
  let completedCount = 0;

  last7Days.forEach(date => {
    const dayIndex = date.getDay();
    // Check if habit is scheduled for this day of the week
    if (habit.frequency.days.includes(dayIndex)) {
      scheduledCount++;
      const dateKey = formatDateKey(date);
      if (habit.completedDates.includes(dateKey)) {
        completedCount++;
      }
    }
  });

  const weeklyProgress = scheduledCount > 0 
    ? Math.round((completedCount / scheduledCount) * 100) 
    : 0;

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    sky: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20',
    cyan: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20',
    teal: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20',
    green: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    lime: 'text-lime-600 bg-lime-50 dark:text-lime-400 dark:bg-lime-900/20',
    yellow: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    rose: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    fuchsia: 'text-fuchsia-600 bg-fuchsia-50 dark:text-fuchsia-400 dark:bg-fuchsia-900/20',
    pink: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',
    violet: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20',
  };

  const buttonColorMap: Record<string, string> = {
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    sky: 'bg-sky-600',
    cyan: 'bg-cyan-600',
    teal: 'bg-teal-600',
    green: 'bg-green-600',
    lime: 'bg-lime-600',
    yellow: 'bg-yellow-500',
    amber: 'bg-amber-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    rose: 'bg-rose-600',
    purple: 'bg-purple-600',
    fuchsia: 'bg-fuchsia-600',
    pink: 'bg-pink-600',
    violet: 'bg-violet-600',
  };

  const colorKey = habit.color.toLowerCase();
  const activeColorClass = colorMap[colorKey] || colorMap['indigo'];
  const completedButtonClass = buttonColorMap[colorKey] || 'bg-primary-600';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(40);
    if (!isCompleted) triggerConfetti();
    onToggle();
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      
      {showMenu && (
        <div 
          className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex items-center justify-around px-4 animate-in fade-in duration-200" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); setShowMenu(false); }} 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Edit2 size={16} /></div>
            <span className="text-[9px] font-black uppercase">Edit</span>
          </button>
          
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(); setShowMenu(false); }} 
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Archive size={16} /></div>
            <span className="text-[9px] font-black uppercase">Archive</span>
          </button>
          
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onDelete(); }} 
            className="flex flex-col items-center gap-1 text-red-600 dark:text-red-400 hover:scale-110 transition-transform"
          >
             <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><Trash2 size={16} /></div>
             <span className="text-[9px] font-black uppercase">Delete</span>
          </button>
          
          <button onClick={() => setShowMenu(false)} className="absolute top-2 right-2 p-1 text-gray-400">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="p-2.5 sm:p-4 flex gap-3 sm:gap-4">
        {/* Thumb-optimized Checkbox - Slightly smaller */}
        <button 
          onClick={handleToggle}
          className={`
            w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300
            ${isCompleted 
              ? `${completedButtonClass} text-white shadow-lg scale-105` 
              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-300 dark:text-gray-600 hover:bg-gray-100'}
          `}
        >
          {isCompleted ? <Check size={20} strokeWidth={4} className="animate-in zoom-in duration-300" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">{habit.icon}</span>
                <h3 className={`font-black text-xs sm:text-base uppercase tracking-tight truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {habit.name}
                </h3>
             </div>
             <button 
               onClick={(e) => { e.stopPropagation(); setShowMenu(true); }} 
               className="text-gray-400 p-1 rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-125"
             >
               <MoreHorizontal size={16} />
             </button>
          </div>

          <div className="flex items-center gap-3 mt-1 sm:mt-1.5">
             <div className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md ${activeColorClass}`}>
               <Flame size={10} className={streak > 0 ? 'fill-current' : ''} />
               <span>{streak}</span>
             </div>
             
             <div className="flex-1 flex items-center gap-2">
               <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-700 ease-out ${completedButtonClass}`}
                   style={{ width: `${weeklyProgress}%` }}
                 />
               </div>
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{weeklyProgress}%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
