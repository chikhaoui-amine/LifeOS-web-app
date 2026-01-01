
import React, { useState, useMemo } from 'react';
import { Sparkles, Plus, Maximize2, Trash2, Quote, Target, Shuffle, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { useVisionBoard } from '../context/VisionBoardContext';
import { AddVisionModal } from '../components/vision/AddVisionModal';
import { FocusSession } from '../components/vision/FocusSession';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { VisionItem } from '../types';

const VisionBoard: React.FC = () => {
  const { items, loading, deleteItem } = useVisionBoard();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Shuffle items based on seed for a fresh look without changing database order
  const displayItems = useMemo(() => {
    const shuffled = [...items];
    if (shuffleSeed > 0) {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
    }
    return shuffled;
  }, [items, shuffleSeed]);

  if (loading) return <LoadingSkeleton count={3} />;

  // Helper to determine grid classes
  const getItemClasses = (item: VisionItem) => {
    // Mobile: Always span 1 or full width (2). Desktop: Allow complex spans.
    const colSpan = item.width === '2' ? 'col-span-2' : 'col-span-1';
    const rowSpan = item.height === '3' ? 'row-span-3' : item.height === '2' ? 'row-span-2' : 'row-span-1';
    return `${colSpan} ${rowSpan}`;
  };

  const renderItem = (item: VisionItem) => {
    return (
      <div 
        key={item.id} 
        className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:z-10 hover:shadow-2xl hover:scale-[1.02] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 ${getItemClasses(item)}`}
      >
        {item.type === 'image' && (
          <div className="w-full h-full relative flex flex-col bg-white dark:bg-gray-900">
             <div className="flex-1 relative overflow-hidden">
                <img 
                  src={item.content} 
                  alt={item.caption || "Vision"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.parentElement!.innerHTML = `<div class="flex flex-col items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span class="text-xs mt-2 font-medium">Image unavailable</span></div>`;
                  }}
                />
                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
             </div>
             
             {/* Caption Overlay */}
             {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                   <p className="text-white font-bold text-sm sm:text-base drop-shadow-md line-clamp-2">{item.caption}</p>
                </div>
             )}
          </div>
        )}

        {item.type === 'quote' && (
          <div className={`w-full h-full p-6 md:p-8 flex flex-col justify-center items-center text-center ${item.color || 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
             <Quote size={24} className="mb-4 opacity-30 text-current" />
             <p className={`font-serif font-bold italic leading-relaxed text-gray-800 dark:text-white ${item.width === '2' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                "{item.content}"
             </p>
             {item.subContent && (
               <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                  <div className="w-6 h-px bg-current" /> {item.subContent}
               </div>
             )}
          </div>
        )}

        {item.type === 'goal_ref' && (
          <div className="w-full h-full p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col justify-between relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-70 text-xs font-bold uppercase tracking-widest">
                   <Target size={14} /> Goal Tracking
                </div>
                <h3 className="text-xl md:text-2xl font-bold leading-snug line-clamp-3">{item.content}</h3>
             </div>
             
             {item.subContent && (
               <div className="mt-4 relative z-10">
                  <div className="flex justify-between text-xs mb-1.5 opacity-90 font-mono">
                     <span>Progress</span>
                     <span>{item.subContent}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${item.subContent}%` }} />
                  </div>
               </div>
             )}
          </div>
        )}

        {/* Hover Delete Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
          className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md z-20 scale-90 hover:scale-100"
          title="Delete Item"
        >
           <Trash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {isFocusMode && <FocusSession items={items} onClose={() => setIsFocusMode(false)} />}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
              <Sparkles size={20} className="fill-current animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Manifestation Engine</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white font-serif tracking-tight">Vision Board</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg text-lg">Visualize your future. Internalize your dreams.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {items.length > 0 && (
             <button 
               onClick={() => setShuffleSeed(prev => prev + 1)}
               className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl transition-colors shadow-sm active:scale-95"
               title="Shuffle Layout"
             >
                <Shuffle size={20} />
             </button>
           )}
           <button 
             onClick={() => setIsFocusMode(true)}
             disabled={items.length === 0}
             className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-500 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
           >
              <Maximize2 size={20} /> Visualize
           </button>
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all active:scale-95 whitespace-nowrap"
           >
              <Plus size={20} strokeWidth={3} /> Add Item
           </button>
        </div>
      </header>

      {/* Main Grid Content */}
      {items.length === 0 ? (
        <EmptyState 
          icon={LayoutGrid} 
          title="Your canvas is empty" 
          description="Start adding images, quotes, or goals that represent your dream life." 
          actionLabel="Create First Item"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[220px]"
          style={{ gridAutoFlow: 'dense' }} // This packs items tightly
        >
           {displayItems.map(renderItem)}
        </div>
      )}

      {isAddModalOpen && <AddVisionModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
};

export default VisionBoard;
