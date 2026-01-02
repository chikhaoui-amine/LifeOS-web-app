
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeeklyReport } from '../types';
import { storage } from '../utils/storage';

interface ReportContextType {
  reports: WeeklyReport[];
  loading: boolean;
  addReport: (report: WeeklyReport) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  latestReport: WeeklyReport | null;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const REPORTS_STORAGE_KEY = 'lifeos_weekly_reports_v1';

export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Reports
  useEffect(() => {
    const loadData = async () => {
      const data = await storage.load<WeeklyReport[]>(REPORTS_STORAGE_KEY);
      if (data) {
        // Sort by date newest first
        setReports(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Sync to Storage
  useEffect(() => {
    if (!loading) {
      storage.save(REPORTS_STORAGE_KEY, reports);
    }
  }, [reports, loading]);

  const addReport = async (report: WeeklyReport) => {
    setReports(prev => [report, ...prev]);
  };

  const deleteReport = async (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <ReportContext.Provider value={{ 
      reports, 
      loading, 
      addReport, 
      deleteReport,
      latestReport
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (context === undefined) throw new Error('useReports must be used within a ReportProvider');
  return context;
};
