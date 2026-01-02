
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCw, Scaling, Quote, Target, ArrowUp, ArrowDown, Layers, Type, Palette, AlignLeft, AlignCenter, AlignRight, Sliders, BringToFront, SendToBack, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { VisionItem } from '../../types';

interface FreeFormItemProps {
  item: VisionItem;
  items?: VisionItem[]; // Pass all items to calculate relative Z-index
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<VisionItem>) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
  isSelected: boolean;
  zoom: number;
}

const COLORS = ['#ffffff', '#000000', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#e5e7eb', 'transparent'];
const FONTS = ['Inter', 'Serif', 'Poppins', 'Mono', 'Georgia', 'Arial Black', 'Cursive', 'Fantasy'];

export const FreeFormItem: React.FC<FreeFormItemProps> = ({ 
  item, 
  items = [],
  isEditing, 
  onUpdate, 
  onDelete, 
  onSelect, 
  isSelected,
  zoom
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Use 1500 as default center fallback if coordinate missing
  const posRef = useRef({ x: item.x ?? 1500, y: item.y ?? 1500 });
  const sizeRef = useRef({ width: item.widthPx ?? 300, height: item.heightPx ?? 350 });
  const rotRef = useRef(item.rotation ?? 0);

  // Local state for visual updates during interaction
  const [localPos, setLocalPos] = useState({ x: item.x ?? 1500, y: item.y ?? 1500 });
  const [localSize, setLocalSize] = useState({ width: item.widthPx ?? 300, height: item.heightPx ?? 350 });
  const [localRot, setLocalRot] = useState(item.rotation ?? 0);
  const [isInteracting, setIsInteracting] = useState(false);
  
  const [activeTool, setActiveTool] = useState<'none' | 'color' | 'text' | 'layers' | 'style'>('none');

  // Sync with props when not interacting
  useEffect(() => {
    if (!isInteracting) {
      const newPos = { x: item.x ?? 1500, y: item.y ?? 1500 };
      const newSize = { width: item.widthPx ?? 300, height: item.heightPx ?? 350 };
      const newRot = item.rotation ?? 0;

      setLocalPos(newPos);
      setLocalSize(newSize);
      setLocalRot(newRot);
      
      posRef.current = newPos;
      sizeRef.current = newSize;
      rotRef.current = newRot;
    }
  }, [item, isInteracting]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isEditing) return;
    // Prevent drag if interacting with controls
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) return;
    
    e.preventDefault(); 
    e.stopPropagation();
    
    onSelect();
    setIsInteracting(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...posRef.current };

    const onMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      const newPos = { x: initialPos.x + dx, y: initialPos.y + dy };
      posRef.current = newPos;
      setLocalPos(newPos);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      onUpdate(item.id, { x: posRef.current.x, y: posRef.current.y });
      setIsInteracting(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInteracting(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialSize = { ...sizeRef.current };

    const onMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      const newSize = {
        width: Math.max(50, initialSize.width + dx),
        height: Math.max(50, initialSize.height + dy)
      };

      sizeRef.current = newSize;
      setLocalSize(newSize);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      onUpdate(item.id, { widthPx: sizeRef.current.width, heightPx: sizeRef.current.height });
      setIsInteracting(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInteracting(true);
    if (!nodeRef.current) return;

    const rect = nodeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const startMouseAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const initialItemRotation = rotRef.current;

    const onMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const currentMouseAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
      const deltaAngle = currentMouseAngle - startMouseAngle;
      const newRot = initialItemRotation + deltaAngle;
      
      rotRef.current = newRot;
      setLocalRot(newRot);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      onUpdate(item.id, { rotation: rotRef.current });
      setIsInteracting(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const changeLayer = (action: 'up' | 'down' | 'front' | 'back') => {
    // Get all Z indices
    const allIndices = items.map(i => i.zIndex || 1).sort((a, b) => a - b);
    const uniqueIndices = [...new Set(allIndices)];
    const currentZ = item.zIndex || 1;
    const maxZ = uniqueIndices[uniqueIndices.length - 1];
    const minZ = uniqueIndices[0];

    let newZ = currentZ;
    
    if (action === 'front') {
        newZ = maxZ + 1;
    } else if (action === 'back') {
        newZ = minZ - 1;
    } else if (action === 'up') {
        // Find next highest Z index
        const nextZ = uniqueIndices.find(z => z > currentZ);
        newZ = nextZ ? nextZ + 1 : currentZ + 1;
    } else if (action === 'down') {
        // Find prev highest Z index
        const prevZIndices = uniqueIndices.filter(z => z < currentZ);
        const prevZ = prevZIndices.length > 0 ? prevZIndices[prevZIndices.length - 1] : null;
        newZ = prevZ !== null ? prevZ - 1 : currentZ - 1;
    }
    
    onUpdate(item.id, { zIndex: newZ });
  };

  const updateStyle = (key: keyof VisionItem, value: any) => {
    onUpdate(item.id, { [key]: value });
  };

  // --- STYLE ---
  const bgColor = item.backgroundColor ?? (item.type === 'sticker' ? 'transparent' : '#ffffff');
  const txtColor = item.textColor ?? '#000000';
  const radius = item.borderRadius ?? 24;
  const shadow = item.shadow ?? 'lg';
  const opacity = item.opacity ?? 1;
  const fontSize = item.fontSize ?? 16;
  const fontFamily = item.fontFamily || 'Inter';
  const textAlign = item.textAlign ?? 'center';

  const containerStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    color: txtColor,
    borderRadius: `${radius}px`,
    boxShadow: shadow === 'none' ? 'none' : 
               shadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.12)' :
               shadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' :
               '0 20px 25px -5px rgba(0,0,0,0.2)',
    opacity: opacity,
    textAlign: textAlign,
    overflow: 'hidden'
  };

  const textStyle: React.CSSProperties = {
    fontFamily: fontFamily,
    fontSize: item.type === 'quote' ? `${Math.max(12, fontSize)}px` : `${Math.max(24, fontSize)}px`,
    color: txtColor
  };

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="w-full h-full relative group">
             <img 
               src={item.content} 
               className="w-full h-full object-cover pointer-events-none select-none" 
               draggable={false} 
               style={{ borderRadius: `${radius}px` }} 
             />
             {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-[inherit]">
                   <p className="text-white font-bold text-sm text-center leading-tight drop-shadow-md">{item.caption}</p>
                </div>
             )}
          </div>
        );
      case 'quote':
        return (
          <div className="w-full h-full p-6 flex flex-col justify-center items-center h-full">
             <Quote size={24} className="mb-4 opacity-30 text-current" />
             <p className="italic leading-relaxed select-none w-full" style={textStyle}>
                "{item.content}"
             </p>
             {item.subContent && (
               <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-60 border-t border-current/10 pt-2 select-none w-full" style={{ fontFamily }}>
                 - {item.subContent}
               </p>
             )}
          </div>
        );
      case 'affirmation':
        return (
          <div className="w-full h-full flex flex-col justify-center items-center p-6 h-full">
             <h3 className="font-black tracking-tighter uppercase leading-none select-none w-full" style={textStyle}>
                {item.content}
             </h3>
          </div>
        );
      case 'sticker':
        const Icon = (LucideIcons as any)[item.content] || LucideIcons.HelpCircle;
        return (
          <div className="w-full h-full flex items-center justify-center p-2">
            <Icon size="100%" strokeWidth={1.5} color={txtColor} />
          </div>
        );
      case 'goal_ref':
        return (
          <div className="w-full h-full p-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 text-white flex flex-col justify-between select-none" style={{ borderRadius: `${radius}px` }}>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-70 text-[9px] font-black uppercase tracking-[0.3em]">
                   <Target size={12} strokeWidth={3} /> Goal Active
                </div>
                <h3 className="font-black leading-tight tracking-tight drop-shadow-md" style={{ fontSize: `${Math.max(14, fontSize)}px` }}>{item.content}</h3>
             </div>
             <div className="mt-4 relative z-10">
                <div className="flex justify-between text-[10px] mb-2 opacity-90 font-mono font-black">
                   <span className="uppercase tracking-widest">Mastery</span>
                   <span>{item.subContent}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_white]" style={{ width: `${item.subContent}%` }} />
                </div>
             </div>
          </div>
        );
      default:
        return <div className="p-4">Unknown</div>;
    }
  };

  const toolbarStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    top: 'auto',
    transform: 'none',
    zIndex: 100,
    width: '100%',
    maxWidth: '100%'
  } : {
    top: '50%',
    left: 0,
    position: 'absolute',
    transform: `translateY(-50%) translateX(-100%) translateX(-24px) rotate(${-localRot}deg)`,
    transformOrigin: 'right center',
    pointerEvents: 'none'
  };

  return (
    <>
      <div
        ref={nodeRef}
        onMouseDown={handleDragStart}
        className={`absolute origin-center select-none touch-none ${isSelected && isEditing ? 'z-[50]' : ''} ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''} transition-shadow duration-300`}
        style={{
          left: localPos.x,
          top: localPos.y,
          width: localSize.width,
          height: localSize.height,
          transform: `rotate(${localRot}deg)`,
          zIndex: item.zIndex || 1,
        }}
      >
        <div 
          className={`w-full h-full ${isSelected && isEditing ? 'ring-2 ring-primary-500 shadow-2xl' : 'hover:ring-2 hover:ring-black/5 dark:hover:ring-white/10'}`}
          style={containerStyle}
        >
          {renderContent()}

          {isEditing && isSelected && (
             <>
               <div 
                 onMouseDown={handleResizeStart}
                 className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-white text-primary-600 rounded-tl-xl shadow-lg cursor-nwse-resize z-50 flex items-center justify-center border-t border-l border-gray-200"
               >
                  <Scaling size={14} />
               </div>

               <div 
                 onMouseDown={handleRotateStart}
                 className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white text-primary-600 rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-50"
               >
                  <RotateCw size={16} strokeWidth={3} />
               </div>

               <button 
                 onMouseDown={(e) => { e.stopPropagation(); onDelete(item.id); }}
                 className="absolute -top-3 -right-3 w-7 h-7 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-50 border-2 border-white"
               >
                  <Trash2 size={14} strokeWidth={3} />
               </button>
             </>
          )}
        </div>

        {/* --- CUSTOMIZATION TOOLBAR --- */}
        {isEditing && isSelected && (
           <div 
              className={isMobile ? "fixed bottom-0 left-0 right-0 z-[100] pb-safe" : "z-[100]"}
              style={isMobile ? undefined : toolbarStyle}
           >
              <div 
                className={`
                  bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col gap-2 pointer-events-auto animate-in duration-200
                  ${isMobile 
                    ? 'w-full rounded-t-3xl p-4 slide-in-from-bottom-full border-b-0' 
                    : 'rounded-2xl p-1.5 min-w-[240px] slide-in-from-right-2 zoom-in-95'
                  }
                `}
                onMouseDown={(e) => e.stopPropagation()}
              >
                  {/* Top Bar */}
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                     <button onClick={() => setActiveTool(activeTool === 'style' ? 'none' : 'style')} className={`p-2 rounded-lg flex-1 flex justify-center ${activeTool === 'style' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Styles"><Sliders size={18} /></button>
                     <button onClick={() => setActiveTool(activeTool === 'color' ? 'none' : 'color')} className={`p-2 rounded-lg flex-1 flex justify-center ${activeTool === 'color' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Colors"><Palette size={18} /></button>
                     <button onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')} className={`p-2 rounded-lg flex-1 flex justify-center ${activeTool === 'text' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Typography"><Type size={18} /></button>
                     <button onClick={() => setActiveTool(activeTool === 'layers' ? 'none' : 'layers')} className={`p-2 rounded-lg flex-1 flex justify-center ${activeTool === 'layers' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} title="Layers"><Layers size={18} /></button>
                     {isMobile && (
                        <button onClick={() => onSelect()} className="p-2 ml-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"><X size={18} /></button>
                     )}
                  </div>

                  {/* Sub Panels - Scrollable Content Area */}
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {activeTool === 'style' && (
                       <div className="p-3 space-y-4">
                          <div>
                             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2"><span>Radius</span><span>{radius}px</span></div>
                             <input type="range" min="0" max="100" value={radius} onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none accent-primary-600 cursor-pointer" />
                          </div>
                          <div>
                             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2"><span>Opacity</span><span>{Math.round(opacity * 100)}%</span></div>
                             <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => updateStyle('opacity', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none accent-primary-600 cursor-pointer" />
                          </div>
                          <div className="flex gap-1 pt-1">
                             {['none', 'sm', 'lg', 'xl'].map(s => (
                                <button key={s} onClick={() => updateStyle('shadow', s)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${shadow === s ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-200 text-gray-500'}`}>{s}</button>
                             ))}
                          </div>
                       </div>
                    )}

                    {activeTool === 'color' && (
                       <div className="p-3 space-y-4">
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Background</p>
                             <div className="flex flex-wrap gap-3">
                                {COLORS.map(c => (
                                   <button key={c} onClick={() => updateStyle('backgroundColor', c)} className={`w-6 h-6 rounded-full border border-gray-200 shadow-sm transition-transform ${bgColor === c ? 'ring-2 ring-primary-500 scale-110' : ''}`} style={{ background: c }} />
                                ))}
                             </div>
                          </div>
                          <div className="h-px bg-gray-100 dark:bg-gray-700" />
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Text / Icon</p>
                             <div className="flex flex-wrap gap-3">
                                {COLORS.map(c => (
                                   <button key={c} onClick={() => updateStyle('textColor', c)} className={`w-6 h-6 rounded-full border border-gray-200 shadow-sm transition-transform ${txtColor === c ? 'ring-2 ring-primary-500 scale-110' : ''}`} style={{ background: c }} />
                                ))}
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTool === 'text' && (
                       <div className="p-3 space-y-4">
                          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                             <button onClick={() => updateStyle('textAlign', 'left')} className={`flex-1 p-2 rounded ${textAlign === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft size={16} /></button>
                             <button onClick={() => updateStyle('textAlign', 'center')} className={`flex-1 p-2 rounded ${textAlign === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter size={16} /></button>
                             <button onClick={() => updateStyle('textAlign', 'right')} className={`flex-1 p-2 rounded ${textAlign === 'right' ? 'bg-white shadow' : ''}`}><AlignRight size={16} /></button>
                          </div>
                          <div>
                             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2"><span>Size</span><span>{fontSize}px</span></div>
                             <input type="range" min="12" max="150" value={fontSize} onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none accent-primary-600 cursor-pointer" />
                          </div>
                          <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Font Family</label>
                             <select 
                                value={fontFamily} 
                                onChange={(e) => updateStyle('fontFamily', e.target.value)} 
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-primary-500"
                             >
                                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                             </select>
                          </div>
                       </div>
                    )}

                    {activeTool === 'layers' && (
                       <div className="p-3 grid grid-cols-2 gap-3">
                          <button onClick={() => changeLayer('front')} className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600"><BringToFront size={16} /> Front</button>
                          <button onClick={() => changeLayer('back')} className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600"><SendToBack size={16} /> Back</button>
                          <button onClick={() => changeLayer('up')} className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-xl"><ArrowUp size={16} /> Forward</button>
                          <button onClick={() => changeLayer('down')} className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-xl"><ArrowDown size={16} /> Backward</button>
                          <div className="col-span-2 text-center text-[10px] text-gray-400 pt-1">
                             Current Layer: {item.zIndex}
                          </div>
                       </div>
                    )}
                  </div>
              </div>
           </div>
        )}
      </div>
    </>
  );
};
