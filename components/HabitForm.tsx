import React, { useState } from 'react';
import { X, Calendar, Tag, Sun, Moon, Sunrise, Clock, ChevronDown, ChevronUp, Plus, ArrowLeft, Check } from 'lucide-react';
import { Habit, FrequencyType } from '../types';
import { useHabits } from '../context/HabitContext';

interface HabitFormProps {
  initialData?: Partial<Habit>;
  onSave: (habit: any) => void;
  onClose: () => void;
}

const ICON_GROUPS = {
  'Popular': ['🧘', '💧', '🏃', '📚', '💤', '💊', '🥗', '💻', '🗓️', '🧹', '🚶', '💰'],
  'Fitness': ['🏋️', '🏃', '🚴', '🏊', '🧘', '🤸', '🥊', '⚽', '🏀', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '⛳', '🧗', '🏄', '🛹'],
  'Nutrition': ['🍎', '🥦', '🥗', '🍗', '🍳', '🥛', '☕', '🥤', '🍵', '🍺', '🍷', '🥡', '🍇', '🍉', '🍊', '🍌', '🍍', '🥕', '🌽', '🍫'],
  'Productivity': ['💻', '📝', '📅', '📊', '📞', '📧', '⏰', '⏱️', '🎯', '⚡', '🔋', '🚀', '💡', '🔍', '📌', '📎', '📁', '🖨️', '📱', '📡'],
  'Mindfulness': ['🧘', '🌬️', '📿', '🕯️', '📓', '🛀', '🧠', '🔇', '🌿', '🌅', '🌙', '⭐', '🔥', '🌊', '☁️', '🙏', '🤲', '🛐', '🕊️', '😌'],
  'Finance': ['💰', '💳', '💵', '💸', '🏦', '📉', '📈', '🧾', '🛍️', '💎', '🐷', '🪙', '💴', '💶', '💷', '🏧', '💲', '🏷️', '💼', '📊'],
  'Home & Chores': ['🏠', '🧹', '🧺', '🛏️', '🛋️', '🪴', '🔨', '🔧', '🚿', '🧼', '🧽', '🚽', '🚪', '🔑', '📦', '🛒', '🍴', '🔪', '🗑️', '🌡️'],
  'Learning': ['📚', '🎓', '📖', '🔬', '🔭', '💡', '🧠', '🌎', '🗣️', '✍️', '🧩', '🎨', '🎼', '🎻', '🎹', '🎺', '🖍️', '🎒', '🏫', '📝'],
  'Social': ['👨‍👩‍👧‍👦', '👯', '🤝', '🗣️', '💌', '📱', '🥂', '🎁', '🎈', '🫂', '💞', '💍', '👶', '👴', '👵', '🐶', '🐱', '🐾', '🎮', '🎲'],
  'Travel & Outdoors': ['✈️', '🚗', '🚂', '🚲', '🛴', '🗺️', '🏝️', '⛺', '🎣', '🌲', '🍂', '⛰️', '🌋', '🏖️', '🏜️', '🚜', '⚓', '🚦', '⛽', '🏰'],
  'Medical': ['💊', '💉', '🩹', '🩺', '🦷', '🦴', '🩸', '🦠', '🧼', '🏥', '🚑', '🧴', '🧻', '🌡️', '🧬', '🚭', '🚰', '🥗', '🍎', '😴']
};

const COLORS = [
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Sky', value: 'sky', class: 'bg-sky-500' },
  { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Lime', value: 'lime', class: 'bg-lime-500' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Amber', value: 'amber', class: 'bg-amber-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Fuchsia', value: 'fuchsia', class: 'bg-fuchsia-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
];

export const HabitForm: React.FC<HabitFormProps> = ({ initialData, onSave, onClose }) => {
  const { categories, addCategory } = useHabits();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || ICON_GROUPS['Popular'][0]);
  const [color, setColor] = useState(initialData?.color || 'indigo');
  
  // Category State
  const [category, setCategory] = useState(initialData?.category || categories[0] || 'Health');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(initialData?.frequency?.type || 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.frequency?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [timeOfDay, setTimeOfDay] = useState<'morning'|'afternoon'|'evening'|'anytime'>(initialData?.timeOfDay || 'anytime');
  const [goal, setGoal] = useState(initialData?.goal || 1);
  const [unit, setUnit] = useState(initialData?.unit || 'times');
  
  const [showAllIcons, setShowAllIcons] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    let finalCategory = category.trim();
    if (!finalCategory) finalCategory = 'General';

    // Persist new category if it was typed in and not yet saved
    if (isCustomCategory && finalCategory) {
        addCategory(finalCategory);
    }

    onSave({
      ...initialData,
      name,
      description,
      icon,
      color,
      category: finalCategory,
      goal,
      unit,
      timeOfDay,
      type: 'boolean',
      frequency: {
        type: frequencyType,
        days: selectedDays
      },
      reminders: [],
    });
  };

  const handleCustomCategoryConfirm = () => {
    const trimmed = category.trim();
    if (trimmed) {
      addCategory(trimmed);
      setCategory(trimmed); // Ensure the state matches the added category
      setIsCustomCategory(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(prev => prev.filter(d => d !== dayIndex));
      }
    } else {
      setSelectedDays(prev => [...prev, dayIndex].sort());
    }
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Categories to display: Always show first 10, collapse rest
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Name & Desc */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Read 10 pages" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Motivation or details..." 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Time of Day Selection */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time of Day</label>
             <div className="grid grid-cols-4 gap-2">
                <button type="button" onClick={() => setTimeOfDay('morning')} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${timeOfDay === 'morning' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                   <Sunrise size={20} />
                   <span className="text-xs font-medium">Morning</span>
                </button>
                <button type="button" onClick={() => setTimeOfDay('afternoon')} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${timeOfDay === 'afternoon' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                   <Sun size={20} />
                   <span className="text-xs font-medium">Afternoon</span>
                </button>
                <button type="button" onClick={() => setTimeOfDay('evening')} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${timeOfDay === 'evening' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                   <Moon size={20} />
                   <span className="text-xs font-medium">Evening</span>
                </button>
                <button type="button" onClick={() => setTimeOfDay('anytime')} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${timeOfDay === 'anytime' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                   <Clock size={20} />
                   <span className="text-xs font-medium">Anytime</span>
                </button>
             </div>
          </div>

          {/* Icon & Color */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
                 <button 
                   onClick={() => setShowAllIcons(!showAllIcons)}
                   className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                 >
                   {showAllIcons ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show Library</>}
                 </button>
              </div>
              
              {!showAllIcons ? (
                <div className="grid grid-cols-6 gap-2">
                  {ICON_GROUPS['Popular'].map(e => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`h-10 rounded-lg flex items-center justify-center text-xl transition-all ${icon === e ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto p-1 border border-gray-100 dark:border-gray-700 rounded-xl">
                   {Object.entries(ICON_GROUPS).map(([groupName, icons]) => (
                     <div key={groupName}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2 px-1 sticky top-0 bg-white dark:bg-gray-800 z-10 py-1">{groupName}</h4>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                           {icons.map(e => (
                              <button
                                key={e}
                                onClick={() => setIcon(e)}
                                className={`h-10 rounded-lg flex items-center justify-center text-xl transition-all ${icon === e ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100'}`}
                              >
                                {e}
                              </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full transition-all ${c.class} ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar size={18} />
              <span>Frequency</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                 {weekDays.map((d, i) => (
                   <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`
                      w-10 h-10 rounded-lg text-sm font-bold transition-all
                      ${selectedDays.includes(i) 
                        ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
                    `}
                   >
                     {d}
                   </button>
                 ))}
              </div>
              <p className="text-xs text-center text-gray-500">
                {selectedDays.length === 7 ? 'Every day' : selectedDays.length === 0 ? 'Select days' : `${selectedDays.length} days per week`}
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag size={18} />
                <span>Category</span>
              </div>
              {categories.length > 10 && (
                 <button 
                   type="button" 
                   onClick={() => setShowAllCategories(!showAllCategories)}
                   className="text-xs text-primary-600 dark:text-primary-400 font-medium"
                 >
                   {showAllCategories ? 'Show Less' : `Show All (${categories.length})`}
                 </button>
              )}
            </div>
            
            {!isCustomCategory ? (
              <div className="flex flex-wrap gap-2">
                {visibleCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${category === cat 
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
                
                <button
                  onClick={() => { setCategory(''); setIsCustomCategory(true); }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-dashed border-gray-300 text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> Custom
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center animate-in fade-in slide-in-from-right-2 duration-200">
                 <button 
                   type="button"
                   onClick={() => setIsCustomCategory(false)}
                   className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                   <ArrowLeft size={18} />
                 </button>
                 <input 
                   type="text" 
                   value={category}
                   onChange={(e) => setCategory(e.target.value)}
                   placeholder="Name your category..."
                   className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                   autoFocus
                   onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            e.preventDefault();
                            handleCustomCategoryConfirm();
                        }
                   }}
                 />
                 <button 
                    type="button"
                    onClick={handleCustomCategoryConfirm}
                    disabled={!category.trim()}
                    className="p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
                 >
                    <Check size={18} />
                 </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-4 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            Save Habit
          </button>
        </div>
      </div>
    </div>
  );
};