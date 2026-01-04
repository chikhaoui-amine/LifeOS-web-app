
import { LucideIcon } from 'lucide-react';

export interface NavRoute {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export type LanguageCode = 'en' | 'ar' | 'es' | 'fr';

export type FrequencyType = 'daily' | 'weekly' | 'once';
export type HabitType = 'boolean' | 'counter' | 'timer';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  type: HabitType;
  goal: number;
  unit: string;
  frequency: {
    type: FrequencyType;
    days: number[];
  };
  completedDates: string[]; // List of dates where goal was met
  progress: Record<string, number>; // New: Detailed progress per date
  archived: boolean;
  createdAt: string;
  reminders: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueTime?: string;
  category: string;
  tags: string[];
  subtasks: Subtask[];
  completedAt?: string;
  createdAt: string;
}

// --- VISION BOARD SYSTEM ---

export type VisionItemType = 'image' | 'quote' | 'goal_ref' | 'affirmation' | 'sticker' | 'shape';

export interface VisionItem {
  id: string;
  type: VisionItemType;
  content: string; // Image URL, Text, or Icon Name
  caption?: string; // For images
  subContent?: string; // Author for quotes or progress for goals
  
  // Legacy Grid Props
  width: '1' | '2'; 
  height: '1' | '2' | '3'; 
  
  // New Free-Form Props
  x?: number;
  y?: number;
  widthPx?: number;
  heightPx?: number;
  rotation?: number;
  zIndex?: number;
  opacity?: number;
  scale?: number;

  color?: string; // Main color identifier (e.g., 'indigo', '#fff')
  
  // Rich Styling Props
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  linkedGoalId?: string;
  createdAt: string;
}

// --- TIME BLOCKING SYSTEM ---

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  duration: number;  // minutes (calculated helper)
  date: string;      // YYYY-MM-DD
  category: string;
  color: string;
  completed: boolean;
  notes?: string;
}

export const TIME_BLOCK_CATEGORIES = [
  { name: 'Deep Work', color: '#6366f1', icon: '🧠' }, // Indigo
  { name: 'Meeting', color: '#f59e0b', icon: '🤝' },   // Amber
  { name: 'Chore', color: '#10b981', icon: '🧹' },     // Emerald
  { name: 'Health', color: '#ef4444', icon: '💪' },    // Red
  { name: 'Learning', color: '#ec4899', icon: '📚' },  // Pink
  { name: 'Break', color: '#6b7280', icon: '☕' },     // Gray
  { name: 'Creative', color: '#8b5cf6', icon: '🎨' },  // Violet
  { name: 'Finance', color: '#22c55e', icon: '💰' },   // Green
  { name: 'Family', color: '#f43f5e', icon: '❤️' },    // Rose
  { name: 'Social', color: '#0ea5e9', icon: '🗣️' },    // Sky
  { name: 'Admin', color: '#64748b', icon: '📂' },     // Slate
  { name: 'Other', color: '#3b82f6', icon: '🔹' },     // Blue
];

// --- MEAL PLANNER SYSTEM ---

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string; // produce, dairy, meat, pantry, etc.
  checked?: boolean; // For shopping list
}

export interface Recipe {
  id: string;
  title: string;
  image?: string; // URL or Base64
  icon?: string; // Emoji
  description: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  difficulty: Difficulty;
  cuisine: string;
  tags: string[]; // vegan, keto, quick, etc.
  ingredients: Ingredient[];
  instructions: string[]; // Step by step
  rating: number; // 1-5
  isFavorite: boolean;
  sourceUrl?: string;
  notes?: string;
}

export interface Food {
  id: string;
  name: string;
  icon: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize: string; // e.g. "1 medium", "100g"
  category: string;
  isFavorite: boolean;
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  breakfast?: string; // ID with prefix "recipe:" or "food:"
  lunch?: string;
  dinner?: string;
  snack?: string;
  waterIntake: number; // glasses (250ml)
  caloriesConsumed?: number;
}

export interface ShoppingListItem extends Ingredient {
  recipeId?: string; // Which recipe this came from
  isCustom?: boolean;
}

// --- SLEEP TRACKER SYSTEM ---

export type SleepQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
export type SleepMood = 'refreshed' | 'normal' | 'groggy' | 'tired' | 'anxious';

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD (Date of waking up)
  bedTime: string; // ISO String
  wakeTime: string; // ISO String
  durationMinutes: number; // Total minutes slept
  qualityRating: number; // 1-100
  mood: SleepMood;
  factors: string[]; // e.g. 'caffeine', 'exercise', 'stress', 'late_meal'
  dreams?: string;
  naps: NapLog[];
  notes?: string;
}

export interface NapLog {
  id: string;
  startTime: string; // ISO String
  durationMinutes: number;
  type: 'power' | 'recovery' | 'procrastination';
}

export interface SleepSettings {
  targetHours: number; // The Ideal Goal
  minHours: number;    // The "Danger Zone" threshold
  bedTimeGoal: string; // HH:mm
  wakeTimeGoal: string; // HH:mm
  windDownMinutes: number;
}

// --- GOALS SYSTEM ---

export type GoalTimeFrame = 'long-term' | 'mid-term' | 'short-term' | 'quarterly' | 'monthly';
export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
export type GoalType = 'milestone' | 'numeric' | 'habit';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalNote {
  id: string;
  content: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  timeFrame: GoalTimeFrame;
  startDate: string;
  targetDate: string;
  type: GoalType;
  currentValue: number;
  targetValue: number;
  unit?: string;
  priority: 'low' | 'medium' | 'high';
  status: GoalStatus;
  motivation?: string;
  milestones: GoalMilestone[];
  notes: GoalNote[];
  tags: string[];
  color: string;
  coverImage?: string;
  linkedHabitIds: string[];
  createdAt: string;
  completedAt?: string;
}

// --- JOURNAL SYSTEM ---

export type MoodType = 'happy' | 'calm' | 'neutral' | 'sad' | 'angry' | 'anxious' | 'excited' | 'grateful' | 'tired';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  plainText: string;
  date: string;
  mood: MoodType;
  energyLevel: number;
  tags: string[];
  isFavorite: boolean;
  isLocked: boolean;
  securityPin?: string;
  images?: string[];
  weather?: string;
  location?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  content: string;
  prompts: string[];
  icon: string;
}

// --- FINANCE SYSTEM ---

export type TransactionType = 'income' | 'expense' | 'savings';
export type AccountType = 'checking' | 'savings' | 'credit' | 'wallet' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isExcludedFromTotal: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  accountId: string;
  toAccountId?: string;
  tags: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon: string;
}

// --- ISLAMIC SYSTEM ---

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface DailyPrayers {
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  fajrQadha?: boolean;
  dhuhrQadha?: boolean;
  asrQadha?: boolean;
  maghribQadha?: boolean;
  ishaQadha?: boolean;
  sunnahFajr?: boolean;
  sunnahDhuhr?: boolean;
  sunnahAsr?: boolean;
  sunnahMaghrib?: boolean;
  sunnahIsha?: boolean;
  witr?: boolean;
  tahajjud?: boolean;
  duha?: boolean;
}

export interface QuranProgress {
  completedRubus: number[]; 
  lastReadDate: string;
  khatamCount: number;
}

export interface AdhkarProgress {
  date: string;
  morningCompleted: boolean;
  eveningCompleted: boolean;
  nightCompleted: boolean;
  morningCount: number;
  eveningCount: number;
  nightCount: number;
}

export interface IslamicSettings {
  calculationMethod: 'ISNA' | 'MWL' | 'Makkah' | 'Karachi' | 'Tehran' | 'Egypt' | 'Jafari';
  asrMethod: 'Standard' | 'Hanafi';
  hijriAdjustment: number;
  location: {
    lat: number;
    lng: number;
    city?: string;
  };
}

// --- WEEKLY REPORTS SYSTEM ---

export interface WeeklyReportContent {
  type: 'WEEKLY_REPORT';
  weekRange: string; // YYYY-MM-DD → YYYY-MM-DD
  title: string;
  overallTone: 'positive' | 'neutral' | 'corrective' | 'recovery';
  summary: string;
  wins: string[];
  challenges: string[];
  patterns: string[];
  fixes: string[];
  nextWeekFocus: string[];
  coachNote: string;
  confidence: number;
}

export interface WeeklyReport {
  id: string;
  weekRange: string;
  createdAt: string;
  content: WeeklyReportContent;
}

// --- DIGITAL WELLNESS SYSTEM ---

/**
 * Fix: Added missing export for BlockMode
 */
export type BlockMode = 'none' | 'focus';

/**
 * Fix: Added missing export for BlockedApp
 */
export interface BlockedApp {
  id: string;
  name: string;
  url: string;
  category: string;
  isBlocked: boolean;
}

/**
 * Fix: Added missing export for WellnessSettings
 */
export interface WellnessSettings {
  strictMode: boolean;
  strictModeEndTime?: string;
  emergencyUnlockUsed: boolean;
}

export interface AppSettings {
  notifications: {
    enabled: boolean;
    habits: boolean;
    tasks: boolean;
    dailySummary: boolean;
    morningTime: string;
    eveningTime: string;
  };
  preferences: {
    language: LanguageCode;
    startOfWeek: 'sunday' | 'monday';
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
    timeFormat: '12h' | '24h';
    autoBackup: boolean;
    enableIslamicFeatures: boolean;
    reportDay: number; // 0-6 (Sun-Sat)
  };
  disabledModules: string[];
  islamic?: IslamicSettings;
  sleep?: SleepSettings;
  scratchpad?: string;
  meals?: {
    waterGoal: number;
  };
}

export interface BackupData {
  version: string;
  appVersion: string;
  exportDate: string;
  settings: AppSettings;
  habits: Habit[];
  habitCategories?: string[];
  tasks: Task[];
  goals?: Goal[];
  journal?: JournalEntry[];
  visionBoard?: VisionItem[];
  prayers?: DailyPrayers[];
  quran?: QuranProgress;
  adhkar?: AdhkarProgress[];
  islamicSettings?: IslamicSettings;
  finance?: {
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    currency: string;
  };
  meals?: {
    recipes: Recipe[];
    foods: Food[];
    mealPlans: MealPlanDay[];
    shoppingList: ShoppingListItem[];
  };
  sleepLogs?: SleepLog[];
  sleepSettings?: SleepSettings;
  timeBlocks?: TimeBlock[];
  reports?: WeeklyReport[];
  customThemes?: Theme[];
}

export type NotificationType = 'habit' | 'task' | 'summary' | 'achievement' | 'streak';

// --- THEME SYSTEM ---

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export interface Theme {
  id: string;
  name: string;
  type: ThemeMode;
  colors: ThemeColors;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  font: 'Inter' | 'Roboto' | 'Poppins' | 'Serif' | 'Mono';
  isCustom?: boolean;
}

export interface ThemeContextType {
  currentTheme: Theme;
  savedThemes: Theme[];
  applyTheme: (theme: Theme) => void;
  updateThemePrimaryColor: (color: string) => void;
  saveCustomTheme: (theme: Theme) => void;
  deleteCustomTheme: (id: string) => void;
  exportTheme: (theme: Theme) => string;
  importTheme: (json: string) => boolean;
  resetToDefault: () => void;
}
