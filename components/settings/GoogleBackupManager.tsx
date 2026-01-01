
import React, { useState, useMemo } from 'react';
import { Cloud, LogOut, Check, Loader2, RefreshCw, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useSync } from '../../context/SyncContext';
import { FirebaseService } from '../../services/FirebaseService';
import { getTranslation } from '../../utils/translations';
import { LanguageCode } from '../../types';
import { useToast } from '../../context/ToastContext';

export const GoogleBackupManager: React.FC = () => {
  const { settings } = useSettings();
  const { isSyncing, lastSyncedAt, user, syncNow } = useSync();
  const { showToast } = useToast();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await FirebaseService.signIn();
      showToast('Signed in successfully', 'success');
    } catch (e: any) {
      console.error("Firebase Auth Error:", e);
      if (e.code === 'auth/popup-closed-by-user') {
        showToast('Sign in cancelled', 'info');
      } else if (e.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setAuthError(`Domain "${domain}" is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
        showToast('Unauthorized Domain', 'error');
      } else if (e.code === 'auth/cancelled-popup-request') {
        // Ignore multiple clicks
      } else {
        showToast(`Sign in failed: ${e.message}`, 'error');
        setAuthError(e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await FirebaseService.signOut();
    showToast('Signed out', 'info');
    setAuthError(null);
  };

  return (
    <>
      {!user ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center space-y-4">
           <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <Cloud size={32} />
           </div>
           <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cloud Sync</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Sign in with Google to automatically backup your data and sync across all your devices.
              </p>
           </div>
           
           <div className="flex flex-col gap-2 w-full max-w-xs">
             <button 
               onClick={handleConnect}
               disabled={isLoading}
               className="w-full px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
             >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />}
                Sign in with Google
             </button>
           </div>

           {authError && (
             <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2 text-left max-w-xs break-words">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
             </div>
           )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={24} />
                    )}
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{user.displayName || 'User'}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                 </div>
              </div>
              <button 
                onClick={handleDisconnect}
                className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                 <LogOut size={14} /> Sign Out
              </button>
           </div>

           <div className="p-6 space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${isSyncing ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700'}`}>
                 <div className={`p-2 rounded-full ${isSyncing ? 'text-blue-600' : 'text-gray-400'}`}>
                    <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                 </div>
                 <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                       {isSyncing ? 'Syncing...' : 'Cloud Active'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                       {isSyncing 
                          ? 'Synchronizing data...' 
                          : lastSyncedAt 
                             ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}` 
                             : 'Waiting for changes...'}
                    </p>
                 </div>
                 {!isSyncing && (
                    <Check size={20} className="text-green-500" />
                 )}
              </div>
              
              <button 
                onClick={syncNow}
                disabled={isSyncing}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Force Sync
              </button>
           </div>
        </div>
      )}
    </>
  );
};
    