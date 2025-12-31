
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowLeft } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { getDaysInMonth, isSameMonth, isToday, formatDateKey } from '../utils/dateUtils';
import { TimeBlockingView } from '../components/calendar/TimeBlockingView';

const Calendar: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for Day View
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));

  const { habits } = useHabits();
  const { tasks } = useTasks();

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Navigation Handlers ---
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const prevDay = new Date(selectedDateKey);
      prevDay.setDate(prevDay.getDate() - 1);
      setSelectedDateKey(formatDateKey(prevDay));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextDay = new Date(selectedDateKey);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDateKey(formatDateKey(nextDay));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateKey(formatDateKey(date));
    setViewMode('day');
  };

  // --- Render Helpers ---
  const renderMonthCell = (day: Date) => {
    const dateKey = formatDateKey(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isDayToday = isToday(day);
    
    // Habits
    const dayHabits = habits.filter(h => {
       if (h.archived) return false;
       const created = new Date(h.createdAt);
       if (day < new Date(created.setHours(0,0,0,0))) return false;
       return h.frequency.days.includes(day.getDay()) || h.completedDates.includes(dateKey);
    });
    const completedHabits = dayHabits.filter(h => h.completedDates.includes(dateKey));

    // Tasks
    const dayTasks = tasks.filter(t => t.dueDate === dateKey);
    const completedTasks = dayTasks.filter(t => t.completed);

    return (
      <div 
        key={dateKey}
        onClick={() => handleDateClick(day)}
        className={`
           min-h-[70px] sm:min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1 sm:p-2 flex flex-col gap-1 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50
           ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-gray-900/30 text-opacity-40' : 'bg-white dark:bg-gray-800'}
        `}
      >
         <div className="flex justify-between items-start">
            <span className={`
               w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-transform
               ${isDayToday ? 'bg-primary-600 text-white shadow-md' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}
            `}>
               {day.getDate()}
            </span>
         </div>

         {/* Indicators */}
         <div className="flex-1 flex flex-col justify-end gap-1">
            {/* Task Bars */}
            {dayTasks.length > 0 && (
               <div className="flex flex-col gap-0.5">
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(completedTasks.length / dayTasks.length) * 100}%` }} 
                     />
                  </div>
               </div>
            )}

            {/* Habit Dots */}
            {dayHabits.length > 0 && (
               <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-end mt-0.5">
                  {dayHabits.map(h => (
                     <div 
                        key={h.id}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-opacity ${h.completedDates.includes(dateKey) ? 'opacity-100' : 'opacity-20'}`}
                        style={{ backgroundColor: h.color.startsWith('#') ? h.color : undefined }}
                     />
                  ))}
               </div>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 h-full flex flex-col">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
           {viewMode === 'day' && (
              <button onClick={() => setViewMode('month')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                 <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
           )}
           <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 {viewMode === 'month' 
                    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                 }
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                 {viewMode === 'month' ? 'Monthly Overview' : 'Daily Schedule'}
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('month')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
              >
                 <CalendarIcon size={16} />
              </button>
              <button 
                onClick={() => setViewMode('day')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
              >
                 <Clock size={16} />
              </button>
           </div>

           <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

           <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Today
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col relative">
         
         {viewMode === 'month' ? (
            <div className="flex flex-col h-full">
               {/* Weekday Headers */}
               <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  {weekDays.map(day => (
                     <div key={day} className="text-center py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                     </div>
                  ))}
               </div>
               
               {/* Month Grid */}
               <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                  {days.map(day => renderMonthCell(day))}
               </div>
            </div>
         ) : (
            <TimeBlockingView date={selectedDateKey} />
         )}

      </div>
    </div>
  );
};

export default Calendar;
