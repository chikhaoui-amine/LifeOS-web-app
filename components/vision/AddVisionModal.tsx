
import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Quote, Target, Upload, Link, Search, Sparkles, ArrowRight, Star, Type, PenTool, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useVisionBoard } from '../../context/VisionBoardContext';
import { useGoals } from '../../context/GoalContext';
import { VisionItemType } from '../../types';

interface AddVisionModalProps {
  onClose: () => void;
  centerPos: { x: number, y: number };
}

const COLORS = [
  '#6366f1', '#f97316', '#10b981', '#3b82f6', '#ec4899', '#eab308', '#ef4444', '#a855f7', '#ffffff', '#000000',
];

const FONTS = ['Inter', 'Serif', 'Poppins', 'Mono', 'Georgia', 'Arial Black', 'Cursive', 'Fantasy'];

// Extensive Sticker Collection
const STICKER_CATEGORIES = {
  'Favorites': ['Star', 'Heart', 'Zap', 'Flame', 'Cloud', 'Moon', 'Sun', 'Smile', 'Target', 'Trophy', 'Award', 'Crown', 'Diamond', 'Rocket'],
  'Nature': ['Flower', 'Leaf', 'Tree', 'Palmtree', 'Mountain', 'Sunset', 'Wind', 'Droplets', 'Snowflake', 'Bird', 'Cat', 'Dog', 'Fish', 'Rabbit', 'Bug', 'PawPrint'],
  'Objects': ['Key', 'Lock', 'Bell', 'Book', 'Camera', 'Coffee', 'Gift', 'Headphones', 'Map', 'Mic', 'Package', 'Phone', 'Watch', 'Glasses', 'Umbrella', 'Anchor', 'Bomb', 'Compass'],
  'Activities': ['Activity', 'Bike', 'Dumbbell', 'Gamepad', 'Music', 'Plane', 'Ship', 'Car', 'Train', 'Tent', 'Waves', 'Pizza', 'Utensils', 'Wine', 'Beer', 'Briefcase', 'Code', 'Cpu'],
  'Symbols': ['Check', 'X', 'AlertTriangle', 'Info', 'HelpCircle', 'Hash', 'Percent', 'DollarSign', 'Euro', 'Infinity', 'Lightbulb', 'Magnet', 'Flag', 'Shield', 'Ghost', 'Skull'],
  'Arrows': ['ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ChevronRight', 'ChevronsUp', 'Move', 'RefreshCw', 'Repeat', 'Shuffle', 'CornerDownRight', 'TrendingUp'],
  'Shapes': ['Circle', 'Square', 'Triangle', 'Hexagon', 'Octagon', 'Star', 'Box', 'Layout', 'Grid', 'Layers', 'Maximize']
};

export const AddVisionModal: React.FC<AddVisionModalProps> = ({ onClose, centerPos }) => {
  const { addItem } = useVisionBoard();
  const { goals } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<VisionItemType>('image');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [subContent, setSubContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'link'>('upload');
  
  // Sticker Search
  const [stickerSearch, setStickerSearch] = useState('');
  const [activeStickerCategory, setActiveStickerCategory] = useState('Favorites');

  const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');

  const handleSubmit = () => {
    // Add random scatter
    const scatterX = (Math.random() * 40) - 20;
    const scatterY = (Math.random() * 40) - 20;

    const defaultProps = {
      x: centerPos.x - 150 + scatterX, 
      y: centerPos.y - 150 + scatterY,
      zIndex: Date.now() % 100000,
      rotation: 0,
      width: '1' as '1',
      height: '1' as '1',
      opacity: 1
    };

    if (type === 'goal_ref' && selectedGoalId) {
       const goal = goals.find(g => g.id === selectedGoalId);
       if (goal) {
          const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
          addItem({
             ...defaultProps,
             type: 'goal_ref',
             content: goal.title,
             subContent: progress.toString(),
             widthPx: 350,
             heightPx: 180,
             linkedGoalId: goal.id
          });
       }
    } else if (content || type === 'image') {
       addItem({
          ...defaultProps,
          type,
          content,
          caption: type === 'image' ? caption : undefined,
          subContent: type === 'quote' ? subContent : undefined,
          widthPx: type === 'sticker' ? 120 : (type === 'affirmation' ? 450 : 320),
          heightPx: type === 'sticker' ? 120 : (type === 'affirmation' ? 180 : 380),
          color: (type === 'quote' || type === 'affirmation' || type === 'sticker') ? selectedColor : undefined,
          fontFamily: (type === 'affirmation' || type === 'quote') ? selectedFont : undefined,
          fontSize: type === 'affirmation' ? 48 : (type === 'quote' ? 20 : undefined),
          textColor: type === 'sticker' ? selectedColor : undefined
       });
    }
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setContent(base64);
        setPreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredStickers = stickerSearch 
    ? Object.values(STICKER_CATEGORIES).flat().filter(s => s.toLowerCase().includes(stickerSearch.toLowerCase()))
    : STICKER_CATEGORIES[activeStickerCategory as keyof typeof STICKER_CATEGORIES];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
           <div>
              <h3 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter">Add Vision</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pin to the universe</p>
           </div>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Tabs - Fixed */}
        <div className="flex p-2 bg-gray-100 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 overflow-x-auto custom-scrollbar shrink-0">
           <button onClick={() => setType('image')} className={`px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${type === 'image' ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>
              <ImageIcon size={14} /> Image
           </button>
           <button onClick={() => setType('quote')} className={`px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${type === 'quote' ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>
              <Quote size={14} /> Quote
           </button>
           <button onClick={() => { setType('affirmation'); setContent('I AM LIMITLESS'); }} className={`px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${type === 'affirmation' ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>
              <Type size={14} /> Affirmation
           </button>
           <button onClick={() => setType('sticker')} className={`px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${type === 'sticker' ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>
              <Star size={14} /> Sticker
           </button>
           <button onClick={() => setType('goal_ref')} className={`px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 ${type === 'goal_ref' ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}>
              <Target size={14} /> Goal
           </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 relative">
           
           {type === 'image' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-200">
                 <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                    <button onClick={() => setImageTab('upload')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${imageTab === 'upload' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>Upload</button>
                    <button onClick={() => setImageTab('link')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${imageTab === 'link' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>Link</button>
                 </div>
                 {imageTab === 'upload' ? (
                    <div 
                      className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-10 text-center hover:border-violet-500 hover:bg-violet-50/50 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                       {previewUrl ? <img src={previewUrl} className="max-h-48 mx-auto rounded-2xl shadow-2xl" alt="Preview" /> : <><Upload size={32} className="mx-auto mb-2 text-gray-300 group-hover:text-violet-500 transition-colors" /><p className="text-xs font-bold text-gray-400">Choose Image or Paste</p></>}
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                 ) : (
                    <input 
                       value={content}
                       onChange={e => { setContent(e.target.value); setPreviewUrl(e.target.value); }}
                       placeholder="https://images.unsplash.com/photo..."
                       className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-medium"
                    />
                 )}
                 <input 
                   value={caption}
                   onChange={e => setCaption(e.target.value)}
                   placeholder="Write an affirmation caption..."
                   className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20 font-bold"
                 />
              </div>
           )}

           {type === 'affirmation' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-200">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">I AM...</label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value.toUpperCase())}
                      className="w-full px-6 py-6 rounded-[2rem] bg-gray-50 dark:bg-gray-700/50 text-3xl font-black text-center uppercase tracking-tighter outline-none focus:ring-2 focus:ring-violet-500/20 resize-none h-32"
                      placeholder="UNSTOPPABLE"
                      style={{ fontFamily: selectedFont, color: selectedColor }}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Color</label>
                        <div className="flex flex-wrap gap-2">
                           {COLORS.map(c => (
                              <button key={c} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-violet-500 scale-125 shadow-lg' : 'border-transparent opacity-50'}`} style={{ background: c }} />
                           ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Font</label>
                        <div className="flex flex-wrap gap-1">
                           {FONTS.map(f => (
                              <button key={f} onClick={() => setSelectedFont(f)} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${selectedFont === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200'}`} style={{ fontFamily: f }}>Aa</button>
                           ))}
                        </div>
                    </div>
                 </div>
              </div>
           )}

           {/* STICKER SECTION - UPDATED */}
           {type === 'sticker' && (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                 {/* Sticky Header for Search & Categories */}
                 <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2 -mt-2 pt-2">
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search hundreds of icons..." 
                          value={stickerSearch}
                          onChange={(e) => setStickerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900/50 border-none text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>

                    {!stickerSearch && (
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                          {Object.keys(STICKER_CATEGORIES).map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => setActiveStickerCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0 ${activeStickerCategory === cat ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                              >
                                {cat}
                              </button>
                          ))}
                        </div>
                    )}
                 </div>

                 {/* Grid - Expanded to fill, no internal scroll */}
                 <div className="grid grid-cols-5 gap-3">
                    {filteredStickers?.map(iconName => {
                       const Icon = (LucideIcons as any)[iconName];
                       if (!Icon) return null;
                       return (
                          <button
                            key={iconName}
                            onClick={() => setContent(iconName)}
                            className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${content === iconName ? 'bg-violet-600 text-white shadow-xl scale-110' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                            title={iconName}
                          >
                             <Icon size={24} />
                          </button>
                       );
                    })}
                 </div>
                 
                 <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Icon Color</label>
                    <div className="flex flex-wrap gap-2">
                       {COLORS.map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full border-2 ${selectedColor === c ? 'border-violet-500 scale-110' : 'border-transparent'}`} style={{ background: c }} />
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {type === 'quote' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-200">
                 <textarea 
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   placeholder="Enter your power words..."
                   className="w-full px-6 py-6 rounded-[2rem] bg-gray-50 dark:bg-gray-700/50 text-xl font-serif italic font-bold leading-relaxed outline-none h-32 focus:ring-2 focus:ring-violet-500/20"
                   style={{ fontFamily: selectedFont, color: selectedColor }}
                 />
                 <input 
                   value={subContent}
                   onChange={e => setSubContent(e.target.value)}
                   placeholder="Visionary / Author"
                   className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 font-bold uppercase tracking-widest text-xs outline-none"
                 />
                 <div className="flex justify-between">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Font</label>
                        <select 
                           value={selectedFont} 
                           onChange={(e) => setSelectedFont(e.target.value)}
                           className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs p-2 focus:ring-0"
                        >
                           {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Color</label>
                        <div className="flex gap-1">
                           {COLORS.slice(0,5).map(c => (
                              <button key={c} onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full border ${selectedColor === c ? 'border-black' : 'border-transparent'}`} style={{ background: c }} />
                           ))}
                        </div>
                    </div>
                 </div>
              </div>
           )}

           {type === 'goal_ref' && (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                 <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {activeGoals.map(g => (
                       <button
                         key={g.id}
                         onClick={() => setSelectedGoalId(g.id)}
                         className={`p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between ${selectedGoalId === g.id ? 'bg-violet-600 border-violet-600 text-white shadow-xl translate-x-2' : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:border-gray-200'}`}
                       >
                          <div>
                             <p className="font-black text-sm uppercase tracking-tight">{g.title}</p>
                             <p className={`text-[10px] font-bold mt-1 ${selectedGoalId === g.id ? 'text-white/70' : 'text-gray-400'}`}>{g.currentValue} / {g.targetValue} {g.unit}</p>
                          </div>
                          <div className={`p-2 rounded-xl ${selectedGoalId === g.id ? 'bg-white/20' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                             <ArrowRight size={18} />
                          </div>
                       </button>
                    ))}
                    {activeGoals.length === 0 && (
                       <div className="text-center py-10 opacity-50">No active goals to link.</div>
                    )}
                 </div>
              </div>
           )}

           {/* Submit Button */}
           <div className="pt-4 sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm -mx-8 px-8 pb-8 -mb-8">
              <button 
               onClick={handleSubmit}
               disabled={type === 'goal_ref' ? !selectedGoalId : !content}
               className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 <Check size={20} strokeWidth={3} /> Anchor Vision
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
