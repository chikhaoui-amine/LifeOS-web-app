
import React from 'react';
import { Target, Calendar } from 'lucide-react';
import { Goal } from '../../types';
import { getRelativeTime } from '../../utils/dateUtils';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

const COLOR_MAP: Record<string, { bg: string, text: string, progress: string, from: string, to: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', progress: 'bg-indigo-500', from: 'from-indigo-400', to: 'to-indigo-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500', from: 'from-blue-400', to: 'to-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600', progress: 'bg-green-500', from: 'from-green-400', to: 'to-green-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', progress: 'bg-amber-500', from: 'from-amber-400', to: 'to-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600', progress: 'bg-red-500', from: 'from-red-400', to: 'to-red-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', progress: 'bg-purple-500', from: 'from-purple-400', to: 'to-purple-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', progress: 'bg-pink-500', from: 'from-pink-400', to: 'to-pink-600' },
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const isCompleted = goal.status === 'completed';
  const isOverdue = new Date(goal.targetDate) < new Date() && !isCompleted;
  const isMilestone = goal.type === 'milestone';
  const theme = COLOR_MAP[goal.color] || COLOR_MAP.indigo;

  const statusBadge = {
    'not-started': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'on-hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    'cancelled': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white/90 dark:bg-gray-800/90 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full relative bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] backdrop-blur-md"
    >
      {/* Visual Header */}
      <div className={`h-20 sm:h-24 w-full relative overflow-hidden ${goal.coverImage ? '' : `bg-gradient-to-br ${theme.from} ${theme.to}`}`}>
        {goal.coverImage ? (
           <img src={goal.coverImage} alt={goal.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
        ) : (
           <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity" />
        )}
        
        {/* Priority Dot */}
        {goal.priority === 'high' && (
          <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" title="High Priority" />
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
           <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${statusBadge[goal.status]} bg-opacity-90`}>
             {goal.status.replace('-', ' ')}
           </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="mb-2">
           <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 block truncate">
             {goal.category}
           </span>
           <h3 className={`text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight ${isCompleted ? 'line-through opacity-60' : ''} line-clamp-1`}>
             {goal.title}
           </h3>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 mt-auto">
           <div className="flex items-center gap-1">
              <Calendar size={12} className={isOverdue ? 'text-red-500' : ''} />
              <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                 {isCompleted ? 'Done' : getRelativeTime(goal.targetDate)}
              </span>
           </div>
           {!isCompleted && (
              <div className="flex items-center gap-1">
                 <Target size={12} />
                 <span>
                    {isMilestone 
                       ? `${goal.milestones.filter(m=>m.completed).length}/${goal.milestones.length}` 
                       : `${goal.currentValue}/${goal.targetValue} ${goal.unit || ''}`
                    }
                 </span>
              </div>
           )}
        </div>

        <div className="space-y-1.5">
           <div className="flex justify-between items-end text-[10px] font-bold">
             <span className="text-gray-400">Progress</span>
             <span className={isCompleted ? 'text-green-500' : theme.text}>{progress}%</span>
           </div>
           <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden p-0.5">
             <div 
               className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${isCompleted ? 'bg-green-500' : theme.progress}`}
               style={{ width: `${progress}%` }}
             />
           </div>
        </div>
      </div>
      
      {isCompleted && (
        <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
      )}
    </div>
  );
};
