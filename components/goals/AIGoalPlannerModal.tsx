
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Sparkles, BrainCircuit, Loader2, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { Goal, GoalType } from '../../types';

interface AIGoalPlannerModalProps {
  onGoalGenerated: (goal: Partial<Goal>) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Career & Business', 'Financial & Wealth', 'Health & Fitness', 
  'Relationships & Family', 'Personal Development', 'Education & Learning', 
  'Spiritual & Faith', 'Adventure & Travel', 'Creativity & Hobbies', 'Contribution & Legacy'
];

const COLORS = ['indigo', 'blue', 'green', 'amber', 'red', 'purple', 'pink'];

export const AIGoalPlannerModal: React.FC<AIGoalPlannerModalProps> = ({ onGoalGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API Key missing. Please configure VITE_API_KEY in your Vercel settings.");
      setIsGenerating(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I want to achieve this: "${prompt}". Please help me turn this into a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A concise, motivating title for the goal" },
              description: { type: Type.STRING, description: "A detailed breakdown of the goal" },
              motivation: { type: Type.STRING, description: "The 'Why' behind this goal to keep the user inspired" },
              category: { type: Type.STRING, enum: CATEGORIES },
              type: { type: Type.STRING, enum: ["milestone", "numeric", "habit"] },
              targetValue: { type: Type.NUMBER, description: "The target numerical value (e.g. 100 for percentage or milestones, or a specific count)" },
              unit: { type: Type.STRING, description: "Unit of measurement if numeric (e.g. 'kg', 'pages', 'hours')" },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              color: { type: Type.STRING, enum: COLORS },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "A specific action step" },
                    completed: { type: Type.BOOLEAN }
                  },
                  required: ["title", "completed"]
                }
              }
            },
            required: ["title", "description", "motivation", "category", "type", "milestones", "priority", "color"],
          },
          systemInstruction: "You are a world-class life coach and productivity expert. Your job is to take rough ideas and turn them into highly effective, structured goals. You provide clear action steps (milestones) and emotional resonance (motivation). Always ensure the category fits the predefined list provided in the schema.",
        },
      });

      const goalData = JSON.parse(response.text || '{}');
      
      // Ensure milestones have unique IDs for the UI
      const processedGoal = {
        ...goalData,
        milestones: goalData.milestones?.map((m: any) => ({
          ...m,
          id: Math.random().toString(36).substr(2, 9),
          completed: false
        })) || []
      };

      onGoalGenerated(processedGoal);
      onClose();

    } catch (err: any) {
      console.error("AI Goal Planning Error:", err);
      setError("The coach is busy right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <BrainCircuit size={24} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">AI Goal Planner</h2>
                    <p className="text-indigo-100 text-xs font-medium">Powered by Gemini AI</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                 <X size={18} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           <div className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                 <Lightbulb className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" size={20} />
                 <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    Describe a dream, a project, or a habit you want to start. I'll help you structure it perfectly.
                 </p>
              </div>

              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., I want to run a marathon by next year, or I want to save money to buy a house in the suburbs..."
                className="w-full h-36 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-white transition-all text-sm"
                autoFocus
              />
           </div>

           {error && (
             <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl">
                <AlertCircle size={16} /> {error}
             </div>
           )}

           <button 
             onClick={handleGenerate}
             disabled={isGenerating || !prompt.trim()}
             className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> 
                  <span>Designing your path...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate SMART Goal</span>
                </>
              )}
           </button>

           {!isGenerating && (
             <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 uppercase tracking-widest">
               AI will suggest title, description, milestones and category
             </p>
           )}
        </div>

      </div>
    </div>
  );
};
