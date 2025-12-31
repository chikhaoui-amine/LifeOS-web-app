
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, Clock, Trash2 } from 'lucide-react';
import { useTimeBlocks } from '../../context/TimeBlockContext';
import { TimeBlockModal } from './TimeBlockModal';
import { TimeBlock } from '../../types';
import { getTodayKey } from '../../utils/dateUtils';

interface TimeBlockingViewProps {
  date: string;
}

// Layout Algorithm for Side-by-Side Events
const calculateEventLayout = (events: TimeBlock[]) => {
  if (events.length === 0) return [];

  // 1. Sort by start time, then duration
  const sorted = [...events].sort((a, b) => {
    if (a.startTime === b.startTime) {
       const durA = parseInt(a.endTime.replace(':','')) - parseInt(a.startTime.replace(':',''));
       const durB = parseInt(b.endTime.replace(':','')) - parseInt(b.startTime.replace(':',''));
       return durB - durA;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // 2. Group overlapping events
  const groups: TimeBlock[][] = [];
  let currentGroup: TimeBlock[] = [];
  let groupEndTime = -1;

  sorted.forEach(event => {
    const start = parseInt(event.startTime.replace(':', ''));
    const end = parseInt(event.endTime.replace(':', ''));
    
    if (currentGroup.length === 0) {
      currentGroup.push(event);
      groupEndTime = end;
    } else {
      if (start < groupEndTime) {
        currentGroup.push(event);
        groupEndTime = Math.max(groupEndTime, end);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
        groupEndTime = end;
      }
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  // 3. Assign columns within groups
  const result: any[] = [];
  
  groups.forEach(group => {
    const columns: TimeBlock[][] = [];
    group.forEach(event => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        // Simple string comparison works for HH:MM format
        if (lastInCol.endTime <= event.startTime) {
          columns[i].push(event);
          result.push({ ...event, col: i, totalCols: 0 }); 
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
        result.push({ ...event, col: columns.length - 1, totalCols: 0 });
      }
    });

    const groupSize = columns.length;
    result.forEach(item => {
      if (group.find(g => g.id === item.id)) {
        item.totalCols = groupSize;
      }
    });
  });

  return result;
};

export const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({ date }) => {
  const { getBlocksForDate, addBlock, updateBlock, deleteBlock, toggleBlock } = useTimeBlocks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const blocks = getBlocksForDate(date);
  const isToday = date === getTodayKey();
  
  const layoutBlocks = useMemo(() => calculateEventLayout(blocks), [blocks]);

  const PIXELS_PER_MINUTE = 2; // Taller for better readability
  const START_HOUR = 0; 
  const END_HOUR = 24;

  const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return hex || '#6366f1';
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeMinutes(mins);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); 

    // Initial scroll to now or 8am
    if (scrollRef.current) {
        let scrollMins = 8 * 60; // Default 8am
        if (isToday) {
            const now = new Date();
            scrollMins = Math.max(0, (now.getHours() * 60) - 60); // 1 hour before now
        }
        
        // Wait for layout
        setTimeout(() => {
            if(scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollMins * PIXELS_PER_MINUTE, behavior: 'smooth' });
            }
        }, 100);
    }

    return () => clearInterval(interval);
  }, [isToday]);

  const handleSave = async (data: any) => {
    if (selectedBlock) {
      await updateBlock(selectedBlock.id, data);
    } else {
      await addBlock(data);
    }
    setIsModalOpen(false);
    setSelectedBlock(null);
  };

  const getMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      const rect = scrollRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top + scrollRef.current.scrollTop;
      const clickedMinutes = Math.floor(clickY / PIXELS_PER_MINUTE);
      
      // Round to nearest 15
      const roundedMinutes = Math.floor(clickedMinutes / 15) * 15;
      const h = Math.floor(roundedMinutes / 60);
      const m = roundedMinutes % 60;
      
      const timeString = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      
      setSelectedBlock({ startTime: timeString } as any); // Pre-fill
      setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Floating Add Button */}
      <button 
        onClick={() => { setSelectedBlock(null); setIsModalOpen(true); }}
        className="absolute bottom-6 right-6 z-30 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <Plus size={28} />
      </button>

      {/* Timeline Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative custom-scrollbar scroll-smooth bg-white dark:bg-gray-900">
         
         <div 
            className="relative min-h-full" 
            style={{ height: (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
            onClick={handleTimelineClick}
         >
            
            {/* Hour Markers & Grid */}
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
               const hour = START_HOUR + i;
               return (
                  <div 
                    key={hour} 
                    className="absolute left-0 right-0 flex items-start pointer-events-none"
                    style={{ top: i * 60 * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE }}
                  >
                     <div className="w-16 shrink-0 text-right pr-3 -mt-2.5">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-600">
                           {String(hour).padStart(2, '0')}:00
                        </span>
                     </div>
                     <div className="flex-1 border-t border-gray-100 dark:border-gray-800 w-full" />
                  </div>
               );
            })}

            {/* Current Time Indicator */}
            {isToday && (
               <div 
                 className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                 style={{ top: currentTimeMinutes * PIXELS_PER_MINUTE }}
               >
                  <div className="w-16 text-right pr-3">
                     <span className="text-xs font-bold text-red-500">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                     </span>
                  </div>
                  <div className="flex-1 relative h-px bg-red-500">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                  </div>
               </div>
            )}

            {/* Event Blocks */}
            <div className="absolute top-0 bottom-0 left-16 right-4">
               {layoutBlocks.map(block => {
                  const startMins = getMinutes(block.startTime);
                  const top = (startMins - (START_HOUR * 60)) * PIXELS_PER_MINUTE;
                  const height = Math.max(block.duration * PIXELS_PER_MINUTE, 30); 
                  
                  const baseColor = block.color || '#6366f1';
                  const isCompleted = block.completed;
                  
                  const widthPercent = 100 / block.totalCols;
                  const leftPercent = block.col * widthPercent;

                  return (
                     <div
                       key={block.id}
                       onClick={(e) => { e.stopPropagation(); setSelectedBlock(block); setIsModalOpen(true); }}
                       className={`
                         absolute rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group border
                         ${isCompleted 
                            ? 'opacity-60 grayscale bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                            : 'hover:z-30 hover:shadow-xl shadow-sm border-transparent'
                         }
                       `}
                       style={{ 
                          top: top + 2,
                          height: height - 4, 
                          left: `${leftPercent}%`,
                          width: `calc(${widthPercent}% - 4px)`,
                          backgroundColor: isCompleted ? undefined : hexToRgba(baseColor, 0.15),
                          borderLeftWidth: '4px',
                          borderLeftColor: isCompleted ? '#9ca3af' : baseColor,
                          zIndex: 10 + block.col
                       }}
                     >
                        <div className="h-full w-full px-3 py-1.5 flex flex-col relative">
                           {/* Content */}
                           <div className="min-w-0 flex-1">
                                 <h4 
                                    className={`text-xs font-bold truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
                                 >
                                    {block.title}
                                 </h4>
                                 <div className="flex items-center gap-1 text-[10px] opacity-80" style={{ color: isCompleted ? undefined : baseColor }}>
                                    <Clock size={10} />
                                    <span className="truncate">
                                       {block.startTime} - {block.endTime}
                                    </span>
                                 </div>
                           </div>
                           
                           {/* Action Buttons (Visible on Hover) */}
                           <div className="absolute top-1 right-1 hidden group-hover:flex gap-1 bg-white/80 dark:bg-black/50 backdrop-blur rounded-lg p-1 shadow-sm">
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleBlock(block.id); }}
                                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isCompleted ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                                title={isCompleted ? "Mark Incomplete" : "Complete"}
                              >
                                 <Check size={14} strokeWidth={3} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(confirm('Delete this block?')) deleteBlock(block.id); 
                                }}
                                className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>

      {isModalOpen && (
         <TimeBlockModal 
            date={date}
            initialData={selectedBlock || undefined}
            onSave={handleSave}
            onClose={() => setIsModalOpen(false)}
            onDelete={selectedBlock ? deleteBlock : undefined}
         />
      )}
    </div>
  );
};
