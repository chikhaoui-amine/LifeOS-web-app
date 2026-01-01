
import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Quote, Target, Plus, Check, Shuffle, Upload, Link, Search, Clipboard } from 'lucide-react';
import { useVisionBoard } from '../../context/VisionBoardContext';
import { useGoals } from '../../context/GoalContext';
import { VisionItemType } from '../../types';

interface AddVisionModalProps {
  onClose: () => void;
}

const COLORS = [
  'bg-white dark:bg-gray-800',
  'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
  'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
  'bg-pink-50 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200',
  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  'bg-gray-900 text-white dark:bg-black',
];

export const AddVisionModal: React.FC<AddVisionModalProps> = ({ onClose }) => {
  const { addItem } = useVisionBoard();
  const { goals } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [type, setType] = useState<VisionItemType>('image');
  const [imageTab, setImageTab] = useState<'upload' | 'link' | 'search'>('upload');
  
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [subContent, setSubContent] = useState('');
  const [width, setWidth] = useState<'1' | '2'>('1');
  const [height, setHeight] = useState<'1' | '2' | '3'>('1');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');

  useEffect(() => {
    // Focus container to capture paste events immediately
    if (containerRef.current) {
        containerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (type === 'image' && content.startsWith('http')) {
        setPreviewUrl(content);
    } else if (type === 'image' && content.startsWith('data:')) {
        setPreviewUrl(content);
    }
  }, [content, type]);

  const handleSubmit = () => {
    if (type === 'goal_ref' && selectedGoalId) {
       const goal = goals.find(g => g.id === selectedGoalId);
       if (goal) {
          const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
          addItem({
             type: 'goal_ref',
             content: goal.title,
             subContent: progress.toString(),
             width,
             height: '1',
             linkedGoalId: goal.id
          });
       }
    } else if (content) {
       addItem({
          type,
          content,
          caption: type === 'image' ? caption : undefined,
          subContent: type === 'quote' ? subContent : undefined,
          width,
          height,
          color: type === 'quote' ? selectedColor : undefined
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

  // Helper to handle clipboard reading from button click
  const handlePasteClick = async () => {
    try {
      // 1. Try reading rich content (images)
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.some(type => type.startsWith('image/'))) {
          const blob = await item.getType(item.types.find(type => type.startsWith('image/'))!);
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64 = reader.result as string;
             setContent(base64);
             setPreviewUrl(base64);
             setImageTab('upload');
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      // If no image found in items, fall through to text
      throw new Error("No image in clipboard items");
    } catch (err) {
      // 2. Fallback: Try reading as text (e.g. URLs)
      // This is often allowed even if .read() is blocked
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setContent(text);
            if (text.startsWith('http')) {
                setPreviewUrl(text);
                setImageTab('link');
            }
        }
      } catch (textErr) {
        console.error('Clipboard access failed:', err);
        alert("Clipboard access blocked by browser settings. Please click an input field and press Ctrl+V to paste.");
      }
    }
  };

  // Handle Ctrl+V events on the modal
  const handleNativePaste = (e: React.ClipboardEvent) => {
    // Check for files/images in paste data
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setContent(base64);
                setPreviewUrl(base64);
                setImageTab('upload');
            };
            reader.readAsDataURL(file);
        }
    } else {
        // If it's text, let default behavior handle it if focused on input,
        // or capture it here if we want to be smart about URLs
        const text = e.clipboardData.getData('text');
        if (text && text.startsWith('http') && document.activeElement === containerRef.current) {
            e.preventDefault();
            setContent(text);
            setPreviewUrl(text);
            setImageTab('link');
        }
    }
  };

  const handleRandomImage = (keyword: string) => {
     const randomId = Math.floor(Math.random() * 1000);
     const url = `https://picsum.photos/seed/${keyword}${randomId}/600/800`;
     setContent(url);
     setPreviewUrl(url);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
        onPaste={handleNativePaste}
    >
      <div 
        ref={containerRef}
        className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden max-h-[90vh] outline-none"
        tabIndex={-1}
      >
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
           <h3 className="font-bold text-xl text-gray-900 dark:text-white">Add to Vision Board</h3>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
           </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-700">
           <button onClick={() => setType('image')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'image' ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50 dark:bg-violet-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <ImageIcon size={18} /> Image
           </button>
           <button onClick={() => setType('quote')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'quote' ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50 dark:bg-violet-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Quote size={18} /> Quote
           </button>
           <button onClick={() => setType('goal_ref')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'goal_ref' ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50 dark:bg-violet-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Target size={18} /> Goal
           </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
           {type === 'image' && (
              <div className="space-y-4">
                 
                 {/* Image Source Tabs */}
                 <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
                    <button onClick={() => setImageTab('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageTab === 'upload' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Upload</button>
                    <button onClick={() => setImageTab('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageTab === 'link' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Link</button>
                    <button onClick={() => setImageTab('search')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageTab === 'search' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Search</button>
                 </div>

                 <div className="min-h-[150px] flex flex-col justify-center">
                    {imageTab === 'upload' && (
                       <div 
                         className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all cursor-pointer group"
                         onClick={() => fileInputRef.current?.click()}
                       >
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          {previewUrl ? (
                             <img src={previewUrl} className="max-h-40 mx-auto rounded-lg shadow-md" alt="Preview" />
                          ) : (
                             <>
                               <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                  <Upload size={24} />
                               </div>
                               <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Tap to upload from device</p>
                               <p className="text-xs text-gray-400 mt-1">or paste from clipboard (Ctrl+V)</p>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handlePasteClick(); }}
                                 className="mt-3 text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 mx-auto hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                               >
                                  <Clipboard size={12} /> Auto Paste
                               </button>
                             </>
                          )}
                       </div>
                    )}

                    {imageTab === 'link' && (
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Image URL</label>
                          <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                  value={content}
                                  onChange={e => setContent(e.target.value)}
                                  placeholder="https://pinterest.com/image.jpg"
                                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                                />
                             </div>
                          </div>
                          {previewUrl && <img src={previewUrl} className="h-32 w-full object-cover rounded-xl border border-gray-200" alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                          <p className="text-[10px] text-gray-400 italic">Tip: Right click an image online and select "Copy Image Address"</p>
                       </div>
                    )}

                    {imageTab === 'search' && (
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inspiration Keywords</label>
                          <div className="flex flex-wrap gap-2">
                             {['Travel', 'Luxury', 'Fitness', 'Nature', 'Workspace', 'Minimalism', 'City', 'Ocean', 'Car', 'Home'].map(k => (
                                <button 
                                  key={k}
                                  onClick={() => handleRandomImage(k)}
                                  className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all"
                                >
                                   {k}
                                </button>
                             ))}
                          </div>
                          {previewUrl && <div className="mt-4"><img src={previewUrl} className="h-40 w-full object-cover rounded-xl shadow-md" alt="Random" /></div>}
                       </div>
                    )}
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Caption (Optional)</label>
                    <input 
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="My dream..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                 </div>
              </div>
           )}

           {type === 'quote' && (
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Quote</label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="The future belongs to those who believe..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20 h-24 resize-none font-serif text-lg"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Author (Optional)</label>
                    <input 
                      value={subContent}
                      onChange={e => setSubContent(e.target.value)}
                      placeholder="Eleanor Roosevelt"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-none outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Card Style</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                       {COLORS.map((c, i) => (
                          <button 
                            key={i}
                            onClick={() => setSelectedColor(c)}
                            className={`w-10 h-10 shrink-0 rounded-full border-2 ${c} ${selectedColor === c ? 'border-violet-500 scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          />
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {type === 'goal_ref' && (
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select Active Goal</label>
                 <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {activeGoals.map(g => (
                       <button
                         key={g.id}
                         onClick={() => setSelectedGoalId(g.id)}
                         className={`p-3 rounded-xl border text-left transition-all ${selectedGoalId === g.id ? 'bg-violet-50 border-violet-500 dark:bg-violet-900/20' : 'bg-gray-50 dark:bg-gray-700/30 border-transparent hover:border-gray-300'}`}
                       >
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{g.title}</p>
                          <p className="text-xs text-gray-500">{g.currentValue} / {g.targetValue} {g.unit}</p>
                       </button>
                    ))}
                    {activeGoals.length === 0 && <p className="text-gray-500 text-sm italic">No active goals found. Create one in the Goals tab first.</p>}
                 </div>
              </div>
           )}

           {type !== 'goal_ref' && (
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Width</label>
                   <div className="flex gap-2">
                      <button onClick={() => setWidth('1')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${width === '1' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>Normal</button>
                      <button onClick={() => setWidth('2')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${width === '2' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>Wide</button>
                   </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Height</label>
                   <div className="flex gap-2">
                      <button onClick={() => setHeight('1')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${height === '1' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>Short</button>
                      <button onClick={() => setHeight('2')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${height === '2' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>Tall</button>
                   </div>
                </div>
             </div>
           )}

           <button 
             onClick={handleSubmit}
             disabled={type === 'goal_ref' ? !selectedGoalId : !content}
             className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
           >
              Add to Board
           </button>
        </div>

      </div>
    </div>
  );
};
