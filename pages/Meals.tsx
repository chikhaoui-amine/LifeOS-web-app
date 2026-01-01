
import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, ChefHat, ShoppingBasket, Plus, Sparkles, 
  Droplets, Clock, UtensilsCrossed, Edit2, Minus, Apple, Search, BarChart2
} from 'lucide-react';
import { useMeals } from '../context/MealContext';
import { useSettings } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import { PlannerGrid } from '../components/meals/PlannerGrid';
import { RecipeCard } from '../components/meals/RecipeCard';
import { FoodCard } from '../components/meals/FoodCard';
import { ShoppingList } from '../components/meals/ShoppingList';
import { RecipeDetail } from '../components/meals/RecipeDetail';
import { RecipeForm } from '../components/meals/RecipeForm';
import { FoodForm } from '../components/meals/FoodForm';
import { AIChefModal } from '../components/meals/AIChefModal';
import { WaterGoalModal } from '../components/meals/WaterGoalModal';
import { MealChoiceModal } from '../components/meals/MealChoiceModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { LineChart } from '../components/Charts';
import { Recipe, Food, MealType, LanguageCode } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { getTodayKey } from '../utils/dateUtils';

const Meals: React.FC = () => {
  const { 
    recipes, 
    foods,
    mealPlans,
    loading, 
    toggleFavoriteRecipe, 
    toggleFavoriteFood,
    assignMeal, 
    generateListFromPlan, 
    deleteRecipe, 
    deleteFood,
    addRecipe,
    addFood,
    updateFood,
    trackWater,
    getMealPlanForDate
  } = useMeals();
  
  const { settings, updateSettings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [viewMode, setViewMode] = useState<'plan' | 'recipes' | 'foods' | 'shop'>('plan');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [activeDate, setActiveDate] = useState(getTodayKey());
  
  // Modal States
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [isAIChefOpen, setIsAIChefOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<{ date: string, type: MealType } | null>(null);
  const [aiGeneratedData, setAiGeneratedData] = useState<Partial<Recipe> | null>(null);
  const [isSelectingForPlan, setIsSelectingForPlan] = useState<{ date: string, type: MealType } | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const activePlan = useMemo(() => getMealPlanForDate(activeDate), [activeDate, mealPlans, getMealPlanForDate]);
  const waterGoal = settings.meals?.waterGoal || 8;

  const filteredRecipes = useMemo(() => 
    recipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())), 
  [recipes, searchQuery]);

  const filteredFoods = useMemo(() => 
    foods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())), 
  [foods, searchQuery]);

  // --- Chart Logic: Weekly View (Sun-Sat) ---
  const chartStartDate = useMemo(() => {
      const parts = activeDate.split('-').map(Number);
      // Create date at local midnight
      const current = new Date(parts[0], parts[1] - 1, parts[2]);
      
      const day = current.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = current.getDate() - day; // Adjust to Sunday
      return new Date(current.setDate(diff));
  }, [activeDate]);

  const hydrationData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(chartStartDate);
        d.setDate(d.getDate() + i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayPlan = getMealPlanForDate(dateKey);
        return dayPlan.waterIntake;
    });
  }, [chartStartDate, getMealPlanForDate, mealPlans]); // Added mealPlans dependency to auto-update

  const hydrationLabels = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(chartStartDate);
        d.setDate(d.getDate() + i);
        return d.toLocaleDateString(settings?.preferences?.language || 'en', { weekday: 'short' });
    });
  }, [chartStartDate, settings?.preferences?.language]);

  const selectedIndex = useMemo(() => {
      const parts = activeDate.split('-').map(Number);
      const selected = new Date(parts[0], parts[1] - 1, parts[2]);
      return selected.getDay(); // 0 (Sun) - 6 (Sat)
  }, [activeDate]);

  const handleChartSelect = (index: number) => {
      const d = new Date(chartStartDate);
      d.setDate(d.getDate() + index);
      setActiveDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  if (loading) return <LoadingSkeleton count={3} />;

  const handleRecipeClick = (recipe: Recipe) => {
    if (isSelectingForPlan) {
       assignMeal(isSelectingForPlan.date, isSelectingForPlan.type, recipe.id, 'recipe');
       setIsSelectingForPlan(null);
       setViewMode('plan');
    } else {
       setSelectedRecipe(recipe);
    }
  };

  const handleFoodClick = (food: Food) => {
    if (isSelectingForPlan) {
       assignMeal(isSelectingForPlan.date, isSelectingForPlan.type, food.id, 'food');
       setIsSelectingForPlan(null);
       setViewMode('plan');
    } else {
       setEditingFood(food);
       setIsFoodFormOpen(true);
    }
  };

  const handleSaveRecipe = async (data: Omit<Recipe, 'id'>) => {
    await addRecipe(data);
    setIsRecipeFormOpen(false);
    setAiGeneratedData(null);
  };

  const handleSaveFood = async (data: Omit<Food, 'id'>) => {
    if (editingFood) {
      await updateFood(editingFood.id, data);
    } else {
      await addFood(data);
    }
    setIsFoodFormOpen(false);
    setEditingFood(null);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setConfirmConfig({
      isOpen: true,
      title: t.common.delete,
      message: `Are you sure you want to delete ${recipe.title}?`,
      onConfirm: async () => {
        await deleteRecipe(recipe.id);
        if (selectedRecipe?.id === recipe.id) setSelectedRecipe(null);
      }
    });
  };

  const handleDeleteFood = (food: Food) => {
    setConfirmConfig({
      isOpen: true,
      title: t.common.delete,
      message: `Are you sure you want to delete ${food.name}?`,
      onConfirm: async () => {
        await deleteFood(food.id);
        setIsFoodFormOpen(false);
        setEditingFood(null);
      }
    });
  };

  const handleGenerateList = () => {
     const today = new Date().toISOString().split('T')[0];
     generateListFromPlan(today, 7);
     setViewMode('shop');
  };

  const handleSaveWater = (newIntake: number, newGoal: number) => {
    const diff = newIntake - activePlan.waterIntake;
    trackWater(activeDate, diff);
    updateSettings({ meals: { ...settings.meals, waterGoal: newGoal } });
  };

  // Convert glasses to liters (approx 250ml per glass)
  const liters = (activePlan.waterIntake * 0.25).toFixed(2);
  const progressPercent = Math.min(100, (activePlan.waterIntake / waterGoal) * 100);

  // Styling for cards
  const cardClass = "bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3 capitalize">
             <UtensilsCrossed className="text-orange-500" size={24} sm-size={32} /> 
             {isSelectingForPlan ? `Select ${isSelectingForPlan.type}` : t.meals.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">{t.meals.subtitle}</p>
        </div>
        
        <div className="flex bg-white dark:bg-gray-800 p-1 sm:p-1.5 rounded-2xl sm:rounded-[1.25rem] border border-gray-100 dark:border-gray-700 shadow-sm self-start overflow-x-auto no-scrollbar max-w-full">
           <button 
             onClick={() => { setViewMode('plan'); setIsSelectingForPlan(null); }} 
             className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'plan' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
           >
              <CalendarDays size={16} sm-size={18} /> {t.meals.plan}
           </button>
           <button 
             onClick={() => setViewMode('recipes')} 
             className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'recipes' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
           >
              <ChefHat size={16} sm-size={18} /> {t.meals.recipes}
           </button>
           <button 
             onClick={() => setViewMode('foods')} 
             className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'foods' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
           >
              <Apple size={16} sm-size={18} /> Foods
           </button>
           <button 
             onClick={() => { setViewMode('shop'); setIsSelectingForPlan(null); }} 
             className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'shop' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
           >
              <ShoppingBasket size={16} sm-size={18} /> {t.meals.groceries}
           </button>
        </div>
      </header>

      {viewMode === 'plan' && (
         <div className="space-y-6 sm:space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
               
               {/* Hydration Interactive Card */}
               <div className={`${cardClass} p-5 sm:p-8 flex flex-col gap-4 sm:gap-6 justify-between h-full`}>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                           <Droplets size={24} sm-size={28} className="animate-pulse" />
                        </div>
                        <div>
                           <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Hydration</h4>
                           <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {liters} Liters • Goal: {waterGoal}
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsWaterModalOpen(true)}
                        className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        title="Edit Manually"
                     >
                        <Edit2 size={16} sm-size={18} />
                     </button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                     <div className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                     
                     <button 
                        onClick={() => trackWater(activeDate, -1)}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all active:scale-90 z-10"
                     >
                        <Minus size={20} sm-size={24} strokeWidth={3} />
                     </button>
                     
                     <div className="text-center z-10">
                        <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-none tabular-nums">{activePlan.waterIntake}</span>
                        <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-tighter block mt-1">Glasses</span>
                     </div>

                     <button 
                        onClick={() => trackWater(activeDate, 1)}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-10"
                     >
                        <Plus size={20} sm-size={24} strokeWidth={3} />
                     </button>
                  </div>
               </div>

               {/* Hydration Trends Chart */}
               <div className={`${cardClass} p-6 flex flex-col h-full bg-[image:radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]`}>
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                           <BarChart2 size={18} sm-size={20} className="text-blue-500" /> Hydration Trends
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Weekly Overview</p>
                     </div>
                  </div>
                  <LineChart 
                    data={hydrationData} 
                    labels={hydrationLabels}
                    goalValue={waterGoal}
                    color="#3b82f6"
                    height={160}
                    onSelect={handleChartSelect}
                    selectedIndex={selectedIndex}
                  />
               </div>
            </section>

            {/* Sync Button & Grid */}
            <div className="space-y-4">
               <div className="flex justify-between items-end px-2">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Weekly Schedule</h3>
                  <button 
                     onClick={handleGenerateList}
                     className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
                  >
                     <ShoppingBasket size={16} /> Sync Groceries
                  </button>
               </div>

               <PlannerGrid 
                  onAddMeal={(date, type) => { setIsChoiceModalOpen({ date, type }); }} 
                  onRemoveMeal={(date, type) => assignMeal(date, type, null)}
                  onViewRecipe={(id) => { const r = recipes.find(x=>x.id===id); if(r) setSelectedRecipe(r); }}
                  activeDate={activeDate}
                  onDateSelect={setActiveDate}
               />
            </div>
         </div>
      )}

      {(viewMode === 'recipes' || viewMode === 'foods') && (
         <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            {/* Search Bar */}
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text"
                 placeholder={`Search ${viewMode === 'recipes' ? 'recipes' : 'foods'}...`}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 sm:py-4 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-sm sm:text-base"
               />
            </div>

            {viewMode === 'recipes' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                 {filteredRecipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onClick={() => handleRecipeClick(recipe)}
                      onFavorite={() => toggleFavoriteRecipe(recipe.id)}
                      onDelete={() => handleDeleteRecipe(recipe)}
                    />
                 ))}
                 
                 {!searchQuery && !isSelectingForPlan && (
                   <>
                     <button 
                       onClick={() => { setAiGeneratedData(null); setIsRecipeFormOpen(true); }}
                       className="bg-white/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group"
                     >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
                           <Plus size={32} sm-size={40} className="text-gray-300 group-hover:text-orange-500" />
                        </div>
                        <span className="font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Add Custom Recipe</span>
                     </button>

                     <button 
                       onClick={() => setIsAIChefOpen(true)}
                       className="bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800/50 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] text-gray-400 hover:text-orange-600 hover:border-orange-400 hover:bg-orange-100/30 dark:hover:bg-orange-900/20 transition-all group"
                     >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-md border border-orange-100 dark:border-orange-900 group-hover:scale-110 transition-transform">
                           <Sparkles size={32} sm-size={40} className="text-orange-400 group-hover:text-orange-600" />
                        </div>
                        <span className="font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs text-orange-600/70 group-hover:text-orange-600">AI Chef Generator</span>
                     </button>
                   </>
                 )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                 {filteredFoods.map(food => (
                    <FoodCard 
                      key={food.id} 
                      food={food} 
                      onClick={() => handleFoodClick(food)}
                      onFavorite={() => toggleFavoriteFood(food.id)}
                      onDelete={() => handleDeleteFood(food)}
                    />
                 ))}
                 
                 {!searchQuery && !isSelectingForPlan && (
                   <button 
                     onClick={() => { setEditingFood(null); setIsFoodFormOpen(true); }}
                     className="bg-white/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                   >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-3 sm:mb-4 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
                         <Plus size={28} sm-size={32} className="text-gray-300 group-hover:text-blue-500" />
                      </div>
                      <span className="font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Add Quick Food</span>
                   </button>
                 )}
              </div>
            )}
         </div>
      )}

      {viewMode === 'shop' && <ShoppingList />}

      {selectedRecipe && (
         <RecipeDetail 
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onEdit={() => { setIsRecipeFormOpen(true); }}
            onDelete={() => handleDeleteRecipe(selectedRecipe)}
         />
      )}

      {isRecipeFormOpen && (
         <RecipeForm 
            initialData={selectedRecipe || aiGeneratedData || {}}
            onSave={handleSaveRecipe}
            onClose={() => { setIsRecipeFormOpen(false); setSelectedRecipe(null); setAiGeneratedData(null); }}
         />
      )}

      {isFoodFormOpen && (
         <FoodForm 
            initialData={editingFood || {}}
            onSave={handleSaveFood}
            onClose={() => { setIsFoodFormOpen(false); setEditingFood(null); }}
         />
      )}

      {isAIChefOpen && (
        <AIChefModal 
          onRecipeGenerated={(data) => { setAiGeneratedData(data); setIsAIChefOpen(false); setIsRecipeFormOpen(true); }}
          onClose={() => setIsAIChefOpen(false)}
        />
      )}

      {isWaterModalOpen && (
        <WaterGoalModal 
          currentIntake={activePlan.waterIntake}
          currentGoal={waterGoal}
          onSave={handleSaveWater}
          onClose={() => setIsWaterModalOpen(false)}
        />
      )}

      {isChoiceModalOpen && (
        <MealChoiceModal 
          mealType={isChoiceModalOpen.type}
          date={isChoiceModalOpen.date}
          onChoose={(choice) => {
             setIsSelectingForPlan(isChoiceModalOpen);
             setViewMode(choice === 'recipe' ? 'recipes' : 'foods');
             setIsChoiceModalOpen(null);
          }}
          onClose={() => setIsChoiceModalOpen(null)}
        />
      )}

      <ConfirmationModal 
         isOpen={confirmConfig.isOpen}
         title={confirmConfig.title}
         message={confirmConfig.message}
         onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
         onConfirm={confirmConfig.onConfirm}
         type="danger"
         confirmText={t.common.delete}
      />

    </div>
  );
};

export default Meals;
