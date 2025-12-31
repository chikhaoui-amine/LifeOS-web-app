
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
  RefreshCw
} from 'lucide-react';
import { NavRoute, LanguageCode } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useSync } from '../context/SyncContext';
import { getTranslation } from '../utils/translations';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { settings, isGoogleConnected } = useSettings();
  const { isSyncing } = useSync();
  
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const allRoutes: NavRoute[] = [
    { id: 'today', path: '/', label: t.nav.today, icon: LayoutDashboard },
    { id: 'habits', path: '/habits', label: t.nav.habits, icon: CheckCircle2 },
    { id: 'tasks', path: '/tasks', label: t.nav.tasks, icon: ListTodo },
    { id: 'goals', path: '/goals', label: t.nav.goals, icon: Target },
    { id: 'calendar', path: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { id: 'meals', path: '/meals', label: t.nav.meals, icon: Utensils },
    { id: 'sleep', path: '/sleep', label: t.nav.sleep, icon: BedDouble },
    { id: 'journal', path: '/journal', label: t.nav.journal, icon: Book },
    { id: 'finance', path: '/finance', label: t.nav.finance, icon: DollarSign },
    { id: 'deen', path: '/deen', label: t.nav.deen, icon: Moon },
    { id: 'stats', path: '/statistics', label: t.nav.stats, icon: BarChart3 },
    { id: 'settings', path: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const tabs = allRoutes.filter(route => {
    if (route.id === 'deen' && !settings?.preferences?.enableIslamicFeatures) return false;
    return true;
  });

  useEffect(() => {
    // Only apply scroll centering if we are actually in an overflow state (mobile/tablet)
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
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-500 bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]">
      
      {/* Navigation Header */}
      <header className="shrink-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 transition-all duration-300 safe-top">
        <div className="max-w-full 2xl:max-w-none mx-auto w-full relative">
          <div className="flex items-center h-16 px-4 lg:px-8 gap-3">
            <div 
              ref={scrollContainerRef} 
              className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible no-scrollbar lg:justify-center h-full scroll-smooth"
            >
              {tabs.map((route) => (
                <NavLink
                  key={route.id}
                  to={route.path}
                  className={({ isActive }) => `
                    relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs lg:text-sm font-bold transition-all duration-300 whitespace-nowrap select-none snap-start
                    ${isActive ? 'active-nav-item bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white active:scale-95'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <route.icon size={16} lg-size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-in zoom-in duration-300' : ''} />
                      <span>{route.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              <div className="w-2 sm:w-4 shrink-0 lg:hidden" />
            </div>

            {isGoogleConnected && (
              <div className="pl-3 border-l border-gray-100 dark:border-gray-800 shrink-0">
                <button className={`p-2.5 rounded-full transition-all duration-500 ${isSyncing ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar" id="main-content">
        <div className="max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
