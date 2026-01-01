
import { BackupData, Habit, Task, AppSettings } from '../types';
import { storage } from '../utils/storage';

const AUTO_BACKUP_KEY = 'lifeos_auto_backups';
const MAX_AUTO_BACKUPS = 7;

export const BackupService = {
  
  // --- Export ---

  createBackupData: (habits: Habit[], tasks: Task[], settings: AppSettings): BackupData => {
    return {
      version: "1.2.0",
      appVersion: "1.2.0",
      exportDate: new Date().toISOString(),
      habits,
      tasks,
      settings
    };
  },

  downloadBackup: async (data: BackupData) => {
    const jsonString = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `LifeOS_Backup_${dateStr}.json`;

    // 1. Try Native Share (Mobile friendly)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([jsonString], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'LifeOS Backup',
            text: `Backup created on ${dateStr}`
          });
          return;
        }
      } catch (e) {
        // Share cancelled or failed, fall back to download
        console.log('Share API failed or cancelled, attempting download fallback');
      }
    }

    // 2. Fallback: Standard Browser Download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  },

  // --- Import & Validation ---

  validateBackup: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const hasHabits = Array.isArray(data.habits);
    const hasTasks = Array.isArray(data.tasks);
    const hasSettings = typeof data.settings === 'object';
    return hasHabits && hasTasks && hasSettings;
  },

  readBackupFile: (file: File): Promise<BackupData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          if (BackupService.validateBackup(data)) {
            resolve(data as BackupData);
          } else {
            reject(new Error("Invalid backup file structure."));
          }
        } catch (error) {
          reject(new Error("Failed to parse JSON file."));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file."));
      reader.readAsText(file);
    });
  },

  // --- Restore Logic ---

  performReplace: async (data: BackupData) => {
    // 1. Core Modules
    await storage.save('lifeos_habits_v2', data.habits);
    if (data.habitCategories) await storage.save('lifeos_habit_categories_v1', data.habitCategories);
    await storage.save('lifeos_tasks_v2', data.tasks);
    await storage.save('lifeos_settings_v1', data.settings);

    // 2. Extended Modules
    if (data.journal) await storage.save('lifeos_journal_v1', data.journal);
    if (data.goals) await storage.save('lifeos_goals_v1', data.goals);
    
    if (data.finance) {
      await storage.save('lifeos_finance_accounts_v1', data.finance.accounts);
      await storage.save('lifeos_finance_transactions_v1', data.finance.transactions);
      await storage.save('lifeos_finance_budgets_v1', data.finance.budgets);
      await storage.save('lifeos_finance_goals_v1', data.finance.savingsGoals);
      if (data.finance.currency) await storage.save('lifeos_finance_currency_v1', data.finance.currency);
    }
    
    if (data.meals) {
      await storage.save('lifeos_recipes_v1', data.meals.recipes);
      if (data.meals.foods) await storage.save('lifeos_foods_v1', data.meals.foods);
      await storage.save('lifeos_meal_plans_v1', data.meals.mealPlans);
      await storage.save('lifeos_shopping_list_v1', data.meals.shoppingList);
    }
    
    if (data.sleepLogs) await storage.save('lifeos_sleep_logs_v1', data.sleepLogs);
    if (data.sleepSettings) await storage.save('lifeos_sleep_settings_v1', data.sleepSettings);
    
    if (data.digitalWellness) {
      await storage.save('lifeos_wellness_apps_v1', data.digitalWellness.blockedApps);
      await storage.save('lifeos_wellness_settings_v1', data.digitalWellness.settings);
      if (data.digitalWellness.stats) await storage.save('lifeos_wellness_stats_v1', data.digitalWellness.stats);
    }
    
    if (data.timeBlocks) await storage.save('lifeos_time_blocks_v1', data.timeBlocks);
    
    if (data.prayers) await storage.save('lifeos_islamic_data_v2', data.prayers);
    if (data.quran) await storage.save('lifeos_quran_v2', data.quran);
    if (data.adhkar) await storage.save('lifeos_adhkar_v1', data.adhkar);
    if (data.islamicSettings) await storage.save('lifeos_islamic_settings_v1', data.islamicSettings);
    
    if (data.customThemes) await storage.save('lifeos_custom_themes', data.customThemes);
    
    return true;
  },

  performMerge: async (data: BackupData, currentHabits: Habit[], currentTasks: Task[]) => {
    // Only merges core items for safety, extended items logic would be too complex for simple merge
    const newHabits = [...currentHabits];
    let habitsAdded = 0;
    data.habits.forEach(h => {
      if (!newHabits.find(curr => curr.id === h.id)) {
        newHabits.push(h);
        habitsAdded++;
      }
    });

    const newTasks = [...currentTasks];
    let tasksAdded = 0;
    data.tasks.forEach(t => {
      if (!newTasks.find(curr => curr.id === t.id)) {
        newTasks.push(t);
        tasksAdded++;
      }
    });

    await storage.save('lifeos_habits_v2', newHabits);
    await storage.save('lifeos_tasks_v2', newTasks);
    
    return { habitsAdded, tasksAdded };
  },

  createAutoSnapshot: async (habits: Habit[], tasks: Task[], settings: AppSettings) => {
    const snapshot = BackupService.createBackupData(habits, tasks, settings);
    const history = await storage.load<BackupData[]>(AUTO_BACKUP_KEY) || [];
    const newHistory = [snapshot, ...history].slice(0, MAX_AUTO_BACKUPS);
    await storage.save(AUTO_BACKUP_KEY, newHistory);
  },

  getAutoSnapshots: async (): Promise<BackupData[]> => {
    return await storage.load<BackupData[]>(AUTO_BACKUP_KEY) || [];
  }
};
