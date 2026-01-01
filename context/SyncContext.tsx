
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

const RESTORE_FLAG = 'lifeos_restore_pending';
const LAST_PULL_KEY = 'lifeos_last_pull_ts';

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, isGoogleConnected } = useSettings();
  
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
  
  // Safety flags
  const [isReadyToPush, setIsReadyToPush] = useState(false);
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to create the full backup object
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

  const syncNow = useCallback(async () => {
    if (!isGoogleConnected) return;
    
    // IMPORTANT: Never push if we haven't successfully initialized/pulled yet
    if (!isReadyToPush) {
        return;
    }

    setIsSyncing(true);
    try {
      // Ensure auth
      if (!GoogleDriveService.isSignedIn) await GoogleDriveService.signIn();
      
      const state = getCurrentState();
      await GoogleDriveService.saveMasterSync(state);
      setLastSyncedAt(new Date());
      console.log("Cloud Sync Successful");
    } catch (e) {
      console.error("Auto-sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, isReadyToPush, getCurrentState]);

  const pullFromCloud = useCallback(async () => {
    if (!isGoogleConnected) return;
    
    setIsSyncing(true);
    try {
      if (!GoogleDriveService.isSignedIn) await GoogleDriveService.signIn();
      
      const cloudData = await GoogleDriveService.getLatestMasterSync();
      if (cloudData) {
        await BackupService.performReplace(cloudData);
        setLastSyncedAt(new Date());
        
        // Mark as recently pulled to prevent loops
        localStorage.setItem(LAST_PULL_KEY, Date.now().toString());
        // Set flag for restore handling
        localStorage.setItem(RESTORE_FLAG, 'true');
        
        window.location.reload();
      } else {
        console.log("No remote backup found.");
        // Even if no data, we mark as pulled so we can start pushing
        localStorage.setItem(LAST_PULL_KEY, Date.now().toString());
      }
    } catch (e) {
      console.error("Pull from cloud failed", e);
      showToast('Could not sync with Google Drive', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, showToast]);

  // Initial Sync Logic (The "Handshake")
  useEffect(() => {
    const initSync = async () => {
        // 1. Check if we just reloaded from a restore
        const restoreFlag = localStorage.getItem(RESTORE_FLAG);
        if (restoreFlag) {
            console.log("Sync: Recovered from restore reload.");
            localStorage.removeItem(RESTORE_FLAG);
            setIsReadyToPush(true);
            setLastSyncedAt(new Date());
            return;
        }

        if (isGoogleConnected) {
            // 2. Safety Check: If we pulled very recently (e.g. < 15 seconds ago), don't pull again.
            // This prevents the infinite reload loop if the flag mechanism fails.
            const lastPull = localStorage.getItem(LAST_PULL_KEY);
            if (lastPull && (Date.now() - parseInt(lastPull) < 15000)) {
                console.log("Sync: Recently pulled, skipping initial pull to prevent loop.");
                setIsReadyToPush(true);
                return;
            }

            try {
               await pullFromCloud();
            } catch(e) { console.error(e); }
            finally { 
                // Allow pushing after attempt, success or fail
                setIsReadyToPush(true); 
            }
        } else {
            setIsReadyToPush(true);
        }
    };
    
    // Delay to allow Auth load
    const timer = setTimeout(initSync, 2000);
    return () => clearTimeout(timer);
  }, [isGoogleConnected]); // Intentionally exclude pullFromCloud to avoid recreation loops

  // Automated Push (Debounced)
  useEffect(() => {
    if (!isReadyToPush) return;
    if (!isGoogleConnected) return;

    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    
    // 5 second debounce for auto-save
    syncTimeout.current = setTimeout(() => {
      syncNow();
    }, 5000);

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [getCurrentState, isReadyToPush, isGoogleConnected]); 

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
