
import React, { useMemo, useState } from 'react';
import { 
  FileText, TrendingUp, TrendingDown, Target, Brain, 
  CheckCircle2, AlertCircle, ChevronRight, X, Heart, Sparkles, 
  Clock, Calendar, Activity, Zap, Compass, Trash2
} from 'lucide-react';
import { useReports } from '../context/ReportContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { WeeklyReport, LanguageCode } from '../types';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

// Moved helper outside of component to avoid recreation and improve typing
const getToneStyle = (tone: string) => {
  switch (tone) {
    case 'positive': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
    case 'corrective': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800';
    case 'recovery': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800';
    default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800';
  }
};

// Fix: Moved ReportCard outside of Reports component and used React.FC to handle special 'key' prop correctly in TS
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
               <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${toneStyle}`}>
                  {report.content.overallTone}
               </span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{report.weekRange}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-primary-600 transition-colors">
               {report.content.title}
            </h3>
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

      <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 italic">
         "{report.content.summary}"
      </p>
    </button>
  );
};

const Reports: React.FC = () => {
  const { reports, loading, addReport, deleteReport } = useReports();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const selectedReport = useMemo(() => reports.find(r => r.id === selectedReportId) || null, [reports, selectedReportId]);

  const generateSampleReport = async () => {
    const sample: WeeklyReport = {
      id: 'sample-1',
      weekRange: '2025-05-18 → 2025-05-24',
      createdAt: new Date().toISOString(),
      content: {
        type: "WEEKLY_REPORT",
        weekRange: "2025-05-18 → 2025-05-24",
        title: "The Rhythm of Recovery",
        overallTone: "positive",
        summary: "This week showed a significant stabilization in your morning routines despite high external stress. You maintained a 100% completion rate for physical habits.",
        wins: ["Morning meditation 7/7 days", "Core workout intensity increased by 15%", "Screen time reduced by 45 mins/day"],
        challenges: ["Evening focus drop after 8 PM", "Financial spending on takeout rose by 22%"],
        patterns: ["Late night screen time correlates with 20% lower mood next morning", "High task completion on days with 7h+ sleep"],
        fixes: ["Set strict mode at 9 PM starting tonight", "Prep two evening meals in advance", "Move deep work tasks to 10 AM window"],
        nextWeekFocus: ["Sleep Hygiene", "Financial discipline", "Consistent deep work"],
        coachNote: "You didn't just survive this week; you learned from it. Those morning wins are building a foundation that can handle anything.",
        confidence: 0.98
      }
    };
    await addReport(sample);
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
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Automatic pattern detection and course correction.</p>
         </div>
         <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <Clock size={16} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Updated every Sunday</span>
         </div>
      </header>

      {reports.length === 0 ? (
        <div className="space-y-6">
          <EmptyState 
             icon={Brain} 
             title="Observing Patterns..." 
             description="Your first report will be generated automatically this Sunday. I'm currently studying your habits, tasks, and energy flow to give you the best advice." 
          />
          <div className="flex justify-center">
            <button 
              onClick={generateSampleReport}
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-primary-600 hover:border-primary-500 transition-all flex items-center gap-2"
            >
              <Sparkles size={14} /> See Example Synthesis
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {reports.map(report => (
              <ReportCard key={report.id} report={report} onClick={() => setSelectedReportId(report.id)} />
           ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReportId(null)}>
           <div 
             className="bg-white dark:bg-[#09090b] w-[94%] sm:w-full max-w-3xl h-[80vh] sm:h-auto sm:max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
             onClick={e => e.stopPropagation()}
           >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/30 shrink-0">
                 <div className="text-left">
                    <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1 block">Weekly Synthesis Report</span>
                    <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{selectedReport.content.title}</h2>
                    <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 sm:mt-2">{selectedReport.weekRange}</p>
                 </div>
                 <button onClick={() => setSelectedReportId(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-all">
                    <X size={20} sm-size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-10 sm:space-y-12">
                 
                 {/* Summary Section */}
                 <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
                       <Zap size={20} sm-size={24} fill="currentColor" className="opacity-20" />
                       <h3 className="font-black uppercase tracking-widest text-[10px] sm:text-sm">Executive Summary</h3>
                    </div>
                    <p className="text-lg sm:text-2xl text-gray-700 dark:text-gray-200 font-medium leading-relaxed font-serif italic">
                       "{selectedReport.content.summary}"
                    </p>
                 </div>

                 {/* Wins & Challenges */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-emerald-600">
                          <TrendingUp size={18} sm-size={20} strokeWidth={3} />
                          <h3 className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Momentum Wins</h3>
                       </div>
                       <div className="space-y-2">
                          {selectedReport.content.wins.map((win, i) => (
                             <div key={i} className="flex gap-3 items-start bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                <CheckCircle2 size={14} sm-size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100">{win}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-orange-600">
                          <TrendingDown size={18} sm-size={20} strokeWidth={3} />
                          <h3 className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Friction Points</h3>
                       </div>
                       <div className="space-y-2">
                          {selectedReport.content.challenges.map((challenge, i) => (
                             <div key={i} className="flex gap-3 items-start bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800/50">
                                <AlertCircle size={14} sm-size={16} className="text-orange-500 mt-0.5 shrink-0" />
                                <span className="text-xs sm:text-sm font-bold text-orange-900 dark:text-orange-100">{challenge}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Patterns Detected */}
                 <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] p-6 sm:p-8 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6">
                       <Compass size={20} sm-size={24} strokeWidth={3} />
                       <h3 className="font-black uppercase tracking-widest text-[10px] sm:text-sm">Behavioral Patterns</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                       {selectedReport.content.patterns.map((pattern, i) => (
                          <div key={i} className="flex gap-3 items-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                             <span className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-200">{pattern}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Fixes & Next Week */}
                 <div className="space-y-8 sm:space-y-10 text-left">
                    <div>
                       <h3 className="font-black uppercase tracking-widest text-[10px] sm:text-xs text-gray-400 mb-4 flex items-center gap-2">
                          <Activity size={14} sm-size={16} /> Actionable Fixes
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {selectedReport.content.fixes.map((fix, i) => (
                             <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm text-center">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white leading-tight block">{fix}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="bg-primary-600 rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                       <Sparkles className="absolute -top-4 -right-4 opacity-10" size={100} sm-size={120} />
                       <h3 className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-4">Strategic Focus for Next Week</h3>
                       <div className="flex flex-wrap gap-2">
                          {selectedReport.content.nextWeekFocus.map((focus, i) => (
                             <span key={i} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white/20 backdrop-blur-md rounded-xl font-black text-xs sm:text-sm uppercase tracking-tighter shadow-lg">
                                {focus}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Coach Note */}
                 <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-center text-left">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 shrink-0 shadow-inner">
                       <Heart size={24} sm-size={28} fill="currentColor" className="opacity-80" />
                    </div>
                    <div>
                       <h4 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">A note from your Coach</h4>
                       <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                          "{selectedReport.content.coachNote}"
                       </p>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 px-6 sm:px-8 shrink-0">
                 <button 
                   onClick={() => { if(confirm('Permanently delete this report?')) { deleteReport(selectedReport.id); setSelectedReportId(null); } }}
                   className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all w-full sm:w-auto justify-center"
                 >
                    <Trash2 size={14} />
                    Delete Synthesis
                 </button>
                 <button 
                   onClick={() => setSelectedReportId(null)}
                   className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                    Close Report
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
