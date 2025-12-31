
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, LanguageCode } from '../types';
import { storage } from '../utils/storage';
import { BackupService } from '../services/BackupService';
import { Habit } from '../types';
import { Task } from '../types';
import { isRTL } from '../utils/translations';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings> | any) => void;
  resetSettings: () => void;
  isGoogleConnected: boolean;
  setGoogleConnected: (connected: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = 'lifeos_settings_v1';
const GOOGLE_CONNECTED_KEY = 'lifeos_google_linked';
const LAST_BACKUP_KEY = 'lifeos_last_auto_backup';

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    enabled: true,
    habits: true,
    tasks: true,
    dailySummary: true,
    morningTime: '08:00',
    eveningTime: '20:00',
  },
  preferences: {
    language: 'en',
    startOfWeek: 'sunday',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    autoBackup: false,
    enableIslamicFeatures: true,
  },
  meals: {
    waterGoal: 8
  }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isGoogleConnected, setGoogleConnectedState] = useState(false);

  // Helper for deep merging to ensure nested defaults are preserved
  const mergeDeep = (target: any, source: any) => {
    if (!source) return target;
    const result = { ...target, ...source };
    if (target.notifications && source.notifications) {
      result.notifications = { ...target.notifications, ...source.notifications };
    }
    if (target.preferences && source.preferences) {
      result.preferences = { ...target.preferences, ...source.preferences };
    }
    if (target.meals && source.meals) {
      result.meals = { ...target.meals, ...source.meals };
    }
    return result;
  };

  // Load Settings
  useEffect(() => {
    const loadSettings = async () => {
      const data = await storage.load<any>(SETTINGS_KEY);
      if (data) {
        setSettings(prev => mergeDeep(prev, data));
      }
      
      const googleLinked = await storage.load<boolean>(GOOGLE_CONNECTED_KEY);
      setGoogleConnectedState(!!googleLinked);
    };
    loadSettings();
  }, []);

  // Update HTML Direction and Language defensively
  useEffect(() => {
    const lang = settings?.preferences?.language || 'en';
    document.documentElement.dir = isRTL(lang as LanguageCode) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [settings?.preferences?.language]);

  // Check Auto Backup Logic
  useEffect(() => {
    const checkAutoBackup = async () => {
      if (!settings?.preferences?.autoBackup) return;

      const lastBackupStr = await storage.load<string>(LAST_BACKUP_KEY);
      const now = new Date();
      const lastBackup = lastBackupStr ? new Date(lastBackupStr) : new Date(0);
      
      const oneDay = 24 * 60 * 60 * 1000;
      if (now.getTime() - lastBackup.getTime() > oneDay) {
        const habits = await storage.load<Habit[]>('lifeos_habits_v2') || [];
        const tasks = await storage.load<Task[]>('lifeos_tasks_v2') || [];
        
        await BackupService.createAutoSnapshot(habits, tasks, settings);
        await storage.save(LAST_BACKUP_KEY, now.toISOString());
      }
    };

    const timer = setTimeout(checkAutoBackup, 2000);
    return () => clearTimeout(timer);
  }, [settings?.preferences?.autoBackup]);

  const updateSettings = (updates: any) => {
    setSettings(prev => {
      const newSettings = mergeDeep(prev, updates);
      if (updates.morningTime) newSettings.notifications.morningTime = updates.morningTime;
      
      storage.save(SETTINGS_KEY, newSettings);
      return newSettings;
    });
  };

  const setGoogleConnected = (connected: boolean) => {
    setGoogleConnectedState(connected);
    storage.save(GOOGLE_CONNECTED_KEY, connected);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    storage.save(SETTINGS_KEY, DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings, 
      isGoogleConnected, 
      setGoogleConnected 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
