
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HabitProvider } from './context/HabitContext';
import { TaskProvider } from './context/TaskContext';
import { GoalProvider } from './context/GoalContext';
import { JournalProvider } from './context/JournalContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { IslamicProvider } from './context/IslamicContext';
import { MealProvider } from './context/MealContext';
import { SleepProvider } from './context/SleepContext';
import { TimeBlockProvider } from './context/TimeBlockContext';
import { DigitalWellnessProvider } from './context/DigitalWellnessContext';
import { SyncProvider } from './context/SyncContext';
import { NotificationScheduler } from './components/NotificationScheduler';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import Today from './pages/Today';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Journal from './pages/Journal';
import Finance from './pages/Finance';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Islamic from './pages/Deen';
import Meals from './pages/Meals';
import Sleep from './pages/Sleep';
import { ThemeCustomizer } from './pages/ThemeCustomizer';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <SettingsProvider>
            <HabitProvider>
              <TaskProvider>
                <GoalProvider>
                  <JournalProvider>
                    <FinanceProvider>
                      <IslamicProvider>
                        <MealProvider>
                          <SleepProvider>
                            <TimeBlockProvider>
                              <DigitalWellnessProvider>
                                <SyncProvider>
                                  <NotificationScheduler />
                                  
                                  {isLoading && <SplashScreen />}
                                  
                                  <HashRouter>
                                    <Routes>
                                      <Route path="/" element={<Layout />}>
                                        <Route index element={<Today />} />
                                        <Route path="habits" element={<Habits />} />
                                        <Route path="tasks" element={<Tasks />} />
                                        <Route path="goals" element={<Goals />} />
                                        <Route path="journal" element={<Journal />} />
                                        <Route path="finance" element={<Finance />} />
                                        <Route path="deen" element={<Islamic />} />
                                        <Route path="meals" element={<Meals />} />
                                        <Route path="sleep" element={<Sleep />} />
                                        <Route path="calendar" element={<Calendar />} />
                                        <Route path="statistics" element={<Statistics />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="settings/theme-creator" element={<ThemeCustomizer />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                      </Route>
                                    </Routes>
                                  </HashRouter>
                                </SyncProvider>
                              </DigitalWellnessProvider>
                            </TimeBlockProvider>
                          </SleepProvider>
                        </MealProvider>
                      </IslamicProvider>
                    </FinanceProvider>
                  </JournalProvider>
                </GoalProvider>
              </TaskProvider>
            </HabitProvider>
          </SettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
