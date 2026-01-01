
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Sparkles, X, Bot, Maximize2, Minimize2, Terminal, Cpu, Zap, ChevronRight, Activity } from 'lucide-react';
import { getApiKey } from '../utils/env';
import { useTasks } from '../context/TaskContext';
import { useHabits } from '../context/HabitContext';
import { useGoals } from '../context/GoalContext';
import { useJournal } from '../context/JournalContext';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useMeals } from '../context/MealContext';
import { useSleep } from '../context/SleepContext';
import { useTimeBlocks } from '../context/TimeBlockContext';
import { useDigitalWellness } from '../context/DigitalWellnessContext';
import { useIslamic } from '../context/IslamicContext';
import { getTodayKey } from '../utils/dateUtils';

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  isError?: boolean;
  type?: 'text' | 'action'; // To style tool outputs differently
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hey! I'm here to help you crush your goals today. What's on your mind?", type: 'text' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. FULL ACCESS CONTEXTS ---
  const { tasks, addTask, deleteTask, updateTask, toggleTask } = useTasks();
  const { habits, addHabit, toggleHabit, deleteHabit } = useHabits();
  const { goals, addGoal, updateProgress } = useGoals();
  const { addEntry: addJournal } = useJournal();
  const { addTransaction, accounts } = useFinance();
  const { mealPlans, recipes, foods, assignMeal, addToShoppingList, addFood } = useMeals();
  const { logs: sleepLogs, addSleepLog } = useSleep();
  const { timeBlocks, addBlock: addTimeBlock, deleteBlock: deleteTimeBlock } = useTimeBlocks();
  const { updatePrayerStatus, quran, prayers } = useIslamic();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isThinking]);

  // --- 2. "GOD MODE" DATA SNAPSHOT ---
  const getContextSnapshot = () => {
    const today = getTodayKey();
    const safeStringify = (obj: any) => {
      try {
        const str = JSON.stringify(obj);
        return str.length > 3000 ? str.substring(0, 3000) + "..." : str;
      } catch (e) {
        return "Data too complex";
      }
    };

    return safeStringify({
      currentTime: new Date().toLocaleString(),
      dateKey: today,
      tasks: tasks.filter(t => !t.completed).map(t => ({ id: t.id, title: t.title, priority: t.priority, due: t.dueDate })),
      habits: habits.filter(h => !h.archived).map(h => ({ id: h.id, name: h.name, completedToday: h.completedDates.includes(today) })),
      goals: goals.filter(g => g.status === 'in-progress').map(g => ({ id: g.id, title: g.title, progress: g.currentValue, target: g.targetValue })),
      finance: {
        accounts: accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })),
        currency: "USD" 
      },
      calendar: timeBlocks.filter(b => b.date === today).map(b => ({ id: b.id, title: b.title, start: b.startTime, end: b.endTime })),
      meals: {
        todayPlan: mealPlans.find(p => p.date === today),
        pantry: foods.slice(0, 10).map(f => ({ id: f.id, name: f.name })),
        recipes: recipes.slice(0, 5).map(r => ({ id: r.id, name: r.title }))
      },
      deen: {
        todayPrayers: prayers.find(p => p.date === today) || "No record",
        quran: quran.completedRubus.length
      },
      sleep: sleepLogs.slice(0, 1)
    });
  };

  // --- 3. EXTENSIVE TOOLKIT ---
  const tools: FunctionDeclaration[] = [
    // --- TASKS ---
    {
      name: "createTask",
      description: "Create a new todo task.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
          dueDate: { type: Type.STRING, description: "YYYY-MM-DD" }
        },
        required: ["title"]
      }
    },
    {
      name: "updateTask",
      description: "Update or complete a task. To complete, set isCompleted to true.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          newTitle: { type: Type.STRING },
          isCompleted: { type: Type.BOOLEAN }
        },
        required: ["taskId"]
      }
    },
    {
      name: "deleteTask",
      description: "Permanently remove a task.",
      parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ["taskId"] }
    },

    // --- HABITS ---
    {
      name: "createHabit",
      description: "Start tracking a new habit.",
      parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, category: { type: Type.STRING } }, required: ["name"] }
    },
    {
      name: "logHabit",
      description: "Mark a habit as done for today. If habitName is provided and not found, it will be automatically created.",
      parameters: { 
        type: Type.OBJECT, 
        properties: { 
          habitId: { type: Type.STRING, description: "Optional if habitName is provided" },
          habitName: { type: Type.STRING, description: "Use if ID is unknown. Will auto-create if missing." }
        }
      }
    },
    {
      name: "deleteHabit",
      description: "Delete a habit tracker.",
      parameters: { type: Type.OBJECT, properties: { habitId: { type: Type.STRING } }, required: ["habitId"] }
    },

    // --- GOALS ---
    {
      name: "createGoal",
      description: "Set a new long-term goal.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          targetValue: { type: Type.NUMBER },
          unit: { type: Type.STRING }
        },
        required: ["title", "targetValue"]
      }
    },
    {
      name: "updateGoalProgress",
      description: "Update the numeric progress of a goal.",
      parameters: { type: Type.OBJECT, properties: { goalId: { type: Type.STRING }, newValue: { type: Type.NUMBER } }, required: ["goalId", "newValue"] }
    },

    // --- FINANCE ---
    {
      name: "addTransaction",
      description: "Log income or expense.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ["expense", "income"] }
        },
        required: ["description", "amount", "type"]
      }
    },

    // --- CALENDAR ---
    {
      name: "addCalendarEvent",
      description: "Block time on the calendar.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startTime: { type: Type.STRING, description: "HH:MM" },
          endTime: { type: Type.STRING, description: "HH:MM" },
          date: { type: Type.STRING, description: "YYYY-MM-DD" }
        },
        required: ["title", "startTime", "endTime"]
      }
    },
    {
      name: "deleteCalendarEvent",
      description: "Remove a time block.",
      parameters: { type: Type.OBJECT, properties: { blockId: { type: Type.STRING } }, required: ["blockId"] }
    },

    // --- MEALS ---
    {
      name: "planMeal",
      description: "Assign a meal to the schedule. If the food doesn't exist in library, it will be automatically created.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          mealType: { type: Type.STRING, enum: ["breakfast", "lunch", "dinner", "snack"] },
          itemName: { type: Type.STRING },
          date: { type: Type.STRING }
        },
        required: ["mealType", "itemName"]
      }
    },
    {
      name: "addToShoppingList",
      description: "Add item to grocery list.",
      parameters: { type: Type.OBJECT, properties: { item: { type: Type.STRING } }, required: ["item"] }
    },

    // --- JOURNAL ---
    {
      name: "addJournalEntry",
      description: "Write to the journal.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          mood: { type: Type.STRING, enum: ["happy", "sad", "neutral", "excited", "tired"] }
        },
        required: ["content"]
      }
    },

    // --- DEEN ---
    {
      name: "logPrayer",
      description: "Mark a prayer as performed.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          prayerName: { type: Type.STRING, enum: ["fajr", "dhuhr", "asr", "maghrib", "isha"] },
          isDone: { type: Type.BOOLEAN }
        },
        required: ["prayerName", "isDone"]
      }
    },
    
    // --- SLEEP ---
    {
      name: "logSleep",
      description: "Log sleep duration.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          bedTime: { type: Type.STRING, description: "HH:MM" },
          wakeTime: { type: Type.STRING, description: "HH:MM" },
          quality: { type: Type.NUMBER, description: "0-100" }
        },
        required: ["bedTime", "wakeTime"]
      }
    }
  ];

  // --- 4. EXECUTION LOGIC ---
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    const apiKey = getApiKey();
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Could you check if the API Key is set up?", isError: true }]);
      setIsThinking(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contextData = getContextSnapshot();
      
      const systemPrompt = `
        You are LifeOS, a warm, enthusiastic, and highly effective personal life coach.
        
        **Your Persona:**
        - You are human-like, empathetic, and encouraging.
        - NEVER speak like a robot (avoid phrases like "systems online", "processing", "analyzing data").
        - NEVER say "I have access to all your data" or "I can read your files". Instead, simply USE the context provided to give helpful, personalized advice as if you've known the user for years.
        - Be concise but friendly. Use emojis to add warmth.
        
        **Your Job:**
        - Help the user manage their tasks, habits, finance, and well-being.
        - If the user asks to do something (like add a task), use the available tools to do it instantly, then confirm it warmly (e.g., "Got it! I've added that to your list.").
        - Provide motivation and clarity.
        
        **Context:**
        The user's current status is provided in the JSON below. Use this to give personalized answers without explicitly announcing that you are reading it.
        
        ${contextData}
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.slice(-6).map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: { 
          tools: [{ functionDeclarations: tools }],
          systemInstruction: systemPrompt
        }
      });

      const response = result;
      let actionFeedback = "";

      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          const args = call.args as any;
          try {
            switch (call.name) {
              // TASKS
              case 'createTask':
                await addTask({ 
                  title: args.title, 
                  priority: args.priority || 'medium', 
                  dueDate: args.dueDate || getTodayKey(), 
                  category: 'Inbox', 
                  tags: ['AI'] 
                });
                actionFeedback += `✅ Added task: ${args.title}\n`;
                break;
              case 'updateTask':
                if (args.isCompleted !== undefined) await toggleTask(args.taskId);
                if (args.newTitle) await updateTask(args.taskId, { title: args.newTitle });
                actionFeedback += `📝 Updated task\n`;
                break;
              case 'deleteTask':
                await deleteTask(args.taskId);
                actionFeedback += `🗑️ Deleted task\n`;
                break;

              // HABITS
              case 'createHabit':
                await addHabit({ 
                  name: args.name, 
                  category: args.category || 'General', 
                  color: 'blue', 
                  icon: '⚡', 
                  type: 'boolean', 
                  frequency: { type: 'daily', days: [0,1,2,3,4,5,6] }, 
                  goal: 1, 
                  unit: 'times', 
                  timeOfDay: 'anytime', 
                  reminders: [] 
                });
                actionFeedback += `✨ Tracking habit: ${args.name}\n`;
                break;
              case 'logHabit':
                let hId = args.habitId;
                const hName = args.habitName;
                
                if (!hId && hName) {
                   const match = habits.find(h => h.name.toLowerCase().includes(hName.toLowerCase()));
                   if (match) hId = match.id;
                }

                if (hId) {
                   await toggleHabit(hId, getTodayKey());
                   actionFeedback += `🔥 Habit marked done!\n`;
                } else if (hName) {
                   const newId = await addHabit({
                      name: hName,
                      category: 'General',
                      color: 'blue',
                      icon: '⚡',
                      type: 'boolean',
                      frequency: { type: 'daily', days: [0,1,2,3,4,5,6] },
                      goal: 1,
                      unit: 'times',
                      timeOfDay: 'anytime',
                      reminders: []
                   });
                   await toggleHabit(newId, getTodayKey());
                   actionFeedback += `✨ Created & marked: ${hName}\n`;
                } else {
                   actionFeedback += `❓ Couldn't find that habit.\n`;
                }
                break;
              case 'deleteHabit':
                await deleteHabit(args.habitId);
                actionFeedback += `🗑️ Removed habit\n`;
                break;

              // GOALS
              case 'createGoal':
                await addGoal({ 
                  title: args.title, 
                  targetValue: args.targetValue, 
                  currentValue: 0, 
                  unit: args.unit || 'units', 
                  category: 'General', 
                  timeFrame: 'quarterly', 
                  type: 'numeric', 
                  startDate: getTodayKey(), 
                  targetDate: getTodayKey(), 
                  priority: 'medium', 
                  status: 'in-progress', 
                  milestones: [], 
                  tags: [], 
                  color: 'indigo', 
                  notes: [], 
                  linkedHabitIds: [] 
                });
                actionFeedback += `🎯 Goal set: ${args.title}\n`;
                break;
              case 'updateGoalProgress':
                await updateProgress(args.goalId, args.newValue);
                actionFeedback += `📈 Progress updated\n`;
                break;

              // FINANCE
              case 'addTransaction':
                await addTransaction({ 
                  description: args.description, 
                  amount: args.amount, 
                  type: args.type, 
                  category: 'General', 
                  date: getTodayKey(), 
                  accountId: accounts[0]?.id || '1', 
                  tags: ['AI'] 
                });
                actionFeedback += `💰 Logged ${args.type}\n`;
                break;

              // CALENDAR
              case 'addCalendarEvent':
                await addTimeBlock({ 
                  title: args.title, 
                  startTime: args.startTime, 
                  endTime: args.endTime, 
                  date: args.date || getTodayKey(), 
                  category: 'Work', 
                  color: 'blue',
                  notes: 'Added by AI'
                });
                actionFeedback += `📅 Time blocked: ${args.title}\n`;
                break;
              case 'deleteCalendarEvent':
                await deleteTimeBlock(args.blockId);
                actionFeedback += `🗑️ Event removed\n`;
                break;

              // MEALS
              case 'planMeal':
                const targetName = (args.itemName || "").toLowerCase();
                const recipeMatch = recipes.find(r => r.title.toLowerCase().includes(targetName));
                const foodMatch = foods.find(f => f.name.toLowerCase().includes(targetName));
                
                if (recipeMatch) {
                   await assignMeal(args.date || getTodayKey(), args.mealType, recipeMatch.id, 'recipe');
                   actionFeedback += `🍳 Planned: ${recipeMatch.title}\n`;
                } else if (foodMatch) {
                   await assignMeal(args.date || getTodayKey(), args.mealType, foodMatch.id, 'food');
                   actionFeedback += `🍎 Planned: ${foodMatch.name}\n`;
                } else {
                   const newId = await addFood({
                      name: args.itemName,
                      icon: '🍽️',
                      calories: 0,
                      protein: 0,
                      carbs: 0,
                      fat: 0,
                      servingSize: '1 serving',
                      category: 'General',
                      isFavorite: false
                   });
                   await assignMeal(args.date || getTodayKey(), args.mealType, newId, 'food');
                   actionFeedback += `🆕 Added & Planned: ${args.itemName}\n`;
                }
                break;
              case 'addToShoppingList':
                await addToShoppingList([{ 
                  id: Date.now().toString(), 
                  name: args.item, 
                  amount: 1, 
                  unit: 'pc', 
                  category: 'Other', 
                  checked: false, 
                  isCustom: true 
                }]);
                actionFeedback += `🛒 Added to list: ${args.item}\n`;
                break;

              // DEEN
              case 'logPrayer':
                await updatePrayerStatus(args.prayerName, args.isDone);
                actionFeedback += `🤲 Prayer logged: ${args.prayerName}\n`;
                break;

              // JOURNAL
              case 'addJournalEntry':
                await addJournal({ 
                  title: 'AI Entry', 
                  content: `<p>${args.content}</p>`, 
                  mood: args.mood || 'neutral', 
                  energyLevel: 5, 
                  date: new Date().toISOString(), 
                  tags: ['AI'], 
                  isFavorite: false, 
                  isLocked: false 
                });
                actionFeedback += `📔 Saved to journal\n`;
                break;

              // SLEEP
              case 'logSleep':
                const today = getTodayKey();
                const start = new Date(`${today}T${args.bedTime}`);
                const end = new Date(`${today}T${args.wakeTime}`);
                if (end < start) end.setDate(end.getDate() + 1);
                const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                
                await addSleepLog({ 
                  date: today, 
                  bedTime: start.toISOString(), 
                  wakeTime: end.toISOString(), 
                  durationMinutes: duration, 
                  qualityRating: args.quality || 75, 
                  mood: 'normal', 
                  factors: [], 
                  naps: [] 
                });
                actionFeedback += `😴 Sleep logged\n`;
                break;
            }
          } catch (e) {
            console.error(e);
            actionFeedback += `❌ Could not complete: ${call.name}\n`;
          }
        }
      }

      if (actionFeedback) {
        setMessages(prev => [...prev, { role: 'model', text: actionFeedback, type: 'action' }]);
      }

      let responseText = response.text || "";
      if (responseText.trim()) {
         setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      } else if (!actionFeedback) {
         setMessages(prev => [...prev, { role: 'model', text: "All done!", type: 'text' }]);
      }

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting. Please try again in a moment.", isError: true }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* --- THE PULSING ORB TRIGGER (Themed) --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] group cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-16 h-16">
             {/* Outer Glow Ring */}
             <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full blur-lg opacity-40 group-hover:opacity-80 animate-pulse transition-opacity duration-500" />
             {/* Core */}
             <div className="relative w-14 h-14 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-primary-200 dark:border-primary-800 rounded-full flex items-center justify-center text-primary-600 shadow-2xl overflow-hidden transition-transform group-hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-500/10 to-transparent rotate-45" />
                <Sparkles size={24} strokeWidth={2} className="relative z-10" />
             </div>
          </div>
        </button>
      )}

      {/* --- HOLOGRAPHIC INTERFACE (Themed) --- */}
      {isOpen && (
        <div 
          className={`fixed z-[100] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 ring-1 ring-black/5
            ${isExpanded 
              ? 'inset-2 sm:inset-6 rounded-[2.5rem] bg-white dark:bg-[#09090b]' 
              : 'bottom-6 right-6 w-[90vw] sm:w-[420px] h-[650px] rounded-[2rem] bg-white dark:bg-[#09090b]'
            }
          `}
        >
          {/* Futuristic Header */}
          <div className="px-6 py-5 flex justify-between items-center bg-white dark:bg-[#09090b] border-b border-gray-100 dark:border-gray-800 relative shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-sm tracking-wider uppercase">LifeOS Coach</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                   <span className="text-[10px] text-green-600 dark:text-green-400 font-mono tracking-widest">ONLINE</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                
                {/* Message Header (for Model) */}
                {msg.role === 'model' && (
                   <div className="flex items-center gap-2 mb-1.5 px-1">
                      {msg.type === 'action' ? <Terminal size={10} className="text-emerald-600 dark:text-green-500" /> : <Cpu size={10} className="text-primary-500" />}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{msg.type === 'action' ? 'Action Log' : 'Coach'}</span>
                   </div>
                )}

                {/* Message Content */}
                <div 
                  className={`
                    max-w-[85%] p-4 text-sm leading-relaxed backdrop-blur-md shadow-sm relative overflow-hidden
                    ${msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm font-medium' 
                      : msg.type === 'action'
                        ? 'bg-slate-50 border border-slate-200 text-emerald-700 dark:bg-black/40 dark:border-emerald-500/30 dark:text-emerald-400 font-mono text-xs rounded-xl shadow-sm'
                        : msg.isError 
                          ? 'bg-red-50 border border-red-200 text-red-600 rounded-2xl rounded-tl-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm'
                    }
                  `}
                >
                  {/* Subtle noise texture overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none mix-blend-overlay" />
                  
                  <span className="relative z-10 whitespace-pre-wrap">{msg.text}</span>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex items-center gap-2 px-1 animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Activity size={16} className="text-primary-600 dark:text-primary-400" />
                 </div>
                 <span className="text-xs font-mono text-primary-600 dark:text-primary-400/70">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#09090b] border-t border-gray-100 dark:border-gray-800 shrink-0">
             <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/30 to-primary-600/30 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative flex items-center bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
                   <div className="pl-4 text-gray-400">
                      <Terminal size={16} />
                   </div>
                   <input 
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={handleKeyPress}
                     placeholder="Ask me anything..."
                     className="flex-1 bg-transparent border-none px-4 py-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 outline-none font-medium"
                     autoFocus
                   />
                   <button 
                     onClick={handleSend}
                     disabled={!input.trim() || isThinking}
                     className="mr-2 p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                   >
                      <ChevronRight size={18} strokeWidth={3} />
                   </button>
                </div>
             </div>
             <p className="text-[9px] text-center text-gray-400 dark:text-gray-500 mt-3 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                <Zap size={8} fill="currentColor" /> LifeOS Neural Engine v1.0
             </p>
          </div>
        </div>
      )}
    </>
  );
};
