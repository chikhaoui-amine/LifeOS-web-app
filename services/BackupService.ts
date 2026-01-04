
import { BackupData, Habit, Task, AppSettings } from '../types';
import { storage } from '../utils/storage';

const AUTO_BACKUP_KEY = 'lifeos_auto_backups';
const MAX_AUTO_BACKUPS = 7;

export const BackupService = {
  
  // --- Export ---

  createBackupData: (habits: Habit[], tasks: Task[], settings: AppSettings): BackupData => {
    return {
      version: "1.3.0",
      appVersion: "1.3.0",
      exportDate: new Date().toISOString(),
      habits,
      tasks,
      settings
    };
  },

  downloadBackup: async (data: BackupData) => {
    const jsonString = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `LifeOS_FullBackup_${dateStr}.json`;

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([jsonString], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'LifeOS Full Backup',
            text: `Comprehensive LifeOS backup created on ${dateStr}`
          });
          return;
        }
      } catch (e) {
        console.log('Share API failed or cancelled, attempting download fallback');
      }
    }

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
    try {
        console.log("Starting atomic restore for all modules...");
        
        // 1. Core Modules
        await storage.save('lifeos_settings_v1', data.settings);
        await storage.save('lifeos_habits_v2', data.habits || []);
        await storage.save('lifeos_tasks_v2', data.tasks || []);
        
        if (data.habitCategories) await storage.save('lifeos_habit_categories_v1', data.habitCategories);

        // 2. Journal & Goals
        if (data.journal) await storage.save('lifeos_journal_v1', data.journal);
        if (data.goals) await storage.save('lifeos_goals_v1', data.goals);
        
        // 3. Vision & Reports
        if (data.visionBoard) await storage.save('lifeos_vision_board_v1', data.visionBoard);
        if (data.reports) await storage.save('lifeos_weekly_reports_v1', data.reports);

        // 4. Finance
        if (data.finance) {
          await storage.save('lifeos_finance_accounts_v1', data.finance.accounts || []);
          await storage.save('lifeos_finance_transactions_v1', data.finance.transactions || []);
          await storage.save('lifeos_finance_budgets_v1', data.finance.budgets || []);
          await storage.save('lifeos_finance_goals_v1', data.finance.savingsGoals || []);
          if (data.finance.currency) await storage.save('lifeos_finance_currency_v1', data.finance.currency);
        }
        
        // 5. Meals
        if (data.meals) {
          await storage.save('lifeos_recipes_v1', data.meals.recipes || []);
          await storage.save('lifeos_foods_v1', data.meals.foods || []);
          await storage.save('lifeos_meal_plans_v1', data.meals.mealPlans || []);
          await storage.save('lifeos_shopping_list_v1', data.meals.shoppingList || []);
        }
        
        // 6. Sleep
        if (data.sleepLogs) await storage.save('lifeos_sleep_logs_v1', data.sleepLogs);
        if (data.sleepSettings) await storage.save('lifeos_sleep_settings_v1', data.sleepSettings);
        
        if (data.timeBlocks) await storage.save('lifeos_time_blocks_v1', data.timeBlocks);
        
        // 7. Deen
        if (data.prayers) await storage.save('lifeos_islamic_data_v2', data.prayers);
        if (data.quran) await storage.save('lifeos_quran_v2', data.quran);
        if (data.adhkar) await storage.save('lifeos_adhkar_v1', data.adhkar);
        if (data.islamicSettings) await storage.save('lifeos_islamic_settings_v1', data.islamicSettings);
        
        // 8. Themes
        if (data.customThemes) await storage.save('lifeos_custom_themes', data.customThemes);
        
        console.log("Restore successful.");
        return true;
    } catch (e) {
        console.error("Restore failed", e);
        throw e;
    }
  },

  saveAutoSnapshot: async (snapshot: BackupData) => {
    const history = await storage.load<BackupData[]>(AUTO_BACKUP_KEY) || [];
    const newHistory = [snapshot, ...history].slice(0, MAX_AUTO_BACKUPS);
    await storage.save(AUTO_BACKUP_KEY, newHistory);
  },

  getAutoSnapshots: async (): Promise<BackupData[]> => {
    return await storage.load<BackupData[]>(AUTO_BACKUP_KEY) || [];
  }
};
