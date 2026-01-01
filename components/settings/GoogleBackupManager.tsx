
import React, { useState, useMemo } from 'react';
import { Cloud, UploadCloud, DownloadCloud, LogOut, Check, Loader2, Calendar, FileJson, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useHabits } from '../../context/HabitContext';
import { useTasks } from '../../context/TaskContext';
import { useJournal } from '../../context/JournalContext';
import { useGoals } from '../../context/GoalContext';
import { useFinance } from '../../context/FinanceContext';
import { useMeals } from '../../context/MealContext';
import { useSleep } from '../../context/SleepContext';
import { GoogleDriveService, GoogleDriveFile } from '../../services/GoogleDriveService';
import { BackupService } from '../../services/BackupService';
import { getTranslation } from '../../utils/translations';
import { LanguageCode } from '../../types';
import { useToast } from '../../context/ToastContext';
import { RestoreModal } from './RestoreModal';

export const GoogleBackupManager: React.FC = () => {
  const { settings, isGoogleConnected, setGoogleConnected } = useSettings();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { entries: journal } = useJournal();
  const { goals } = useGoals();
  const { accounts, transactions, budgets, savingsGoals } = useFinance();
  const { recipes, mealPlans, shoppingList } = useMeals();
  const { logs: sleepLogs } = useSleep();
  const { showToast } = useToast();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);

  const [isLoading, setIsLoading] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<GoogleDriveFile[]>([]);
  const [isListing, setIsListing] = useState(false);
  const [restoreData, setRestoreData] = useState<any>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await GoogleDriveService.signIn();
      setGoogleConnected(true);
      showToast('Successfully connected to Google Drive', 'success');
    } catch (e) {
      showToast('Failed to connect to Google Account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await GoogleDriveService.signOut();
    setGoogleConnected(false);
    setCloudFiles([]);
    showToast('Disconnected from Google Account', 'info');
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const fullBackup = BackupService.createBackupData(habits, tasks, settings);
      fullBackup.journal = journal;
      fullBackup.goals = goals;
      fullBackup.finance = { accounts, transactions, budgets, savingsGoals };
      fullBackup.sleepLogs = sleepLogs;
      fullBackup.meals = { recipes, mealPlans, shoppingList };

      await GoogleDriveService.uploadBackup(fullBackup);
      showToast('Backup successful!', 'success');
      if (cloudFiles.length > 0) handleListFiles(); 
    } catch (e) {
      showToast('Backup failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListFiles = async () => {
    setIsListing(true);
    try {
      const files = await GoogleDriveService.listFiles();
      setCloudFiles(files);
    } catch (e) {
      showToast('Failed to fetch cloud backups', 'error');
    } finally {
      setIsListing(false);
    }
  };

  const handleDownloadAndPrepareRestore = async (fileId: string) => {
     setIsLoading(true);
     try {
        const data = await GoogleDriveService.downloadFile(fileId);
        setRestoreData(data);
        setIsRestoreModalOpen(true);
     } catch (e) {
        showToast('Download failed', 'error');
     } finally {
        setIsLoading(false);
     }
  };

  const executeRestore = async (method: 'merge' | 'replace') => {
     if (!restoreData) return;
     
     try {
        if (method === 'replace') {
           await BackupService.performReplace(restoreData);
           showToast('Full restore complete. Reloading...', 'success');
           setTimeout(() => window.location.reload(), 1500);
        } else {
           const result = await BackupService.performMerge(restoreData, habits, tasks);
           showToast(`Merged ${result.habitsAdded} habits and ${result.tasksAdded} tasks.`, 'success');
           setIsRestoreModalOpen(false);
        }
     } catch (e) {
        showToast('Restore failed', 'error');
     }
  };

  if (!isGoogleConnected) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center space-y-4">
         <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-2">
            <Cloud size={32} />
         </div>
         <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.settings.googleAccount}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Securely back up your LifeOS data to your personal Google Drive and sync across devices.
            </p>
         </div>
         <button 
           onClick={handleConnect}
           disabled={isLoading}
           className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
         >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />}
            {t.settings.connectGoogle}
         </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
       <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                <Check size={24} strokeWidth={3} />
             </div>
             <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t.settings.googleSync}</h3>
                <p className="text-xs text-gray-500">Google Account Connected</p>
             </div>
          </div>
          <button 
            onClick={handleDisconnect}
            className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
             <LogOut size={14} /> {t.settings.disconnectGoogle}
          </button>
       </div>

       <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleBackup}
            disabled={isLoading}
            className="p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
             {isLoading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
             {t.settings.backupToDrive}
          </button>

          <button 
            onClick={handleListFiles}
            disabled={isLoading || isListing}
            className="p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
             {isListing ? <Loader2 size={20} className="animate-spin" /> : <DownloadCloud size={20} />}
             {t.settings.restoreFromDrive}
          </button>
       </div>

       {cloudFiles.length > 0 && (
         <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Cloud Backups</h4>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
               {cloudFiles.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 transition-all group"
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl text-gray-400">
                           <FileJson size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{file.name}</p>
                           <p className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Calendar size={10} /> {new Date(file.createdTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short'})}
                           </p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDownloadAndPrepareRestore(file.id)}
                       className="p-2 bg-white dark:bg-gray-800 rounded-xl text-primary-600 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:scale-105"
                     >
                        <DownloadCloud size={18} />
                     </button>
                  </div>
               ))}
            </div>
         </div>
       )}

       <RestoreModal 
         isOpen={isRestoreModalOpen}
         onClose={() => setIsRestoreModalOpen(false)}
         backupData={restoreData}
         onRestore={executeRestore}
       />
    </div>
  );
};
