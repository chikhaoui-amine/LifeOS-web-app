
import React, { useState, useMemo } from 'react';
import { 
  Activity, Moon, CheckCircle2, ListTodo, Target, Droplets, Smile, DollarSign, Calendar, ChevronLeft, ChevronRight, BarChart3, Star, Sparkles
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';
import { useJournal } from '../context/JournalContext';
import { useFinance } from '../context/FinanceContext';
import { useMeals } from '../context/MealContext';
import { useSleep } from '../context/SleepContext';
import { useIslamic } from '../context/IslamicContext';
import { useSettings } from '../context/SettingsContext';
import { LineChart, MultiLineChart } from '../components/Charts';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDateKey } from '../utils/dateUtils';

const Statistics: React.FC = () => {
  // Contexts
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { entries: journal } = useJournal();
  const { transactions } = useFinance();
  const { mealPlans } = useMeals();
  const { logs: sleepLogs, loading: sleepLoading } = useSleep();
  const { adhkar, prayers } = useIslamic();
  const { settings } = useSettings();

  // State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  // Helpers
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate strictly the days of the selected month (1 to 28/29/30/31)
  const daysInMonth = useMemo(() => {
    const days = [];
    // Get the number of days in the month
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let i = 1; i <= lastDay; i++) {
        days.push(new Date(selectedYear, selectedMonth, i));
    }
    return days;
  }, [selectedYear, selectedMonth]);

  const labels = daysInMonth.map(d => d.getDate().toString());

  // --- Data Aggregation Logic ---

  // 1. Sleep Curve (Duration in Hours)
  const sleepData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      const log = sleepLogs.find(l => l.date === key);
      return log ? Number((log.durationMinutes / 60).toFixed(1)) : 0;
    });
  }, [sleepLogs, daysInMonth]);

  // 2. Completed Habits Count
  const habitsData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      return habits.filter(h => h.completedDates.includes(key)).length;
    });
  }, [habits, daysInMonth]);

  // 3. Completed Tasks Count
  const tasksData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      // Fallback: if completedAt is missing but completed is true, use dueDate
      return tasks.filter(t => 
        t.completed && 
        (t.completedAt?.startsWith(key) || (!t.completedAt && t.dueDate === key))
      ).length;
    });
  }, [tasks, daysInMonth]);

  // 4. Goal Advancement (Proxy: Habits linked to goals completed)
  const goalsData = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'in-progress' || g.status === 'completed');
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      let progressPoints = 0;
      
      // Count completed habits that are linked to goals
      habits.forEach(h => {
        if (h.completedDates.includes(key)) {
           const isLinked = activeGoals.some(g => g.linkedHabitIds?.includes(h.id));
           if (isLinked) progressPoints++;
        }
      });
      return progressPoints;
    });
  }, [goals, habits, daysInMonth]);

  // 5. Hydration (Water Intake)
  const hydrationData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      const plan = mealPlans.find(p => p.date === key);
      return plan ? plan.waterIntake : 0;
    });
  }, [mealPlans, daysInMonth]);

  // 6. Mood (1-10) & Journal Existence
  const moodMap: Record<string, number> = { 
    happy: 9, excited: 10, grateful: 8, calm: 7, neutral: 5, 
    tired: 4, anxious: 3, sad: 2, angry: 1 
  };
  const moodData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      // Check for exact date match (ignoring time)
      const entry = journal.find(j => j.date.startsWith(key));
      return entry ? (moodMap[entry.mood] || 5) : 0;
    });
  }, [journal, daysInMonth]);

  // 7. Adhkar Completion
  const adhkarData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      const dayAdhkar = adhkar.find(a => a.date === key);
      if (!dayAdhkar) return 0;
      return (dayAdhkar.morningCompleted ? 1 : 0) + 
             (dayAdhkar.eveningCompleted ? 1 : 0) + 
             (dayAdhkar.nightCompleted ? 1 : 0);
    });
  }, [adhkar, daysInMonth]);

  // 8. Sunnah & Nafl Count
  const sunnahData = useMemo(() => {
    return daysInMonth.map(date => {
      const key = formatDateKey(date);
      const dayPrayer = prayers.find(p => p.date === key);
      if (!dayPrayer) return 0;
      let count = 0;
      if (dayPrayer.sunnahFajr) count++;
      if (dayPrayer.sunnahDhuhr) count++;
      if (dayPrayer.sunnahAsr) count++;
      if (dayPrayer.sunnahMaghrib) count++;
      if (dayPrayer.sunnahIsha) count++;
      if (dayPrayer.witr) count++;
      if (dayPrayer.duha) count++;
      if (dayPrayer.tahajjud) count++;
      return count;
    });
  }, [prayers, daysInMonth]);

  // 9. Finance (Income, Spends, Savings)
  const financeData = useMemo(() => {
    const income: number[] = [];
    const expense: number[] = [];
    const savings: number[] = [];

    daysInMonth.forEach(date => {
      const key = formatDateKey(date);
      const dayTxs = transactions.filter(t => t.date === key);
      
      const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const daySavings = dayTxs.filter(t => t.type === 'savings').reduce((acc, t) => acc + t.amount, 0);
      
      income.push(dayIncome);
      expense.push(dayExpense);
      savings.push(daySavings);
    });

    return [
      { label: 'Income', data: income, color: '#10b981' }, // Emerald
      { label: 'Expense', data: expense, color: '#ef4444' }, // Red
      { label: 'Savings', data: savings, color: '#3b82f6' }  // Blue
    ];
  }, [transactions, daysInMonth]);

  if (sleepLoading) return <LoadingSkeleton count={4} />;

  const Widget = ({ title, icon: Icon, color, children }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full bg-[image:radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]">
       <div className="flex items-center gap-2 mb-6">
          <div className={`p-2 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
             <Icon size={18} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
       </div>
       <div className="flex-1 min-h-[180px]">
          {children}
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Controls */}
      <header>
         <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400">
            <BarChart3 size={20} />
            <h1 className="text-xl font-bold uppercase tracking-wider">Analytics Center</h1>
         </div>
         
         <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
               <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500">
                  <ChevronLeft size={16} />
               </button>
               <span className="font-bold text-lg w-16 text-center tabular-nums">{selectedYear}</span>
               <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500">
                  <ChevronRight size={16} />
               </button>
            </div>

            {/* Month Scroll */}
            <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-1 md:pb-0">
               <div className="flex gap-2">
                  {months.map((m, i) => (
                     <button
                       key={m}
                       onClick={() => setSelectedMonth(i)}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedMonth === i ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                     >
                        {m}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </header>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         
         {/* 1. Sleep */}
         <Widget title="Sleep Duration" icon={Moon} color="indigo">
            <LineChart data={sleepData} labels={labels} color="#6366f1" height={180} goalValue={settings?.sleep?.targetHours || 8} />
         </Widget>

         {/* 2. Habits */}
         <Widget title="Habit Consistency" icon={CheckCircle2} color="emerald">
            <LineChart data={habitsData} labels={labels} color="#10b981" height={180} />
         </Widget>

         {/* 3. Tasks */}
         <Widget title="Task Completion" icon={ListTodo} color="blue">
            <LineChart data={tasksData} labels={labels} color="#3b82f6" height={180} />
         </Widget>

         {/* 4. Goals */}
         <Widget title="Goal Advancement" icon={Target} color="amber">
            <LineChart data={goalsData} labels={labels} color="#f59e0b" height={180} />
         </Widget>

         {/* 5. Hydration */}
         <Widget title="Hydration" icon={Droplets} color="cyan">
            <LineChart data={hydrationData} labels={labels} color="#06b6d4" height={180} goalValue={settings?.meals?.waterGoal || 8} />
         </Widget>

         {/* 6. Mood */}
         <Widget title="Mood & Journaling" icon={Smile} color="pink">
            <LineChart data={moodData} labels={labels} color="#ec4899" height={180} />
         </Widget>

         {/* 7. Adhkar */}
         {settings?.preferences?.enableIslamicFeatures && (
            <Widget title="Daily Adhkar" icon={Sparkles} color="purple">
                <LineChart data={adhkarData} labels={labels} color="#8b5cf6" height={180} goalValue={3} />
            </Widget>
         )}

         {/* 8. Sunnah */}
         {settings?.preferences?.enableIslamicFeatures && (
            <Widget title="Sunnah Prayers" icon={Star} color="orange">
                <LineChart data={sunnahData} labels={labels} color="#f97316" height={180} goalValue={5} />
            </Widget>
         )}

         {/* 9. Finance (Multi-Line) - Spans 3 cols on large screens */}
         <div className="md:col-span-2 xl:col-span-3">
            <Widget title="Financial Flow" icon={DollarSign} color="green">
               <MultiLineChart datasets={financeData} labels={labels} height={250} />
            </Widget>
         </div>

      </div>
    </div>
  );
};

export default Statistics;
