
import React, { useState } from 'react';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { X, Sparkles, ChefHat, Loader2, AlertCircle } from 'lucide-react';
import { Recipe } from '../../types';

interface AIChefModalProps {
  onRecipeGenerated: (recipe: Partial<Recipe>) => void;
  onClose: () => void;
}

export const AIChefModal: React.FC<AIChefModalProps> = ({ onRecipeGenerated, onClose }) => {
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
      
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          prepTime: { type: Type.INTEGER, description: "Preparation time in minutes" },
          cookTime: { type: Type.INTEGER, description: "Cooking time in minutes" },
          servings: { type: Type.INTEGER },
          calories: { type: Type.INTEGER },
          difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
          cuisine: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                category: { type: Type.STRING, description: "e.g., Produce, Dairy, Pantry" }
              }
            }
          },
          instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "ingredients", "instructions", "prepTime", "cookTime", "difficulty"],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a simple, reliable, and delicious recipe based on this request: "${prompt}". Focus on classic flavors, standard ingredients, and ease of preparation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          systemInstruction: "You are an expert home cook who values simplicity and flavor. Create recipes that are practical for everyday cooking using common grocery store ingredients. Avoid experimental, strange, or overly complex flavor combinations. Ensure the recipe is 'tried and true'. Ensure ingredient amounts are numeric.",
        },
      });

      const recipeData = JSON.parse(response.text || '{}');
      
      // Add unique IDs to ingredients since the AI won't generate them
      const processedRecipe = {
        ...recipeData,
        ingredients: recipeData.ingredients?.map((ing: any) => ({
          ...ing,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
        })) || []
      };

      onRecipeGenerated(processedRecipe);
      onClose();

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError("The chef is having trouble hearing you. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <ChefHat size={24} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">AI Chef</h2>
                    <p className="text-orange-100 text-xs font-medium">Powered by Gemini</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                 <X size={18} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">What would you like to cook?</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A simple pasta dish, quick chicken dinner, or classic chocolate cookies..."
                className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none resize-none text-gray-900 dark:text-white transition-all"
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
             className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Cooking up magic...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Generate Recipe
                </>
              )}
           </button>
        </div>

      </div>
    </div>
  );
};
