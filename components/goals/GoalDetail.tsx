
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, CheckCircle2, Circle, Edit2, Trash2, Plus, Target, Quote, Book, Layout, StickyNote, Send } from 'lucide-react';
import { Goal } from '../../types';
import { useGoals } from '../../context/GoalContext';
import { ConfirmationModal } from '../ConfirmationModal';

interface GoalDetailProps {
  goal: Goal;
  onClose: () => void;
  onEdit: () => void;
}

const COLOR_MAP: Record<string, { text: string, border: string, progress: string, bg: string, ring: string }> = {
  indigo: { text: 'text-indigo-600', border: 'border-indigo-500', progress: 'bg-indigo-500', bg: 'bg-indigo-600', ring: 'focus:ring-indigo-500/20' },
  blue: { text: 'text-blue-600', border: 'border-blue-500', progress: 'bg-blue-500', bg: 'bg-blue-600', ring: 'focus:ring-blue-500/20' },
  green: { text: 'text-green-600', border: 'border-green-500', progress: 'bg-green-500', bg: 'bg-green-600', ring: 'focus:ring-green-500/20' },
  amber: { text: 'text-amber-600', border: 'border-amber-500', progress: 'bg-amber-500', bg: 'bg-amber-600', ring: 'focus:ring-amber-500/20' },
  red: { text: 'text-red-600', border: 'border-red-500', progress: 'bg-red-500', bg: 'bg-red-600', ring: 'focus:ring-red-500/20' },
  purple: { text: 'text-purple-600', border: 'border-purple-500', progress: 'bg-purple-500', bg: 'bg-purple-600', ring: 'focus:ring-purple-500/20' },
  pink: { text: 'text-pink-600', border: 'border-pink-500', progress: 'bg-pink-500', bg: 'bg-pink-600', ring: 'focus:ring-pink-500/20' },
};

export const GoalDetail: React.FC<GoalDetailProps> = ({ goal, onClose, onEdit }) => {
  const { deleteGoal, updateProgress, toggleMilestone, updateGoal, addNote, deleteNote } = useGoals();
  const [activeTab, setActiveTab] = useState<'overview' | 'journal'>('overview');
  
  const [newMilestone, setNewMilestone] = useState('');
  const [updateValue, setUpdateValue] = useState(goal.currentValue.toString());
  const [noteContent, setNoteContent] = useState('');

  // Modals for confirmation
  const [showGoalDeleteConfirm, setShowGoalDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const isCompleted = goal.status === 'completed';
  const theme = COLOR_MAP[goal.color] || COLOR_MAP.indigo;

  // Keep updateValue in sync when context updates
  useEffect(() => {
    setUpdateValue(goal.currentValue.toString());
  }, [goal.currentValue]);

  const handleGoalDelete = () => {
    deleteGoal(goal.id);
    onClose();
  };

  const handleNoteDelete = () => {
    if (noteToDelete) {
      deleteNote(goal.id, noteToDelete);
      setNoteToDelete(null);
    }
  };

  const handleUpdateProgress = () => {
    const val = parseFloat(updateValue);
    if (!isNaN(val)) {
        updateProgress(goal.id, val);
    }
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
        const milestones = [...goal.milestones, { id: Date.now().toString(), title: newMilestone, completed: false }];
        updateGoal(goal.id, { milestones });
        setNewMilestone('');
    }
  };

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (noteContent.trim()) {
      addNote(goal.id, noteContent.trim());
      setNoteContent('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-end animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Header */}
        <div className={`h-40 shrink-0 relative ${goal.coverImage ? '' : theme.progress}`}>
           {goal.coverImage ? (
             <img src={goal.coverImage} className="w-full h-full object-cover opacity-90" alt={goal.title} />
           ) : (
             <div className={`w-full h-full ${theme.bg} opacity-90`} />
           )}
           <div className="absolute inset-0 bg-black/20" />
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-colors z-10">
             <X size={20} />
           </button>
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md`}>
                   {goal.category}
                 </span>
                 {isCompleted && (
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500 text-white flex items-center gap-1">
                     <CheckCircle2 size={10} /> Completed
                   </span>
                 )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight shadow-sm">{goal.title}</h2>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'overview' ? `${theme.border} ${theme.text} dark:text-white` : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
           >
             <Layout size={16} /> Overview
           </button>
           <button 
             onClick={() => setActiveTab('journal')}
             className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'journal' ? `${theme.border} ${theme.text} dark:text-white` : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
           >
             <Book size={16} /> Journal <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 rounded-full ml-1 font-bold">{goal.notes?.length || 0}</span>
           </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
            {activeTab === 'overview' && (
              <>
                {goal.motivation && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex gap-2 text-gray-400 mb-2">
                            <Quote size={14} className="transform rotate-180" />
                            <span className="text-xs font-bold uppercase tracking-wider">Why this matters</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 italic font-serif leading-relaxed">"{goal.motivation}"</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                   <div className="flex justify-between items-end mb-3">
                     <div>
                       <h3 className="font-bold text-gray-900 dark:text-white">Current Progress</h3>
                       <p className="text-xs text-gray-500">Target: {goal.targetValue} {goal.unit}</p>
                     </div>
                     <span className={`text-2xl font-bold ${theme.text}`}>{progress}%</span>
                   </div>
                   
                   <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ${theme.progress}`}
                       style={{ width: `${progress}%` }}
                     />
                   </div>
                   
                   {goal.type === 'numeric' && (
                     <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl">
                        <Target size={18} className="text-gray-400 ml-2" />
                        <input 
                          type="number" 
                          value={updateValue}
                          onChange={(e) => setUpdateValue(e.target.value)}
                          className="flex-1 bg-transparent border-none text-gray-900 dark:text-white font-medium focus:ring-0"
                        />
                        <button onClick={handleUpdateProgress} className={`px-4 py-2 ${theme.bg} text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-sm transition-all active:scale-95`}>
                           Update
                        </button>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                       <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target Date</p>
                       <div className="flex items-center gap-2">
                          <Calendar size={18} className={theme.text} />
                          <span className="font-medium text-gray-900 dark:text-white">{new Date(goal.targetDate).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                       <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Priority</p>
                       <div className="flex items-center gap-2">
                          <Flag size={18} className={goal.priority === 'high' ? 'text-red-500' : goal.priority === 'medium' ? 'text-orange-500' : 'text-blue-500'} />
                          <span className="font-medium text-gray-900 dark:text-white capitalize">{goal.priority}</span>
                       </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                      Action Plan
                      <span className="text-xs font-normal text-gray-500">{goal.milestones.filter(m=>m.completed).length}/{goal.milestones.length} steps</span>
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                       <div className="divide-y divide-gray-100 dark:divide-gray-700">
                         {goal.milestones.map(m => (
                           <div key={m.id} onClick={() => toggleMilestone(goal.id, m.id)} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                              <div className={`shrink-0 transition-colors ${m.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                {m.completed ? <CheckCircle2 size={22} className="fill-green-100 dark:fill-green-900/30" /> : <Circle size={22} />}
                              </div>
                              <span className={`text-sm font-medium ${m.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{m.title}</span>
                           </div>
                         ))}
                         {goal.milestones.length === 0 && <div className="p-8 text-center text-gray-400 text-sm italic">No milestones yet. Break it down!</div>}
                       </div>
                       
                       <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                           <input 
                              type="text" 
                              value={newMilestone}
                              onChange={e => setNewMilestone(e.target.value)}
                              placeholder="Add a new milestone..."
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border-none bg-white dark:bg-gray-800 focus:ring-2 ${theme.ring} text-gray-900 dark:text-white`}
                              onKeyDown={e => e.key === 'Enter' && handleAddMilestone()}
                           />
                           <button onClick={handleAddMilestone} className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all active:scale-95">
                             <Plus size={18} />
                           </button>
                        </div>
                    </div>
                </div>

                {goal.description && (
                    <div>
                       <h3 className="font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                       <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{goal.description}</p>
                    </div>
                )}
              </>
            )}

            {activeTab === 'journal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <form onSubmit={handleAddNote} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Log Progress</h3>
                    <textarea 
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Record a breakthrough, a hurdle, or just your thoughts..."
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border-none outline-none focus:ring-2 focus:ring-primary-500/20 text-sm mb-3 h-24 resize-none text-gray-900 dark:text-white"
                    />
                    <div className="flex justify-end">
                       <button 
                         type="submit"
                         disabled={!noteContent.trim()}
                         className={`px-4 py-2 ${theme.bg} text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95`}
                       >
                         <Send size={14} /> Post Note
                       </button>
                    </div>
                 </form>

                 <div className="space-y-4">
                    {goal.notes && goal.notes.length > 0 ? [...goal.notes].map(note => (
                       <div key={note.id} className="group flex gap-4">
                          <div className="flex flex-col items-center">
                             <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                             <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1 group-last:hidden"></div>
                          </div>
                          <div className="flex-1 pb-4">
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative group/card">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                                   <p className="text-[10px] text-gray-400">{new Date(note.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                   <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNoteToDelete(note.id);
                                      }}
                                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                      title="Delete note"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                             </div>
                          </div>
                       </div>
                    )) : (
                       <div className="text-center py-12 bg-white/30 dark:bg-black/10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <StickyNote size={40} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 text-sm font-medium">No progress logs yet.</p>
                          <p className="text-gray-400 text-xs mt-1">Start tracking your journey!</p>
                       </div>
                    )}
                 </div>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
           <button onClick={onEdit} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors">
             <Edit2 size={18} /> Edit Goal
           </button>
           <button 
             onClick={(e) => {
               e.stopPropagation();
               setShowGoalDeleteConfirm(true);
             }} 
             className="px-4 py-3 border border-red-500 dark:border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center transition-colors shadow-sm"
           >
             <Trash2 size={20} />
           </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={showGoalDeleteConfirm}
        onClose={() => setShowGoalDeleteConfirm(false)}
        onConfirm={handleGoalDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? All milestones and logs will be permanently removed."
        type="danger"
        confirmText="Delete Goal"
      />

      <ConfirmationModal 
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleNoteDelete}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this entry?"
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};
