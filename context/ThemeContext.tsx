
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeContextType } from '../types';
import { PREBUILT_THEMES, DEFAULT_DARK_THEME } from '../utils/themeLibrary';
import { storage } from '../utils/storage';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const SAVED_THEMES_KEY = 'lifeos_custom_themes';
const CURRENT_THEME_OBJECT_KEY = 'lifeos_active_theme_object'; 

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_DARK_THEME);

  useEffect(() => {
    const load = async () => {
      const custom = await storage.load<Theme[]>(SAVED_THEMES_KEY) || [];
      setSavedThemes(custom);
      const cachedTheme = await storage.load<Theme>(CURRENT_THEME_OBJECT_KEY);
      if (cachedTheme) {
        applyTheme(cachedTheme, false);
      } else {
        applyTheme(DEFAULT_DARK_THEME);
      }
    };
    load();
  }, []);

  const injectThemeVariables = (theme: Theme) => {
    const root = document.documentElement;
    const { colors } = theme;
    
    // Calculate RGB values for transparency support
    const primaryRgb = hexToRgb(colors.primary);
    const bgRgb = hexToRgb(colors.background);
    const surfaceRgb = hexToRgb(colors.surface);
    const textRgb = hexToRgb(colors.text);
    const textMutedRgb = hexToRgb(colors.textSecondary);
    const borderRgb = hexToRgb(colors.border);

    if (theme.type === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    // Base Variables
    root.style.setProperty('--color-primary-500', colors.primary);
    root.style.setProperty('--color-primary-600', colors.primary);
    root.style.setProperty('--color-bg', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-text-main', colors.text);
    root.style.setProperty('--color-text-muted', colors.textSecondary);
    
    // RGB Variables for opacity
    root.style.setProperty('--color-primary-rgb', primaryRgb);
    root.style.setProperty('--color-bg-rgb', bgRgb);
    root.style.setProperty('--color-surface-rgb', surfaceRgb);
    root.style.setProperty('--color-text-rgb', textRgb);
    root.style.setProperty('--color-text-muted-rgb', textMutedRgb);
    root.style.setProperty('--color-border-rgb', borderRgb);

    const radiusMap = { none: '0px', sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' };
    root.style.setProperty('--radius-base', radiusMap[theme.radius]);

    const fontMap = {
      'Inter': "'Inter', sans-serif",
      'Roboto': "'Roboto', sans-serif",
      'Poppins': "'Poppins', sans-serif",
      'Serif': "'Merriweather', serif",
      'Mono': "'JetBrains Mono', monospace"
    };
    root.style.setProperty('--font-main', fontMap[theme.font]);

    let styleTag = document.getElementById('theme-overrides');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-overrides';
      document.head.appendChild(styleTag);
    }
    
    // Comprehensive CSS overrides for hardcoded Tailwind classes
    // This is necessary because we can't configure tailwind.config.js with the CDN build.
    styleTag.innerHTML = `
      :root { --color-primary-rgb: ${primaryRgb}; }
      body {
        background-color: var(--color-bg) !important;
        color: var(--color-text-main) !important;
        font-family: var(--font-main) !important;
      }
      
      /* --- BACKGROUNDS --- */
      .bg-white, .dark .dark\\:bg-gray-800, .dark .dark\\:bg-slate-800, .dark .dark\\:bg-gray-900, .dark .dark\\:bg-slate-900 {
        background-color: rgb(var(--color-surface-rgb) / var(--tw-bg-opacity, 1)) !important;
      }
      .bg-gray-50, .dark .dark\\:bg-gray-950, .dark .dark\\:bg-slate-950 {
        background-color: rgb(var(--color-bg-rgb) / var(--tw-bg-opacity, 1)) !important;
      }
      .bg-gray-100, .bg-gray-200, .dark .dark\\:bg-gray-700, .dark .dark\\:bg-slate-700, .dark .dark\\:bg-gray-600 {
        background-color: rgba(var(--color-text-rgb), 0.05) !important;
      }

      /* Specific Opacity Overrides */
      .dark .dark\\:bg-gray-900\\/80, .dark .dark\\:bg-gray-800\\/80 { background-color: rgba(var(--color-surface-rgb), 0.8) !important; }
      .dark .dark\\:bg-gray-900\\/50, .dark .dark\\:bg-gray-800\\/50 { background-color: rgba(var(--color-surface-rgb), 0.5) !important; }
      .dark .dark\\:bg-gray-700\\/50, .dark .dark\\:bg-gray-700\\/30 { background-color: rgba(var(--color-text-rgb), 0.04) !important; }
      .bg-gray-50\\/50, .bg-gray-50\\/80 { background-color: rgba(var(--color-bg-rgb), 0.5) !important; }

      /* --- TEXT --- */
      .text-gray-900, .dark .dark\\:text-white, .dark .dark\\:text-gray-50, .dark .dark\\:text-gray-100, .dark .dark\\:text-gray-200, .dark .dark\\:text-slate-100 {
        color: rgb(var(--color-text-rgb) / var(--tw-text-opacity, 1)) !important;
      }
      .text-gray-500, .text-gray-600, .text-gray-700, .dark .dark\\:text-gray-300, .dark .dark\\:text-gray-400, .dark .dark\\:text-gray-500, .dark .dark\\:text-slate-400 {
        color: rgb(var(--color-text-muted-rgb) / var(--tw-text-opacity, 1)) !important;
      }

      /* --- BORDERS --- */
      .border-gray-100, .border-gray-200, .border-gray-300, .dark .dark\\:border-gray-600, .dark .dark\\:border-gray-700, .dark .dark\\:border-gray-800, .dark .dark\\:border-slate-800 {
        border-color: rgb(var(--color-border-rgb) / var(--tw-border-opacity, 1)) !important;
      }
      
      /* --- PRIMARY --- */
      .bg-primary-600, .bg-indigo-600, .bg-primary-500 { background-color: rgb(var(--color-primary-rgb) / var(--tw-bg-opacity, 1)) !important; }
      .text-primary-600, .text-indigo-600, .text-primary-500 { color: rgb(var(--color-primary-rgb) / var(--tw-text-opacity, 1)) !important; }
      .border-primary-600, .border-primary-500 { border-color: rgb(var(--color-primary-rgb) / var(--tw-border-opacity, 1)) !important; }
      .bg-primary-50, .dark .dark\\:bg-primary-900\\/20, .dark .dark\\:bg-primary-900\\/30 { background-color: rgba(var(--color-primary-rgb), 0.1) !important; }
      
      /* --- RADIUS --- */
      .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\] {
        border-radius: var(--radius-base) !important;
      }
    `;
  };

  const applyTheme = (theme: Theme, persist = true) => {
    setCurrentTheme(theme);
    injectThemeVariables(theme);
    if (persist) storage.save(CURRENT_THEME_OBJECT_KEY, theme);
  };

  const updateThemePrimaryColor = (color: string) => {
    const updatedTheme = { ...currentTheme, colors: { ...currentTheme.colors, primary: color } };
    applyTheme(updatedTheme);
  };

  const saveCustomTheme = async (theme: Theme) => {
    const newSaved = [...savedThemes.filter(t => t.id !== theme.id), theme];
    setSavedThemes(newSaved);
    await storage.save(SAVED_THEMES_KEY, newSaved);
    applyTheme(theme);
  };

  const deleteCustomTheme = async (id: string) => {
    const newSaved = savedThemes.filter(t => t.id !== id);
    setSavedThemes(newSaved);
    await storage.save(SAVED_THEMES_KEY, newSaved);
    if (currentTheme.id === id) applyTheme(DEFAULT_DARK_THEME);
  };

  const exportTheme = (theme: Theme): string => JSON.stringify(theme);

  const importTheme = (json: string): boolean => {
    try {
      const theme = JSON.parse(json) as Theme;
      if (!theme.colors || !theme.name) return false;
      theme.id = `imported-${Date.now()}`;
      theme.isCustom = true;
      saveCustomTheme(theme);
      return true;
    } catch (e) { return false; }
  };

  const resetToDefault = () => applyTheme(DEFAULT_DARK_THEME);

  return (
    <ThemeContext.Provider value={{
      currentTheme, savedThemes, applyTheme, updateThemePrimaryColor,
      saveCustomTheme, deleteCustomTheme, exportTheme, importTheme, resetToDefault
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
