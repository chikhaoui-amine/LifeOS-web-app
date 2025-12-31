
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

  const syncNow = useCallback(async () => {
    if (!isGoogleConnected || !GoogleDriveService.isSignedIn) return;

    setIsSyncing(true);
    try {
      const state = BackupService.createBackupData(habits, tasks, settings);
      state.journal = journal;
      state.goals = goals;
      state.finance = { accounts, transactions, budgets, savingsGoals };
      state.meals = { recipes, mealPlans, shoppingList };
      state.sleepLogs = sleepLogs;
      state.timeBlocks = timeBlocks;

      await GoogleDriveService.saveMasterSync(state);
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error("Auto-sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, habits, tasks, settings, journal, goals, accounts, transactions, budgets, savingsGoals, recipes, mealPlans, shoppingList, sleepLogs, timeBlocks]);

  const pullFromCloud = useCallback(async () => {
    if (!isGoogleConnected) return;
    
    setIsSyncing(true);
    try {
      if (!GoogleDriveService.isSignedIn) await GoogleDriveService.signIn();
      
      const cloudData = await GoogleDriveService.getLatestMasterSync();
      if (cloudData) {
        // Compare with local and prompt or auto-merge
        // For a seamless "everything up to date" experience, we replace local with cloud on startup
        // if cloud is newer (or just always replace on startup if connected)
        await BackupService.performReplace(cloudData);
        showToast('Sync complete: Data updated from cloud', 'success');
        // We don't reload here to avoid loops, the contexts will pick up new storage data on next load 
        // OR better: reload once.
        window.location.reload();
      }
    } catch (e) {
      console.error("Pull from cloud failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, showToast]);

  // Initial Pull on startup if connected
  useEffect(() => {
    if (isGoogleConnected && isInitialLoad.current) {
      pullFromCloud();
      isInitialLoad.current = false;
    }
  }, [isGoogleConnected, pullFromCloud]);

  // Automated Push (Debounced)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!isGoogleConnected) return;

    // Debounce to avoid hitting API on every keystroke in journal/tasks
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    
    syncTimeout.current = setTimeout(() => {
      syncNow();
    }, 5000); // 5 second quiet period before sync

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [isGoogleConnected, habits, tasks, settings, journal, goals, accounts, transactions, budgets, savingsGoals, recipes, mealPlans, shoppingList, sleepLogs, timeBlocks, syncNow]);

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
