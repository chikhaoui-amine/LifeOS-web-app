
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
import { useDigitalWellness } from './DigitalWellnessContext';
import { useIslamic } from './IslamicContext';
import { FirebaseService } from '../services/FirebaseService';
import { BackupService } from '../services/BackupService';
import { useToast } from './ToastContext';
import { User } from 'firebase/auth';

interface SyncContextType {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  user: User | null;
  syncNow: () => Promise<void>; // Manual force push
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, setGoogleConnected } = useSettings();
  
  // Data Contexts
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { entries: journal } = useJournal();
  const { goals } = useGoals();
  const { accounts, transactions, budgets, savingsGoals } = useFinance();
  const { recipes, mealPlans, shoppingList } = useMeals();
  const { logs: sleepLogs } = useSleep();
  const { timeBlocks } = useTimeBlocks();
  const { blockedApps, settings: wellnessSettings } = useDigitalWellness();
  const { prayers, quran, adhkar } = useIslamic();
  
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Ref to prevent "saving" data that we just "received" from the cloud
  const isRestoringRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = FirebaseService.init((currentUser) => {
      setUser(currentUser);
      setGoogleConnected(!!currentUser);
    });
    return () => unsubscribe();
  }, [setGoogleConnected]);

  // 2. Real-time Subscription (Cloud -> Device)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = FirebaseService.subscribeToUserData(async (cloudData) => {
      console.log("Sync: Cloud data received, updating local...");
      
      // Set flag to prevent the 'useEffect' below from pushing this data back to cloud
      isRestoringRef.current = true;
      setIsSyncing(true);

      try {
        await BackupService.performReplace(cloudData);
        setLastSyncedAt(new Date());
        
        // Notify all contexts to reload from localStorage
        window.dispatchEvent(new Event('lifeos-sync-complete'));
        showToast('Data synced from other device', 'success');
      } catch (e) {
        console.error("Sync Error:", e);
      } finally {
        setIsSyncing(false);
        // Allow pushes again after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [user, showToast]);

  // Helper: Create Snapshot
  const getCurrentState = useCallback(() => {
    const state = BackupService.createBackupData(habits, tasks, settings);
    state.journal = journal;
    state.goals = goals;
    state.finance = { accounts, transactions, budgets, savingsGoals };
    state.meals = { recipes, mealPlans, shoppingList };
    state.sleepLogs = sleepLogs;
    state.timeBlocks = timeBlocks;
    state.digitalWellness = { blockedApps, settings: wellnessSettings };
    state.prayers = prayers;
    state.quran = quran;
    state.adhkar = adhkar;
    return state;
  }, [habits, tasks, settings, journal, goals, accounts, transactions, budgets, savingsGoals, recipes, mealPlans, shoppingList, sleepLogs, timeBlocks, blockedApps, wellnessSettings, prayers, quran, adhkar]);

  // 3. Auto-Save (Device -> Cloud)
  useEffect(() => {
    if (!user) return;
    if (isRestoringRef.current) return; // Don't save if we are currently restoring

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      if (isRestoringRef.current) return; // Double check

      setIsSyncing(true);
      try {
        const data = getCurrentState();
        await FirebaseService.saveUserData(data);
        setLastSyncedAt(new Date());
        console.log("Sync: Pushed local changes to cloud");
      } catch (e) {
        console.error("Auto-save failed", e);
      } finally {
        setIsSyncing(false);
      }
    }, 5000); // 5 second debounce

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, getCurrentState]); // Dependency on state triggers this effect

  const syncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
        const data = getCurrentState();
        await FirebaseService.saveUserData(data);
        setLastSyncedAt(new Date());
        showToast('Force sync complete', 'success');
    } catch(e) {
        showToast('Sync failed', 'error');
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
