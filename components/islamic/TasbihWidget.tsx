
import React, { useState, useMemo } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { LanguageCode } from '../../types';

export const TasbihWidget: React.FC = () => {
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [label, setLabel] = useState('SubhanAllah');

  const handleIncrement = () => {
    if (navigator.vibrate) navigator.vibrate(10); 
    setCount(c => c + 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  const presets = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah'];

  return (
    <div className="bg-primary-600 rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden flex flex-col items-center justify-between min-h-[260px] sm:min-h-[300px] transition-colors duration-500">
       
       <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}>
       </div>

       <div className="w-full flex justify-between items-start z-10">
          <div className="flex flex-col">
             <span className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t.deen.tasbih}</span>
             <select 
               value={label} 
               onChange={(e) => { setLabel(e.target.value); setCount(0); }}
               className="bg-transparent text-lg sm:text-xl font-serif font-bold focus:outline-none cursor-pointer appearance-none text-white"
             >
                {presets.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
             </select>
          </div>
          <button 
            onClick={handleReset} 
            className="p-1.5 sm:p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-20"
            title="Reset"
          >
             <RotateCcw size={14} sm-size={16} />
          </button>
       </div>

       <div className="flex flex-col items-center justify-center z-10 my-2 sm:my-4">
          <div className="text-5xl sm:text-7xl font-bold font-mono tracking-tighter tabular-nums drop-shadow-md">
             {count}
          </div>
          <p className="text-white/70 text-xs sm:text-sm">{t.deen.target}: {target}</p>
       </div>

       <button 
         onClick={handleIncrement}
         className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center shadow-2xl active:scale-95 transition-all z-10 group"
       >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
             <Plus size={28} sm-size={32} strokeWidth={3} />
          </div>
       </button>

       <div className="w-full flex justify-center gap-2 mt-3 sm:mt-4 z-10">
          {[33, 100, 1000].map(val => (
             <button 
               key={val}
               onClick={() => setTarget(val)}
               className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all ${target === val ? 'bg-white text-primary-700' : 'bg-black/20 text-white/90 hover:bg-black/30'}`}
             >
                {val}
             </button>
          ))}
       </div>
    </div>
  );
};
