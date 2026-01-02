
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Sparkles, Plus, Maximize2, Lock, Unlock, MousePointer2, ZoomIn, ZoomOut, Hand, Navigation, Expand, Shrink } from 'lucide-react';
import { useVisionBoard } from '../context/VisionBoardContext';
import { AddVisionModal } from '../components/vision/AddVisionModal';
import { FocusSession } from '../components/vision/FocusSession';
import { FreeFormItem } from '../components/vision/FreeFormItem';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const VisionBoard: React.FC = () => {
  const { items, loading, deleteItem, updateItem } = useVisionBoard();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Initial zoom based on screen size (Mobile starts at 0.5)
  const [zoom, setZoom] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.5 : 1);
  
  // Canvas Size State (Dynamic)
  const [canvasSize, setCanvasSize] = useState(3000);
  
  // Panning State
  const [isHandMode, setIsHandMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Center point for new items (Logical coordinates)
  // We default to the middle of the *initial* 3000px canvas (1500,1500) so items start in a predictable place even if expanded later
  const [centerPos, setCenterPos] = useState({ x: 1500, y: 1500 });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Helper to strictly center the view based on visual wrapper size
  const centerView = useCallback((smooth = false, targetZoom?: number) => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      const currentZoom = targetZoom ?? zoom;
      
      // Calculate visual dimensions
      const visualSize = canvasSize * currentZoom;
      const visualCenter = visualSize / 2;
      
      const scrollLeft = visualCenter - (el.clientWidth / 2);
      const scrollTop = visualCenter - (el.clientHeight / 2);
      
      el.scrollTo({ 
        left: scrollLeft, 
        top: scrollTop, 
        behavior: smooth ? 'smooth' : 'auto' 
      });
    }
  }, [zoom, canvasSize]);

  // Initial Center on Mount & Mobile Zoom Check
  useLayoutEffect(() => {
    if (!loading) {
      // Force zoom out on mobile initial load
      if (window.innerWidth < 768) {
        setZoom(0.5);
      }
      
      // Small timeout ensures layout is painted before scrolling
      setTimeout(() => centerView(false), 50);
    }
  }, [loading, centerView]);

  // Handle Resize & Orientation Change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && zoom > 0.6) {
        setZoom(0.5);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom]);

  // Panning Logic (Mouse Drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollLeft -= dx;
        scrollAreaRef.current.scrollTop -= dy;
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  const handleOpenAddModal = () => {
    // Calculate center based on current scroll position
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      // Map scroll center back to logical coordinates
      const visualCenterX = el.scrollLeft + (el.clientWidth / 2);
      const visualCenterY = el.scrollTop + (el.clientHeight / 2);
      
      const logicalX = visualCenterX / zoom;
      const logicalY = visualCenterY / zoom;
      
      setCenterPos({ x: logicalX, y: logicalY });
    }
    setIsAddModalOpen(true);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => {
      const newZoom = Math.min(2, Math.max(0.2, prev + delta));
      return newZoom;
    });
  };

  const handleResizeCanvas = (delta: number) => {
    setCanvasSize(prev => {
      const newSize = Math.max(3000, prev + delta);
      // Re-center after resize to prevent jump
      setTimeout(() => centerView(true), 10);
      return newSize;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isHandMode || e.button === 1 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setSelectedId(null);
    } else {
      // Clicking empty space deselects
      if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'canvas-wrapper') {
        setSelectedId(null);
      }
    }
  };

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-700 relative overflow-hidden bg-[#f1f5f9] dark:bg-[#020617] -m-4 sm:-m-8">
      
      {isFocusMode && <FocusSession items={items} onClose={() => setIsFocusMode(false)} />}

      {/* Floating HUD */}
      <div className="absolute top-4 left-0 right-0 px-4 z-50 pointer-events-none flex justify-between items-start">
        
        {/* Title Block - Hidden on Mobile */}
        <div className="hidden md:flex pointer-events-auto bg-white/40 dark:bg-black/40 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl flex-col">
           <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-0.5">
              <Sparkles size={16} className="fill-current animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Canvas v2.0</span>
           </div>
           <h1 className="text-xl font-black text-gray-900 dark:text-white font-serif tracking-tight leading-none">Vision Space</h1>
        </div>

        {/* Controls Toolbar */}
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2 ml-auto w-full md:w-auto">
           
           <div className="bg-white/60 dark:bg-black/60 backdrop-blur-xl p-1 rounded-xl border border-white/20 flex gap-1 shadow-lg">
              <button 
                onClick={() => setIsHandMode(false)} 
                className={`p-2 rounded-lg transition-all active:scale-90 ${!isHandMode ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/20'}`} 
                title="Select Tool"
              >
                <MousePointer2 size={18} />
              </button>
              <button 
                onClick={() => { setIsHandMode(true); setIsEditMode(true); }} 
                className={`p-2 rounded-lg transition-all active:scale-90 ${isHandMode ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/20'}`} 
                title="Hand Tool"
              >
                <Hand size={18} />
              </button>
           </div>

           <div className="bg-white/60 dark:bg-black/60 backdrop-blur-xl p-1 rounded-xl border border-white/20 flex gap-1 shadow-lg">
              <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-white/20 rounded-lg text-gray-600 dark:text-gray-300 transition-all active:scale-90"><ZoomIn size={18} /></button>
              <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-white/20 rounded-lg text-gray-600 dark:text-gray-300 transition-all active:scale-90"><ZoomOut size={18} /></button>
              <button onClick={() => centerView(true)} className="p-2 hover:bg-white/20 rounded-lg text-gray-600 dark:text-gray-300 transition-all active:scale-90"><Navigation size={18} /></button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center" />
              <button onClick={() => handleResizeCanvas(-1000)} className="p-2 hover:bg-white/20 rounded-lg text-gray-600 dark:text-gray-300 transition-all active:scale-90" title="Contract Board"><Shrink size={18} /></button>
              <button onClick={() => handleResizeCanvas(1000)} className="p-2 hover:bg-white/20 rounded-lg text-gray-600 dark:text-gray-300 transition-all active:scale-90" title="Expand Board"><Expand size={18} /></button>
           </div>

           <button 
             onClick={() => { setIsEditMode(!isEditMode); if(isEditMode) setSelectedId(null); }}
             className={`p-2 sm:px-4 sm:py-2 border rounded-xl transition-all shadow-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest backdrop-blur-md ${isEditMode ? 'bg-orange-500 border-orange-400 text-white shadow-orange-500/20' : 'bg-white/60 dark:bg-gray-800/60 border-white/20 text-gray-700 dark:text-gray-300'}`}
           >
              {isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
              <span className="hidden sm:inline">{isEditMode ? 'Editing' : 'Locked'}</span>
           </button>
           
           <button 
             onClick={handleOpenAddModal}
             className="hidden sm:flex px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black items-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
           >
              <Plus size={16} strokeWidth={4} /> Add Item
           </button>
        </div>
      </div>

      {/* 
        Infinite Scroll Area 
        Note: The outer div scrolls. The inner 'wrapper' matches the visual size of the scaled canvas.
        This forces scrollbars to respect the zoom level correctly.
      */}
      <div 
        ref={scrollAreaRef}
        className={`flex-1 overflow-auto relative custom-scrollbar ${isHandMode || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
      >
        <div 
          id="canvas-wrapper"
          style={{ 
            width: canvasSize * zoom, 
            height: canvasSize * zoom,
            position: 'relative'
          }}
        >
          <div 
            className="absolute top-0 left-0 transition-transform duration-200 origin-top-left"
            style={{ 
              width: canvasSize, 
              height: canvasSize,
              transform: `scale(${zoom})`,
              backgroundImage: `
                radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.15) 1px, transparent 0),
                linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 200px 200px, 200px 200px'
            }}
          >
            {items.length === 0 ? (
              <div 
                className="absolute pointer-events-none flex items-center justify-center text-center"
                style={{ left: (canvasSize/2) - 200, top: (canvasSize/2) - 200, width: 400, height: 400 }}
              >
                 <div className="pointer-events-auto">
                   <EmptyState 
                      icon={MousePointer2} 
                      title="A Blank Universe" 
                      description="Unlock the canvas to start dragging your dreams. Add images, powerful affirmations, and stickers to manifest your reality." 
                      actionLabel="Start Designing"
                      onAction={handleOpenAddModal}
                   />
                 </div>
              </div>
            ) : (
              items.map(item => (
                <FreeFormItem 
                  key={item.id}
                  item={item}
                  items={items}
                  isEditing={isEditMode && !isHandMode} 
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onSelect={() => !isHandMode && setSelectedId(item.id)}
                  isSelected={selectedId === item.id}
                  zoom={zoom}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls & Mobile Add Button */}
      <div className="absolute bottom-6 left-0 right-0 z-50 pointer-events-none px-4 flex items-end justify-between">
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 text-white/90 text-[9px] font-black uppercase tracking-[0.1em] shadow-2xl">
             <span>{items.length} Items</span>
             <div className="w-px h-3 bg-white/20" />
             <span>{Math.round(zoom * 100)}%</span>
             <button 
               onClick={() => setIsFocusMode(true)}
               disabled={items.length === 0}
               className="pointer-events-auto ml-1 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-all disabled:opacity-30"
               title="Immersive Mode"
             >
                <Maximize2 size={10} />
             </button>
          </div>

          <button 
             onClick={handleOpenAddModal}
             className="pointer-events-auto sm:hidden w-14 h-14 bg-violet-600 text-white rounded-full shadow-2xl shadow-violet-600/40 flex items-center justify-center active:scale-90 transition-transform"
          >
             <Plus size={28} strokeWidth={3} />
          </button>
      </div>

      {isAddModalOpen && (
        <AddVisionModal 
          centerPos={centerPos}
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default VisionBoard;
