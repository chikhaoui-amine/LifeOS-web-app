
import { GoogleGenAI, Type } from "@google/genai";
import React, { useState } from 'react';
import { X, Sparkles, BrainCircuit, Loader2, AlertCircle, Lightbulb } from 'lucide-react';
import { Goal } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface AIGoalPlannerModalProps {
  onGoalGenerated: (goal: Partial<Goal>) => void;
  onClose: () => void;
}

export const AIGoalPlannerModal: React.FC<AIGoalPlannerModalProps> = ({ onGoalGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a SMART goal for: "${prompt}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              motivation: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              targetValue: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, completed: { type: Type.BOOLEAN } }
                }
              }
            }
          },
          systemInstruction: "You are an elite life coach. Convert user dreams into structured goals with actionable milestones in JSON format."
        },
      });

      const goalData = JSON.parse(response.text || '{}');
      const processedGoal = {
        ...goalData,
        id: Math.random().toString(36).substr(2, 9),
        color: 'indigo',
        type: 'milestone',
        currentValue: 0,
        milestones: goalData.milestones?.map((m: any) => ({ ...m, id: Math.random().toString(36).substr(2, 7) })) || []
      };

      onGoalGenerated(processedGoal);
      onClose();
    } catch (err) {
      console.error(err);
      setError("The coach is currently offline. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-3"><BrainCircuit size={24} /><div><h2 className="text-xl font-bold">AI Goal Planner</h2><p className="text-indigo-100 text-xs">Powered by Gemini</p></div></div>
              <button onClick={onClose} className="p-2"><X size={18} /></button>
           </div>
        </div>
        <div className="p-6 space-y-6">
           <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl text-sm"><Lightbulb className="text-indigo-600 shrink-0" size={20} /><p className="text-indigo-900 dark:text-indigo-200">Describe your dream, and I'll build the roadmap.</p></div>
           <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. I want to save $5k for travel or learn to play piano..." className="w-full h-36 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none resize-none text-gray-900 dark:text-white" autoFocus />
           {error && <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-xl"><AlertCircle size={16} /> {error}</div>}
           <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Planning...</> : <><Sparkles size={20} /> Generate Plan</>}
           </button>
        </div>
      </div>
    </div>
  );
};
