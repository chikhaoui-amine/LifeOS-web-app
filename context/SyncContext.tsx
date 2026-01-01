
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
import { GoogleDriveService } from '../services/GoogleDriveService';
import { BackupService } from '../services/BackupService';
import { useToast } from './ToastContext';

interface SyncContextType {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, isGoogleConnected, updateSettings } = useSettings();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { entries: journal } = useJournal();
  const { goals } = useGoals();
  const { accounts, transactions, budgets, savingsGoals } = useFinance();
  const { recipes, mealPlans, shoppingList } = useMeals();
  const { logs: sleepLogs } = useSleep();
  const { timeBlocks } = useTimeBlocks();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isInitialLoad = useRef(true);
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to create the full backup object from current state
  const getCurrentState = useCallback(() => {
    const state = BackupService.createBackupData(habits, tasks, settings);
    state.journal = journal;
    state.goals = goals;
    state.finance = { accounts, transactions, budgets, savingsGoals };
    state.meals = { recipes, mealPlans, shoppingList };
    state.sleepLogs = sleepLogs;
    state.timeBlocks = timeBlocks;
    return state;
  }, [habits, tasks, settings, journal, goals, accounts, transactions, budgets, savingsGoals, recipes, mealPlans, shoppingList, sleepLogs, timeBlocks]);

  const syncNow = useCallback(async () => {
    if (!isGoogleConnected || !GoogleDriveService.isSignedIn) return;

    setIsSyncing(true);
    try {
      const state = getCurrentState();
      await GoogleDriveService.saveMasterSync(state);
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error("Auto-sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, getCurrentState]);

  const pullFromCloud = useCallback(async () => {
    if (!isGoogleConnected) return;
    
    setIsSyncing(true);
    try {
      if (!GoogleDriveService.isSignedIn) await GoogleDriveService.signIn();
      
      const cloudData = await GoogleDriveService.getLatestMasterSync();
      if (cloudData) {
        // In a real robust system, we would check timestamps here.
        // For LifeOS simpler sync: Cloud wins on startup if connected.
        await BackupService.performReplace(cloudData);
        setLastSyncedAt(new Date());
        
        // Force a reload to ensure all contexts pick up the new local storage data
        // Only do this if we actually pulled data, to avoid loops if data is identical?
        // Since we blindly replace on startup, we reload to be safe.
        // To avoid infinite reload loops, we could check a session flag, but `isInitialLoad` handles the react effect loop.
        window.location.reload();
      }
    } catch (e) {
      console.error("Pull from cloud failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected]);

  // Initial Pull on startup if connected
  useEffect(() => {
    const initSync = async () => {
        if (isGoogleConnected && isInitialLoad.current) {
            // Short delay to ensure Auth is ready
            setTimeout(() => pullFromCloud(), 1000);
            isInitialLoad.current = false;
        }
    };
    initSync();
  }, [isGoogleConnected, pullFromCloud]);

  // Automated Push (Debounced)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!isGoogleConnected) return;

    // Debounce to avoid hitting API on every keystroke
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    
    syncTimeout.current = setTimeout(() => {
      syncNow();
    }, 5000); // 5 second quiet period before sync

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [isGoogleConnected, getCurrentState, syncNow]);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncedAt, syncNow, pullFromCloud }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
