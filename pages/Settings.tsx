
import React, { useState, useMemo } from 'react';
import { 
  Bell, Trash2, Plus, Download, Palette, Check, 
  ChevronDown, ChevronUp, Globe, Cloud, Calendar, Moon, 
  Shield, Cpu, Sparkles, Sun, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { SettingSection } from '../components/settings/SettingSection';
import { SettingItem } from '../components/settings/SettingItem';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ThemePreview } from '../components/ThemePreview';
import { GoogleBackupManager } from '../components/settings/GoogleBackupManager';
import { PREBUILT_THEMES } from '../utils/themeLibrary';
import { BackupService } from '../services/BackupService';
import { storage } from '../utils/storage';
import { LanguageCode } from '../types';
import { getTranslation } from '../utils/translations';

// Modules
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useJournal } from '../context/JournalContext';
import { useGoals } from '../context/GoalContext';
import { useFinance } from '../context/FinanceContext';
import { useMeals } from '../context/MealContext';
import { useSleep } from '../context/SleepContext';
import { useTimeBlocks } from '../context/TimeBlockContext';
import { useDigitalWellness } from '../context/DigitalWellnessContext';
import { useIslamic } from '../context/IslamicContext';

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Violet', value: '#8b5cf6' },
];

const LANGUAGE_OPTIONS: { label: string; value: LanguageCode }[] = [
  { label: 'English (US)', value: 'en' },
  { label: 'العربية (Arabic)', value: 'ar' },
  { label: 'Español (Spanish)', value: 'es' },
  { label: 'Français (French)', value: 'fr' },
];

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { settings, updateSettings } = useSettings();
  const { currentTheme, savedThemes, applyTheme, updateThemePrimaryColor, deleteCustomTheme } = useTheme();
  
  // Data Contexts
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { entries: journal } = useJournal();
  const { goals } = useGoals();
  // Fix: Destructure currency to include in backup data
  const { accounts, transactions, budgets, savingsGoals, currency } = useFinance();
  // Fix: Destructure foods to include in backup data
  const { recipes, foods, mealPlans, shoppingList } = useMeals();
  const { logs: sleepLogs } = useSleep();
  const { timeBlocks } = useTimeBlocks();
  const { blockedApps, settings: wellnessSettings } = useDigitalWellness();
  const { prayers, quran, adhkar } = useIslamic();
  
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });
  const [showThemes, setShowThemes] = useState(false);

  const allThemes = [...PREBUILT_THEMES, ...savedThemes];

  const handleBackupData = () => {
     const data = BackupService.createBackupData(habits, tasks, settings);
     
     // Attach comprehensive data
     data.journal = journal;
     data.goals = goals;
     // Fix: Add currency to finance backup object
     data.finance = { accounts, transactions, budgets, savingsGoals, currency };
     // Fix: Add foods to meals backup object
     data.meals = { recipes, foods, mealPlans, shoppingList };
     data.sleepLogs = sleepLogs;
     data.timeBlocks = timeBlocks;
     data.digitalWellness = { blockedApps, settings: wellnessSettings };
     data.prayers = prayers;
     data.quran = quran;
     data.adhkar = adhkar;

     BackupService.downloadBackup(data);
  };

  const handleResetApp = () => {
    setModalConfig({
        isOpen: true,
        title: t.settings.reset,
        message: 'This will delete ALL data permanently from this device. This action cannot be reversed.',
        type: 'nuclear',
        confirmText: 'Factory Reset',
        onConfirm: async () => {
            await storage.clearAll();
            window.location.reload();
        }
    });
  };

  const handleDeleteTheme = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Custom Theme',
      message: 'Are you sure you want to remove this style? You cannot undo this.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => deleteCustomTheme(id)
    });
  };

  return (
    <div className="w-full pb-32 animate-in fade-in duration-500 px-4 sm:px-6">
      
      <header className="py-8 sm:py-12">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          {t.nav.settings}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-xl">
          Personalize your experience and manage your data.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Column 1 */}
        <div className="space-y-6 sm:space-y-8">
            
            {/* Preferences */}
            <SettingSection title={t.settings.preferences}>
              <SettingItem 
                label={t.settings.language}
                subLabel="Primary interface and localization"
                icon={Globe}
                type="select"
                options={LANGUAGE_OPTIONS}
                value={settings?.preferences?.language || 'en'}
                onChange={(val) => updateSettings({ preferences: { ...settings?.preferences, language: val as LanguageCode } })}
              />
              
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center gap-3.5">
                    <div className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg">
                      <Calendar size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Start of Week</span>
                      <span className="text-xs text-gray-400 mt-0.5">Define your weekly reset day</span>
                    </div>
                </div>
                <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-700 self-end sm:self-center">
                    {['sunday', 'monday'].map(day => (
                      <button
                        key={day}
                        onClick={() => updateSettings({ preferences: { ...settings?.preferences, startOfWeek: day } })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${settings?.preferences?.startOfWeek === day ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      >
                          {day}
                      </button>
                    ))}
                </div>
              </div>

              <SettingItem 
                  label={t.settings.islamicFeatures}
                  subLabel="Enable prayers, Quran tracking, and Hijri calendar"
                  icon={Moon}
                  type="toggle"
                  value={settings?.preferences?.enableIslamicFeatures}
                  onChange={(val) => updateSettings({ preferences: { ...settings?.preferences, enableIslamicFeatures: val } })}
              />
            </SettingSection>

            {/* Appearance */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setShowThemes(!showThemes)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all text-left group"
                >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                          <Palette size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.settings.appearance}</h3>
                          <p className="text-xs text-gray-500 font-medium">Current: {currentTheme.name}</p>
                      </div>
                    </div>
                    {showThemes ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {showThemes && (
                  <div className="p-6 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accent Color</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ACCENT_COLORS.map(color => (
                              <button
                                key={color.value}
                                onClick={() => updateThemePrimaryColor(color.value)}
                                className="relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm border border-white dark:border-gray-700"
                                style={{ backgroundColor: color.value }}
                              >
                                {currentTheme.colors.primary.toLowerCase() === color.value.toLowerCase() && (
                                  <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Theme Library</span>
                          <button 
                            onClick={() => navigate('/settings/theme-creator')}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                              <Plus size={14} /> Create New
                          </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allThemes.map(theme => (
                          <ThemePreview 
                            key={theme.id}
                            theme={theme}
                            isActive={currentTheme.id === theme.id}
                            onClick={() => applyTheme(theme)}
                            onEdit={theme.isCustom ? () => navigate('/settings/theme-creator', { state: { theme } }) : undefined}
                            onDelete={theme.isCustom ? () => handleDeleteTheme(theme.id) : undefined}
                          />
                        ))}
                      </div>
                  </div>
                )}
              </div>
            </div>

        </div>

        {/* Column 2 */}
        <div className="space-y-6 sm:space-y-8">
            
            {/* Cloud */}
            <GoogleBackupManager />

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl">
                        <Bell size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.settings.notifications}</h3>
                        <p className="text-xs text-gray-500 font-medium">Daily alerts & reminders</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => updateSettings({ notifications: { ...settings?.notifications, enabled: !settings?.notifications?.enabled } })}
                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 focus:outline-none ${settings?.notifications?.enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                      <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${settings?.notifications?.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {settings?.notifications?.enabled && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3 text-amber-500">
                              <Sun size={16} />
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Morning</span>
                            </div>
                            <input 
                              type="time" 
                              value={settings?.notifications?.morningTime || '08:00'} 
                              onChange={(e) => updateSettings({ morningTime: e.target.value })}
                              className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-3 text-indigo-500">
                              <Moon size={16} />
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Evening</span>
                            </div>
                            <input 
                              type="time" 
                              value={settings?.notifications?.eveningTime || '20:00'} 
                              onChange={(e) => updateSettings({ eveningTime: e.target.value })}
                              className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none"
                            />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Subscriptions</label>
                        <div className="flex flex-wrap gap-2">
                            {['habits', 'tasks', 'dailySummary'].map(category => {
                              const isActive = settings.notifications[category as keyof typeof settings.notifications];
                              return (
                                  <button
                                    key={category}
                                    onClick={() => updateSettings({ notifications: { ...settings.notifications, [category]: !isActive } })}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border-2 transition-all ${isActive ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                  >
                                    {category.replace(/([A-Z])/g, ' $1').trim()}
                                  </button>
                              );
                            })}
                        </div>
                      </div>
                  </div>
                )}
            </div>

            {/* Data Management */}
            <SettingSection title="Data & Privacy">
              <SettingItem label={t.settings.backup} subLabel="Export to JSON (Mobile: Share File)" icon={Download} onClick={handleBackupData} />
              <SettingItem label={t.settings.reset} subLabel="Erase local data" icon={Trash2} type="danger" onClick={handleResetApp} />
            </SettingSection>

        </div>

      </div>

      <ConfirmationModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        onConfirm={modalConfig.onConfirm} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
        confirmText={modalConfig.confirmText} 
      />
    </div>
  );
};

export default Settings;
