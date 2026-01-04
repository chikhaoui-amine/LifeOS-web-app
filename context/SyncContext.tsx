
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { useHabits } from './HabitContext';
import { useTasks } from './TaskContext';
import { useJournal } from './JournalContext';
import { useGoals } from './GoalContext';
import { useFinance } from './FinanceContext';
import { useMeals } from './MealContext';
import { useSleep } from './SleepContext';
import { useTimeBlocks } from './TimeBlockContext';
import { useIslamic } from './IslamicContext';
import { useTheme } from './ThemeContext';
import { useVisionBoard } from './VisionBoardContext';
import { useReports } from './ReportContext';
import { FirebaseService, User } from '../services/FirebaseService';
import { BackupService } from '../services/BackupService';
import { useToast } from './ToastContext';

interface SyncContextType {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  user: User | null;
  syncNow: () => Promise<void>; 
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, setGoogleConnected } = useSettings();
  
  // Data Contexts - Gather EVERYTHING
  const { habits, categories: habitCategories } = useHabits();
  const { tasks } = useTasks();
  const { entries: journal } = useJournal();
  const { goals } = useGoals();
  const { accounts, transactions, budgets, savingsGoals, currency } = useFinance();
  const { recipes, foods, mealPlans, shoppingList } = useMeals();
  const { logs: sleepLogs, settings: sleepSettings } = useSleep();
  const { timeBlocks } = useTimeBlocks();
  const { prayers, quran, adhkar, settings: islamicSettings } = useIslamic();
  const { savedThemes } = useTheme();
  const { items: visionBoard } = useVisionBoard();
  const { reports } = useReports();
  
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const isRestoringRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = FirebaseService.init((currentUser) => {
      setUser(currentUser);
      setGoogleConnected(!!currentUser);
    });
    return () => unsubscribe();
  }, [setGoogleConnected]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = FirebaseService.subscribeToUserData(async (cloudData) => {
      isRestoringRef.current = true;
      setIsSyncing(true);

      try {
        await BackupService.performReplace(cloudData);
        setLastSyncedAt(new Date());
        showToast('Cloud Data Synced. Changes applied.', 'info');
      } catch (e) {
        console.error("Sync Error:", e);
      } finally {
        setIsSyncing(false);
        setTimeout(() => { isRestoringRef.current = false; }, 3000);
      }
    });

    return () => unsubscribe();
  }, [user, showToast]);

  const getCurrentState = useCallback(() => {
    const state = BackupService.createBackupData(habits, tasks, settings);
    state.habitCategories = habitCategories;
    state.journal = journal;
    state.goals = goals;
    state.visionBoard = visionBoard;
    state.reports = reports;
    state.finance = { accounts, transactions, budgets, savingsGoals, currency };
    state.meals = { recipes, foods, mealPlans, shoppingList };
    state.sleepLogs = sleepLogs;
    state.sleepSettings = sleepSettings;
    state.timeBlocks = timeBlocks;
    state.prayers = prayers;
    state.quran = quran;
    state.adhkar = adhkar;
    state.islamicSettings = islamicSettings;
    state.customThemes = savedThemes;
    return state;
  }, [
    habits, habitCategories, tasks, settings, 
    journal, goals, visionBoard, reports,
    accounts, transactions, budgets, savingsGoals, currency,
    recipes, foods, mealPlans, shoppingList, 
    sleepLogs, sleepSettings,
    timeBlocks, 
    prayers, quran, adhkar, islamicSettings,
    savedThemes
  ]);

  useEffect(() => {
    if (!user) return;
    if (isRestoringRef.current) return; 

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      if (isRestoringRef.current) return;

      setIsSyncing(true);
      try {
        const data = getCurrentState();
        await FirebaseService.saveUserData(data);
        setLastSyncedAt(new Date());
      } catch (e) {
        console.error("Auto-save failed", e);
      } finally {
        setIsSyncing(false);
      }
    }, 5000); 

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, getCurrentState]);

  const syncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
        const data = getCurrentState();
        await FirebaseService.saveUserData(data);
        setLastSyncedAt(new Date());
        showToast('Manual Cloud Sync Complete', 'success');
    } catch(e) {
        showToast('Manual Sync Failed', 'error');
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncedAt, user, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
