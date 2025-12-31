
import React from 'react';
import { Check, Calendar, Tag, Trash2, Edit2, ListChecks, Clock } from 'lucide-react';
import { Task } from '../types';
import { getRelativeTime, getTodayKey } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onEdit, onDelete, onClick }) => {
  const todayKey = getTodayKey();
  const isOverdue = !task.completed && task.dueDate && task.dueDate < todayKey;
  const isDueToday = !task.completed && task.dueDate === todayKey;
  
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const priorityColor = 
    task.priority === 'high' ? 'bg-red-500' : 
    task.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(25);
    onToggle();
  };

  return (
    <div 
      onClick={onClick}
      className={`
        group relative rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer overflow-hidden border
        ${task.completed 
          ? 'bg-gray-50/80 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800' 
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-primary-500/30 dark:hover:border-primary-500/30'
        }
      `}
    >
      {/* Priority Stripe */}
      {!task.completed && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
      )}

      <div className="flex items-start gap-3 sm:gap-4 pl-2">
        {/* Checkbox */}
        <div className="pt-0.5">
          <button 
            onClick={handleToggle}
            className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${task.completed 
                ? 'bg-emerald-500 border-emerald-500 text-white scale-100 shadow-sm' 
                : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }
            `}
          >
            <Check size={14} strokeWidth={3} className={`transform transition-transform duration-300 ${task.completed ? 'scale-100' : 'scale-0'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          
          <div className="flex justify-between items-start gap-3">
            <h3 className={`font-semibold text-sm sm:text-base leading-snug transition-all ${task.completed ? 'text-gray-400 line-through decoration-2 decoration-gray-200 dark:decoration-gray-700' : 'text-gray-900 dark:text-white'}`}>
              {task.title}
            </h3>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
               <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                 <Edit2 size={14} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                 <Trash2 size={14} />
               </button>
            </div>
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Date Badge */}
            {task.dueDate && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
                task.completed 
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                  : isOverdue 
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' 
                    : isDueToday 
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' 
                      : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <Calendar size={10} className={!task.completed && (isOverdue || isDueToday) ? 'animate-pulse' : ''} />
                <span>{getRelativeTime(task.dueDate)}</span>
                {task.dueTime && !task.completed && (
                   <span className="flex items-center gap-0.5 border-l border-current pl-1.5 ml-0.5 opacity-80">
                      <Clock size={10} /> {task.dueTime}
                   </span>
                )}
              </div>
            )}

            {/* Category Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium border ${task.completed ? 'bg-transparent border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-600' : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
               <Tag size={10} />
               <span>{task.category}</span>
            </div>

            {/* Subtasks Indicator */}
            {totalSubtasks > 0 && (
               <div className={`flex items-center gap-2 ml-auto ${task.completed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <ListChecks size={12} /> {completedSubtasks}/{totalSubtasks}
                  </div>
                  {!task.completed && (
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="h-full bg-primary-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                  )}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
