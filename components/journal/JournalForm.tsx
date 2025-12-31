
import React, { useState } from 'react';
import { X, Calendar, Lock, Unlock, Save, Tag, Trash2, ArrowLeft, Settings2, Edit3, MoreHorizontal, ChevronRight } from 'lucide-react';
import { JournalEntry, MoodType, JournalTemplate } from '../../types';
import { RichEditor } from './RichEditor';
import { PinModal } from './PinModal';
import { ConfirmationModal } from '../ConfirmationModal';

interface JournalFormProps {
  initialData?: Partial<JournalEntry>;
  onSave: (entry: any) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const MOODS: { id: MoodType; label: string; emoji: string, color: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😄', color: 'bg-amber-400' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: 'bg-pink-400' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-emerald-400' },
  { id: 'calm', label: 'Calm', emoji: '😊', color: 'bg-sky-400' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-slate-400' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: 'bg-indigo-400' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: 'bg-indigo-600' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-orange-400' },
  { id: 'angry', label: 'Angry', emoji: '😡', color: 'bg-rose-500' },
];

const TEMPLATES: JournalTemplate[] = [
  { id: 'daily', name: 'Daily Reflection', icon: '📝', prompts: [], content: '<h2>What happened today?</h2><p></p><h2>What was my biggest win?</h2><p></p><h2>One thing to improve tomorrow?</h2><p></p>' },
  { id: 'gratitude', name: 'Gratitude', icon: '🙏', prompts: [], content: '<h2>Three things I am grateful for:</h2><ul><li></li><li></li><li></li></ul>' },
  { id: 'morning', name: 'Morning Pages', icon: '☀️', prompts: [], content: '<h2>Morning Intentions</h2><p>Today, I want to feel...</p><h2>My Affirmation</h2><p></p>' },
  { id: 'brain-dump', name: 'Brain Dump', icon: '🧠', prompts: [], content: '<h2>Current Thoughts</h2><p>Just let it all out here...</p>' },
];

export const JournalForm: React.FC<JournalFormProps> = ({ initialData, onSave, onClose, onDelete }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState<MoodType>(initialData?.mood || 'neutral');
  const [energyLevel, setEnergyLevel] = useState(initialData?.energyLevel || 5);
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [securityPin, setSecurityPin] = useState(initialData?.securityPin || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!initialData?.id && !content);
  
  // View State
  const [mobileTab, setMobileTab] = useState<'editor' | 'details'>('editor');

  const confirmDelete = () => {
    if (initialData?.id && onDelete) {
      onDelete(initialData.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData,
      title: title || new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
      content,
      mood,
      energyLevel,
      date: new Date(date).toISOString(),
      tags,
      isLocked: !!securityPin,
      securityPin,
      isFavorite: initialData?.isFavorite || false,
    });
    onClose();
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const applyTemplate = (tpl: JournalTemplate) => {
    setContent(tpl.content);
    if (!title) setTitle(tpl.name);
    setShowTemplates(false);
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-black z-[100] flex flex-col animate-in fade-in duration-300 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-4">
             <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-800" />
             <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                   {initialData?.id ? 'Editing' : 'New Entry'}
                </span>
                <span className="text-sm font-bold text-black dark:text-white">
                   {formattedDate}
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2">
             {/* Mobile Tabs */}
             <div className="flex md:hidden bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                <button 
                  onClick={() => setMobileTab('editor')}
                  className={`p-2 rounded-md transition-all ${mobileTab === 'editor' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-400'}`}
                >
                   <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => setMobileTab('details')}
                  className={`p-2 rounded-md transition-all ${mobileTab === 'details' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-400'}`}
                >
                   <Settings2 size={18} />
                </button>
             </div>

             <button 
               onClick={() => securityPin ? setSecurityPin('') : setIsPinModalOpen(true)}
               className={`p-2.5 rounded-xl transition-all ${securityPin ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'}`}
               title={securityPin ? "Locked" : "Add Lock"}
             >
                {securityPin ? <Lock size={18} /> : <Unlock size={18} />}
             </button>
             
             <button 
               onClick={handleSubmit}
               className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-transform active:scale-95"
             >
                <Save size={18} /> <span className="hidden sm:inline">Save</span>
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
             
             {/* Main Editor Area */}
             <div className={`flex-1 flex flex-col h-full relative overflow-y-auto custom-scrollbar bg-white dark:bg-black ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
                <div className="max-w-3xl mx-auto w-full px-6 py-8 md:py-12 pb-32">
                   
                   {/* Title Input */}
                   <input 
                     type="text" 
                     value={title} 
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Entry Title..."
                     className="w-full text-4xl md:text-5xl font-serif font-bold text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700 bg-transparent border-none outline-none leading-tight mb-8"
                   />

                   {/* Template Selector */}
                   {showTemplates && (
                       <div className="mb-10 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Start with a template</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {TEMPLATES.map(t => (
                                <button 
                                  key={t.id}
                                  onClick={() => applyTemplate(t)}
                                  className="flex items-center gap-4 p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl hover:border-black dark:hover:border-white transition-all text-left group"
                                >
                                   <div className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</div>
                                   <div>
                                      <span className="font-bold text-black dark:text-white block">{t.name}</span>
                                      <span className="text-xs text-gray-500">Click to load</span>
                                   </div>
                                </button>
                             ))}
                             <button 
                               onClick={() => setShowTemplates(false)}
                               className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600 text-gray-500 hover:text-black dark:hover:text-white transition-all"
                             >
                                <div className="text-xl opacity-50"><Edit3 size={24} /></div>
                                <span className="font-bold">Blank Page</span>
                             </button>
                          </div>
                       </div>
                   )}

                   {/* Rich Text Editor */}
                   <RichEditor 
                     initialContent={content} 
                     onChange={setContent} 
                     placeholder="Start writing your thoughts..." 
                     className="min-h-[60vh]"
                   />
                </div>
             </div>

             {/* Sidebar: Metadata (Clean White) */}
             <div className={`w-full md:w-[320px] lg:w-[360px] bg-white dark:bg-black border-l border-gray-100 dark:border-gray-800 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 ${mobileTab === 'details' ? 'flex flex-col' : 'hidden md:flex flex-col'}`}>
                
                <div className="space-y-8">
                    {/* Date */}
                    <div>
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 block">Date</label>
                       <div className="relative">
                          <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white font-medium focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 outline-none transition-all cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"
                          />
                          <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                       </div>
                    </div>

                    {/* Mood */}
                    <div>
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Mood</label>
                       <div className="grid grid-cols-3 gap-2">
                          {MOODS.map(m => (
                             <button
                               key={m.id}
                               onClick={() => setMood(m.id)}
                               className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${mood === m.id ? 'bg-gray-50 dark:bg-gray-900 border-black dark:border-white shadow-sm' : 'bg-white dark:bg-black border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                             >
                                <span className="text-2xl mb-1.5">{m.emoji}</span>
                                <span className={`text-[10px] font-bold uppercase ${mood === m.id ? 'text-black dark:text-white' : 'text-gray-400'}`}>{m.label}</span>
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Energy */}
                    <div>
                       <div className="flex justify-between items-center mb-2.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Energy</label>
                          <span className="text-xs font-bold text-black dark:text-white">{energyLevel}/10</span>
                       </div>
                       <input 
                         type="range" 
                         min="1" 
                         max="10" 
                         value={energyLevel} 
                         onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                         className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-black dark:accent-white"
                       />
                       <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                          <span>Low</span>
                          <span>High</span>
                       </div>
                    </div>

                    {/* Tags */}
                    <div>
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 block">Tags</label>
                       <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map(tag => (
                             <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-black dark:text-white">
                                #{tag}
                                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-500 ml-1"><X size={12} /></button>
                             </span>
                          ))}
                       </div>
                       <div className="relative">
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                            placeholder="Add tags..."
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm font-medium text-black dark:text-white focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 outline-none hover:border-gray-300 dark:hover:border-gray-600"
                          />
                       </div>
                    </div>

                    {initialData?.id && (
                      <div className="pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
                         <button 
                           type="button"
                           onClick={() => setShowDeleteConfirm(true)}
                           className="w-full py-3.5 bg-white dark:bg-black border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
                         >
                            <Trash2 size={16} /> Delete Entry
                         </button>
                      </div>
                    )}
                </div>
             </div>
        </div>
      </div>

      <PinModal 
         isOpen={isPinModalOpen} 
         onClose={() => setIsPinModalOpen(false)}
         isSettingMode={true}
         onVerify={(pin) => {
            setSecurityPin(pin);
            setIsPinModalOpen(false);
         }}
      />

      <ConfirmationModal 
         isOpen={showDeleteConfirm}
         onClose={() => setShowDeleteConfirm(false)}
         onConfirm={confirmDelete}
         title="Delete Entry"
         message="Are you sure you want to delete this journal entry? This action cannot be undone."
         type="danger"
         confirmText="Delete"
      />
    </>
  );
};
