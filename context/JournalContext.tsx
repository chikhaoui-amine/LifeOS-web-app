
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { JournalEntry, MoodType } from '../types';
import { storage } from '../utils/storage';

interface JournalContextType {
  entries: JournalEntry[];
  loading: boolean;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'plainText'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getStats: () => { totalEntries: number; streak: number; moodDistribution: Record<string, number> };
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);
const JOURNAL_STORAGE_KEY = 'lifeos_journal_v1';

export const JournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const data = await storage.load<JournalEntry[]>(JOURNAL_STORAGE_KEY);
    if (data) setEntries(data);
    setLoading(false);
  };

  // Load Data & Listen for Sync
  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('lifeos-sync-complete', handleSync);
    return () => window.removeEventListener('lifeos-sync-complete', handleSync);
  }, []);

  // Sync to Storage
  useEffect(() => {
    if (!loading) {
      storage.save(JOURNAL_STORAGE_KEY, entries);
    }
  }, [entries, loading]);

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const addEntry = async (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'plainText'>) => {
    const newEntry: JournalEntry = {
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      plainText: stripHtml(data.content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (updates.content) {
      updates.plainText = stripHtml(updates.content);
    }
    updates.updatedAt = new Date().toISOString();
    
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
  };

  const getStats = () => {
    const totalEntries = entries.length;
    
    // Simple Mood Dist
    const moodDistribution: Record<string, number> = {};
    entries.forEach(e => {
      moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
    });

    // Calculate Streak (Consecutive days)
    const dates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    if (dates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let currentDate = new Date();
      if (dates.includes(today)) {
         streak = 1;
      } else if (dates.includes(yesterday)) {
         streak = 0; 
         currentDate.setDate(currentDate.getDate() - 1);
      }
      
      streak = dates.length > 0 ? 1 : 0; 
    }

    return { totalEntries, streak, moodDistribution };
  };

  return (
    <JournalContext.Provider value={{ entries, loading, addEntry, updateEntry, deleteEntry, toggleFavorite, getStats }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (context === undefined) throw new Error('useJournal must be used within a JournalProvider');
  return context;
};
