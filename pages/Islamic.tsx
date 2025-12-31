
import React, { useMemo } from 'react';
import { Moon, Calendar, BarChart3, Star } from 'lucide-react';
import { useIslamic } from '../context/IslamicContext';
import { SalahTracker } from '../components/islamic/SalahTracker';
import { TasbihWidget } from '../components/islamic/TasbihWidget';
import { QuranTracker } from '../components/islamic/QuranTracker';
import { AthkarTracker } from '../components/islamic/AthkarTracker';
import { IslamicStats } from '../components/islamic/IslamicStats';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { getDaysUntilHijriEvent } from '../utils/islamicUtils';

const Islamic: React.FC = () => {
  const { hijriDate, loading } = useIslamic();

  const upcomingEvents = useMemo(() => {
    if (!hijriDate) return [];
    
    return [
      { name: 'Ramadan', days: getDaysUntilHijriEvent(9, 1, hijriDate), color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
      { name: 'Eid al-Fitr', days: getDaysUntilHijriEvent(10, 1, hijriDate), color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
      { name: 'Eid al-Adha', days: getDaysUntilHijriEvent(12, 10, hijriDate), color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    ].sort((a, b) => a.days - b.days);
  }, [hijriDate]);

  if (loading) return <LoadingSkeleton count={3} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header with Hijri Date */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
             <Moon size={18} className="fill-current" />
             <span className="text-xs font-bold uppercase tracking-wider">Islamic Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
             {hijriDate.day} {hijriDate.monthName} {hijriDate.year} AH
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Strengthen your connection with your Creator.</p>
        </div>
      </header>

      {/* Main Trackers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left Column: Prayers & Quran */}
         <div className="lg:col-span-2 space-y-6">
            <SalahTracker />
            <QuranTracker />
         </div>

         {/* Right Column: Tasbih, Athkar & Calendar */}
         <div className="space-y-6">
            <TasbihWidget />
            
            <div className="h-[500px]">
               <AthkarTracker />
            </div>
            
            {/* Dynamic Upcoming Events Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
               </div>
               <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event.name} className="flex justify-between items-center group">
                       <div className="flex items-center gap-2">
                          <Star size={14} className="text-amber-400 fill-current opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{event.name}</span>
                       </div>
                       <span className={`text-xs font-bold px-3 py-1 rounded-full ${event.color}`}>
                          ~{event.days} Days
                       </span>
                    </div>
                  ))}
               </div>
            </div>

         </div>
      </div>

      {/* Statistics Section */}
      <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
         <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Progress Overview</h2>
         </div>
         <IslamicStats />
      </div>

    </div>
  );
};

export default Islamic;
