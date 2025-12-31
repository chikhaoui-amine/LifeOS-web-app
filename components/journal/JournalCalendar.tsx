import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { JournalEntry, MoodType } from '../../types';
import { getDaysInMonth, isSameMonth, isToday, formatDateKey } from '../../utils/dateUtils';
import { JournalEntryCard } from './JournalEntryCard';

interface JournalCalendarProps {
  entries: JournalEntry[];
  onDateSelect: (date: string) => void;
  onEntryClick: (entry: JournalEntry) => void;
}

const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#fbbf24', // yellow-400
  calm: '#60a5fa', // blue-400
  excited: '#f472b6', // pink-400
  grateful: '#34d399', // green-400
  neutral: '#9ca3af', // gray-400
  sad: '#818cf8', // indigo-400
  angry: '#f87171', // red-400
  anxious: '#fb923c', // orange-400
  tired: '#94a3b8', // slate-400
};

export const JournalCalendar: React.FC<JournalCalendarProps> = ({ entries, onDateSelect, onEntryClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const selectedEntries = selectedDate ? (entriesByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, i) => {
            const dateKey = formatDateKey(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = dateKey === selectedDate;
            const dayEntries = entriesByDate[dateKey] || [];
            
            // Determine dominant mood or latest
            const moodColor = dayEntries.length > 0 
                ? MOOD_COLORS[dayEntries[0].mood] 
                : null;

            return (
              <button 
                key={i} 
                onClick={() => { setSelectedDate(dateKey); onDateSelect(dateKey); }}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group
                  ${isSelected ? 'ring-2 ring-primary-500 z-10' : ''}
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${moodColor ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                `}
                style={{ backgroundColor: moodColor ? `${moodColor}20` : undefined }} // 20% opacity bg
              >
                <span className={`text-sm font-medium ${isDayToday ? 'text-primary-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day.getDate()}
                </span>
                
                {/* Mood Dot */}
                {moodColor && (
                   <div 
                     className="w-1.5 h-1.5 rounded-full mt-1" 
                     style={{ backgroundColor: moodColor }}
                   />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center border-t border-gray-100 dark:border-gray-700 pt-4">
           {Object.entries(MOOD_COLORS).slice(0, 5).map(([mood, color]) => (
              <div key={mood} className="flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                 <span className="text-[10px] text-gray-500 uppercase">{mood}</span>
              </div>
           ))}
        </div>
      </div>

      {/* Selected Day Entries */}
      {selectedDate && (
         <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-gray-900 dark:text-white px-2">
               Entries for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </h3>
            {selectedEntries.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEntries.map(entry => (
                     <JournalEntryCard 
                        key={entry.id} 
                        entry={entry} 
                        onClick={() => onEntryClick(entry)} 
                        onFavorite={() => {}} 
                     />
                  ))}
               </div>
            ) : (
               <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No entries for this day.</p>
               </div>
            )}
         </div>
      )}
    </div>
  );
};