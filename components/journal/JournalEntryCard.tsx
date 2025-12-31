
import React from 'react';
import { Heart, Lock, Clock, Bookmark, ChevronRight } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
  onFavorite: () => void;
}

const MOOD_MAP: Record<string, { icon: string, color: string, bg: string }> = {
  happy: { icon: '😄', color: 'text-amber-600', bg: 'bg-amber-50' },
  calm: { icon: '😊', color: 'text-sky-600', bg: 'bg-sky-50' },
  neutral: { icon: '😐', color: 'text-slate-500', bg: 'bg-slate-50' },
  sad: { icon: '😢', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  angry: { icon: '😡', color: 'text-rose-600', bg: 'bg-rose-50' },
  anxious: { icon: '😰', color: 'text-orange-600', bg: 'bg-orange-50' },
  excited: { icon: '🤩', color: 'text-pink-600', bg: 'bg-pink-50' },
  grateful: { icon: '🙏', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  tired: { icon: '😴', color: 'text-indigo-900', bg: 'bg-indigo-50' }
};

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onClick, onFavorite }) => {
  const date = new Date(entry.date);
  const isLocked = !!entry.securityPin;
  const mood = MOOD_MAP[entry.mood] || MOOD_MAP.neutral;
  
  const readTime = Math.max(1, Math.ceil(entry.plainText.split(' ').length / 200));

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"
    >
      {/* Mood Accent Stripe */}
      <div className={`h-1.5 w-full ${mood.bg.replace('bg-', 'bg-')} opacity-60`} />

      <div className={`p-7 flex flex-col flex-1 ${isLocked ? 'blur-[4px] opacity-70 select-none' : ''}`}>
        
        {/* Date and Reading Time */}
        <div className="flex justify-between items-center mb-6">
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">
                 {date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                 {date.getDate()} {date.toLocaleDateString(undefined, { weekday: 'long' })}
              </span>
           </div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
              <Clock size={12} /> {readTime} min read
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-4">
           <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${mood.bg} dark:bg-gray-700/50 flex items-center justify-center text-3xl shadow-inner`}>
                 {mood.icon}
              </div>
              <h3 className="font-serif font-black text-gray-900 dark:text-white text-xl line-clamp-1 leading-tight flex-1">
                 {isLocked ? "Private Reflection" : (entry.title || "Untethered Thoughts")}
              </h3>
           </div>

           <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed line-clamp-3 font-serif italic opacity-90">
              {isLocked ? "This memory is protected by your private security PIN." : (entry.plainText || "A blank space waiting for your voice...")}
           </p>
        </div>

        {/* Metadata Footer */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50/50 dark:border-gray-700/50">
           <div className="flex gap-2 overflow-hidden">
              {entry.tags.length > 0 ? entry.tags.slice(0, 2).map(tag => (
                 <span key={tag} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    #{tag}
                 </span>
              )) : (
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Bookmark size={10} /> No Tags
                 </span>
              )}
           </div>

           <div className="flex items-center gap-2">
              {entry.isFavorite && (
                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-full text-rose-500">
                   <Heart size={14} fill="currentColor" />
                </div>
              )}
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                 <ChevronRight size={16} />
              </div>
           </div>
        </div>
      </div>

      {/* Security Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-[2px] transition-all">
           <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
              <Lock size={24} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-4">Protected Memory</span>
        </div>
      )}

      {/* Energy Indicator Line */}
      {!isLocked && (
        <div className="h-1.5 w-full bg-gray-50 dark:bg-gray-900 overflow-hidden shrink-0">
           <div 
             className="h-full bg-primary-500 opacity-40 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.3)] transition-all duration-1000 ease-out" 
             style={{ width: `${entry.energyLevel * 10}%` }}
           />
        </div>
      )}
    </div>
  );
};
