
import React, { useState, useMemo } from 'react';
import { Cloud, LogOut, Check, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useSync } from '../../context/SyncContext';
import { GoogleDriveService } from '../../services/GoogleDriveService';
import { getTranslation } from '../../utils/translations';
import { LanguageCode } from '../../types';
import { useToast } from '../../context/ToastContext';

export const GoogleBackupManager: React.FC = () => {
  const { settings, isGoogleConnected, setGoogleConnected } = useSettings();
  const { isSyncing, lastSyncedAt } = useSync();
  const { showToast } = useToast();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);

  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await GoogleDriveService.signIn();
      setGoogleConnected(true);
      showToast('Successfully connected to Google Drive', 'success');
      // Trigger a sync immediately after connection
      window.location.reload(); 
    } catch (e) {
      showToast('Failed to connect to Google Account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await GoogleDriveService.signOut();
    setGoogleConnected(false);
    showToast('Disconnected from Google Account', 'info');
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
              Securely back up your LifeOS data to your personal Google Drive and sync across devices automatically.
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
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shrink-0">
                <Check size={24} strokeWidth={3} />
             </div>
             <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{t.settings.googleSync}</h3>
                <p className="text-xs text-gray-500">Auto-backup enabled</p>
             </div>
          </div>
          <button 
            onClick={handleDisconnect}
            className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
             <LogOut size={14} /> {t.settings.disconnectGoogle}
          </button>
       </div>

       <div className="p-6">
          <div className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${isSyncing ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700'}`}>
             <div className={`p-2 rounded-full ${isSyncing ? 'text-blue-600' : 'text-gray-400'}`}>
                <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
             </div>
             <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                   {isSyncing ? 'Syncing with cloud...' : 'Up to date'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                   {isSyncing 
                      ? 'Backing up your latest changes...' 
                      : lastSyncedAt 
                         ? `Last synced: ${lastSyncedAt.toLocaleTimeString()} ${lastSyncedAt.toLocaleDateString()}` 
                         : 'Waiting for next sync...'}
                </p>
             </div>
             {!isSyncing && (
                <CheckCircle2 size={20} className="text-green-500" />
             )}
          </div>
          
          <p className="text-[10px] text-gray-400 text-center mt-4">
             LifeOS automatically backs up your data every time you make changes.
          </p>
       </div>
    </div>
  );
};
