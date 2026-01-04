
import React, { useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  ListTodo, 
  CalendarDays, 
  BarChart3, 
  Settings,
  Target,
  Book,
  Moon,
  DollarSign,
  Utensils,
  BedDouble,
  RefreshCw,
  Trophy,
  Zap,
  Sparkles,
  FileText
} from 'lucide-react';
import { NavRoute, LanguageCode } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useSync } from '../context/SyncContext';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { getTranslation } from '../utils/translations';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { settings, isGoogleConnected } = useSettings();
  const { isSyncing } = useSync();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const allRoutes: NavRoute[] = [
    { id: 'today', path: '/', label: t.nav.today, icon: LayoutDashboard },
    { id: 'vision', path: '/vision', label: 'Vision', icon: Sparkles },
    { id: 'habits', path: '/habits', label: t.nav.habits, icon: CheckCircle2 },
    { id: 'tasks', path: '/tasks', label: t.nav.tasks, icon: ListTodo },
    { id: 'goals', path: '/goals', label: t.nav.goals, icon: Target },
    { id: 'calendar', path: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { id: 'reports', path: '/reports', label: 'Reports', icon: FileText },
    { id: 'meals', path: '/meals', label: t.nav.meals, icon: Utensils },
    { id: 'sleep', path: '/sleep', label: t.nav.sleep, icon: BedDouble },
    { id: 'journal', path: '/journal', label: t.nav.journal, icon: Book },
    { id: 'finance', path: '/finance', label: t.nav.finance, icon: DollarSign },
    { id: 'deen', path: '/deen', label: t.nav.deen, icon: Moon },
    { id: 'stats', path: '/statistics', label: t.nav.stats, icon: BarChart3 },
    { id: 'settings', path: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const tabs = allRoutes.filter(route => {
    // 1. Mandatory modules
    if (['today', 'settings'].includes(route.id)) return true;
    
    // 2. User disabled modules
    if (settings?.disabledModules?.includes(route.id)) return false;

    // 3. Special conditions
    if (route.id === 'deen' && !settings?.preferences?.enableIslamicFeatures) return false;
    
    return true;
  });

  // Gamification Calculation
  const userLevel = useMemo(() => {
    const totalHabitCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalXP = (totalHabitCompletions * 10) + (completedTasks * 20);
    
    let level = 1;
    let xpAccumulated = 0;
    while (totalXP >= xpAccumulated + level * 500) {
      xpAccumulated += level * 500;
      level++;
    }
    const xpInCurrentLevel = totalXP - xpAccumulated;
    const xpNeededForNext = level * 500;
    const progress = (xpInCurrentLevel / xpNeededForNext) * 100;
    
    return { level, progress, totalXP };
  }, [habits, tasks]);

  useEffect(() => {
    if (scrollContainerRef.current && window.innerWidth < 1024) {
      const activeElement = scrollContainerRef.current.querySelector('.active-nav-item') as HTMLElement;
      if (activeElement) {
        const container = scrollContainerRef.current;
        const scrollLeft = activeElement.offsetLeft - (container.offsetWidth / 2) + (activeElement.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-500 relative">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
         <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-purple-500/5 blur-[120px] animate-[pulse_12s_ease-in-out_infinite]" />
         <div className="absolute inset-0 bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Navigation Header */}
      <header className="shrink-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 transition-all duration-300 safe-top">
        <div className="max-w-full 2xl:max-w-none mx-auto w-full relative">
          <div className="flex items-center h-16 px-4 lg:px-8 gap-3">
            
            {/* Logo / Brand - Themed Color Fix */}
            <div className="hidden lg:flex items-center gap-2 mr-4 text-primary-600 dark:text-white font-black tracking-tight text-xl">
               <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/10">
                  <Zap size={18} fill="currentColor" />
               </div>
               LifeOS
            </div>

            <div 
              ref={scrollContainerRef} 
              className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible no-scrollbar lg:justify-center h-full scroll-smooth"
            >
              {tabs.map((route) => (
                <NavLink
                  key={route.id}
                  to={route.path}
                  className={({ isActive }) => `
                    relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs lg:text-sm font-bold transition-all duration-300 whitespace-nowrap select-none snap-start group
                    ${isActive ? 'active-nav-item bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-100' : 'hover:bg-gray-100/50 dark:hover:bg-gray-900 active:scale-95'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <route.icon size={16} lg-size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span>{route.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              <div className="w-2 sm:w-4 shrink-0 lg:hidden" />
            </div>

            {/* Right Side: Sync & Level */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100 dark:border-gray-800 shrink-0">
              
              {/* Level Badge */}
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800" title={`Level ${userLevel.level} - ${Math.round(userLevel.progress)}% to next level`}>
                 <Trophy size={14} className="text-amber-500" />
                 <div className="flex flex-col w-16">
                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 dark:text-gray-400 leading-none mb-0.5">
                       <span>Lvl {userLevel.level}</span>
                       <span>{Math.round(userLevel.progress)}%</span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${userLevel.progress}%` }} />
                    </div>
                 </div>
              </div>

              {isGoogleConnected && (
                <button className={`p-2.5 rounded-full transition-all duration-500 ${isSyncing ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar z-10" id="main-content">
        <div className="max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
