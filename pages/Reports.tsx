
import React, { useMemo, useState, useCallback } from 'react';
import { 
  FileText, TrendingUp, TrendingDown, Brain, 
  CheckCircle2, AlertCircle, ChevronRight, X, Heart, Sparkles, 
  Zap, Compass, Trash2, Loader2
} from 'lucide-react';
import { AIService } from '../services/AIService';
import { useReports } from '../context/ReportContext';
import { useSettings } from '../context/SettingsContext';
import { useTasks } from '../context/TaskContext';
import { useHabits } from '../context/HabitContext';
import { useJournal } from '../context/JournalContext';
import { useFinance } from '../context/FinanceContext';
import { useSleep } from '../context/SleepContext';
import { getTranslation } from '../utils/translations';
import { WeeklyReport, LanguageCode, WeeklyReportContent } from '../types';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDateKey } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

const getToneStyle = (tone: string) => {
  switch (tone) {
    case 'positive': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
    case 'corrective': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800';
    case 'recovery': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800';
    default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800';
  }
};

const ReportCard: React.FC<{ report: WeeklyReport; onClick: () => void }> = ({ report, onClick }) => {
  const toneStyle = getToneStyle(report.content.overallTone);
  
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500 opacity-20 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${toneStyle}`}>{report.content.overallTone}</span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{report.weekRange}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-primary-600 transition-colors">{report.content.title}</h3>
         </div>
         <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Synthesis accuracy</span>
               <span className="text-sm font-bold text-gray-900 dark:text-white">{(report.content.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all">
               <ChevronRight size={20} strokeWidth={3} />
            </div>
         </div>
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 italic">"{report.content.summary}"</p>
    </button>
  );
};

const Reports: React.FC = () => {
  const { reports, loading, addReport, deleteReport } = useReports();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { entries: journal } = useJournal();
  const { transactions } = useFinance();
  const { logs: sleepLogs } = useSleep();
  const { settings } = useSettings();
  const { showToast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  const selectedReport = useMemo(() => reports.find(r => r.id === selectedReportId) || null, [reports, selectedReportId]);

  const getContextSnapshot = useCallback((days: number = 7) => {
    const today = new Date();
    const result: any = { meta: { time: new Date().toLocaleString(), todayKey: formatDateKey(today), daysAnalyzed: days }, days: [] };
    for (let i = 0; i < days; i++) {
        const d = new Date(); d.setDate(today.getDate() - i); const key = formatDateKey(d);
        result.days.push({
            date: key,
            tasks: tasks.filter(t => t.dueDate === key).map(t => ({ title: t.title, priority: t.priority, done: t.completed })),
            habits: habits.filter(h => h.frequency.days.includes(d.getDay()) || h.completedDates.includes(key)).map(h => ({ name: h.name, done: h.completedDates.includes(key) })),
            sleep: sleepLogs.find(l => l.date === key),
            journal: journal.find(j => j.date.startsWith(key))?.mood || 'none',
            spending: transactions.filter(t => t.date === key && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
        });
    }
    return JSON.stringify(result);
  }, [tasks, habits, sleepLogs, journal, transactions]);

  const handleGenerateAISynthesis = async () => {
    setIsGenerating(true);
    try {
      const contextData = getContextSnapshot(7);
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
      const range = `${formatDateKey(weekStart)} → ${formatDateKey(new Date())}`;

      const response = await AIService.generateResponse({
        model: 'gemini-3-flash-preview',
        prompt: "Analyze my last week and generate a synthesis report in JSON format.",
        config: {
          responseMimeType: "application/json",
          systemInstruction: `IDENTITY: LifeOS Strategist. DATA: ${contextData}`
        }
      });

      let cleanJson = response.text || '';
      if (cleanJson.includes('```')) {
         cleanJson = cleanJson.replace(/```json|```/g, '').trim();
      }
      
      const content = JSON.parse(cleanJson) as WeeklyReportContent;
      const newReport: WeeklyReport = { id: Date.now().toString(), weekRange: range, createdAt: new Date().toISOString(), content };

      await addReport(newReport);
      showToast("Synthesis complete!", "success");
      setSelectedReportId(newReport.id);

    } catch (e: any) {
      console.error("AI Error:", e);
      showToast("Proxy Service Error: " + e.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <LoadingSkeleton count={3} type="card" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
         <div className="text-left">
            <div className="flex items-center gap-2 text-primary-600 mb-1">
               <FileText size={18} strokeWidth={3} />
               <span className="text-xs font-black uppercase tracking-widest">Life Intelligence</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Weekly Synthesis</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Server-verified pattern detection.</p>
         </div>
         <button onClick={handleGenerateAISynthesis} disabled={isGenerating} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'Analyzing...' : 'Generate New Synthesis'}
         </button>
      </header>

      {reports.length === 0 ? (
        <EmptyState icon={Brain} title="Observing Patterns..." description="I'm currently studying your habits. Click above to generate your report." />
      ) : (
        <div className="space-y-4">
           {reports.map(report => <ReportCard key={report.id} report={report} onClick={() => setSelectedReportId(report.id)} />)}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReportId(null)}>
           <div className="bg-white dark:bg-[#09090b] w-[94%] sm:w-full max-w-3xl h-[80vh] sm:h-auto sm:max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                 <div className="text-left">
                    <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1 block">Synthesis Report</span>
                    <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{selectedReport.content.title}</h2>
                 </div>
                 <button onClick={() => setSelectedReportId(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar">
                 <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
                       <Zap size={20} fill="currentColor" className="opacity-20" />
                       <h3 className="font-black uppercase tracking-widest text-[10px]">Executive Summary</h3>
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-200 font-medium leading-relaxed italic">"{selectedReport.content.summary}"</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-emerald-600"><TrendingUp size={18} strokeWidth={3} /><h3 className="font-black uppercase tracking-widest text-[10px]">Momentum Wins</h3></div>
                       <div className="space-y-2">{selectedReport.content.wins.map((win, i) => <div key={i} className="flex gap-3 items-start bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" /><span className="text-xs font-bold">{win}</span></div>)}</div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-orange-600"><TrendingDown size={18} strokeWidth={3} /><h3 className="font-black uppercase tracking-widest text-[10px]">Friction Points</h3></div>
                       <div className="space-y-2">{selectedReport.content.challenges.map((challenge, i) => <div key={i} className="flex gap-3 items-start bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800/50"><AlertCircle size={14} className="text-orange-500 mt-0.5 shrink-0" /><span className="text-xs font-bold">{challenge}</span></div>)}</div>
                    </div>
                 </div>
                 <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] p-6 border border-indigo-100 dark:border-indigo-800/50 text-left">
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4"><Compass size={20} strokeWidth={3} /><h3 className="font-black uppercase tracking-widest text-[10px]">Behavioral Patterns</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {selectedReport.content.patterns.map((pattern, i) => <div key={i} className="flex gap-3 items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" /><span className="text-xs font-medium">{pattern}</span></div>)}
                    </div>
                 </div>
              </div>
              <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 px-6 shrink-0">
                 <button onClick={() => { if(confirm('Permanently delete?')) { deleteReport(selectedReport.id); setSelectedReportId(null); } }} className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                 <button onClick={() => setSelectedReportId(null)} className="w-full sm:w-auto px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">Close Report</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
