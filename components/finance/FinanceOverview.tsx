
import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Plus, PiggyBank, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useSettings } from '../../context/SettingsContext';
import { getTranslation } from '../../utils/translations';
import { BarChart, DonutChart } from '../Charts';
import { ConfirmationModal } from '../ConfirmationModal';
import { LanguageCode } from '../../types';

export const FinanceOverview: React.FC<{ onAddTransaction: () => void }> = ({ onAddTransaction }) => {
  const { accounts, transactions, getTotalBalance, getFormattedCurrency, deleteTransaction } = useFinance();
  const { settings } = useSettings();
  const t = useMemo(() => getTranslation((settings?.preferences?.language || 'en') as LanguageCode), [settings?.preferences?.language]);
  
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const totalBalance = getTotalBalance();
  
  // Calculate Monthly Stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const expense = monthlyTransactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const savings = income - expense;

  // Expense by Category Data
  const expensesByCategory: Record<string, number> = {};
  monthlyTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
     expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
  });

  const chartData = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([label, value], i) => ({
       label, 
       value, 
       color: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'][i % 5]
    }));

  const handleDeleteClick = (id: string) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (confirmConfig.id) {
      deleteTransaction(confirmConfig.id);
      setConfirmConfig({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
       
       {/* Main Balance Card - Compact */}
       <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10">
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{t.finance.balance}</p>
             <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">{getFormattedCurrency(totalBalance)}</h2>
             
             <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm overflow-hidden">
                   <div className="flex items-center gap-1.5 mb-1 text-green-300">
                      <div className="p-1 bg-green-500/20 rounded-full shrink-0"><TrendingUp size={12} /></div>
                      <span className="text-[10px] font-medium truncate">{t.finance.income}</span>
                   </div>
                   <p className="text-xs sm:text-sm font-bold truncate">{getFormattedCurrency(income)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm overflow-hidden">
                   <div className="flex items-center gap-1.5 mb-1 text-red-300">
                      <div className="p-1 bg-red-500/20 rounded-full shrink-0"><TrendingDown size={12} /></div>
                      <span className="text-[10px] font-medium truncate">{t.finance.expenses}</span>
                   </div>
                   <p className="text-xs sm:text-sm font-bold truncate">{getFormattedCurrency(expense)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm overflow-hidden">
                   <div className="flex items-center gap-1.5 mb-1 text-blue-300">
                      <div className="p-1 bg-blue-500/20 rounded-full shrink-0"><PiggyBank size={12} /></div>
                      <span className="text-[10px] font-medium truncate">{t.finance.savings}</span>
                   </div>
                   <p className="text-xs sm:text-sm font-bold truncate">{getFormattedCurrency(savings)}</p>
                </div>
             </div>
          </div>
       </div>

       {/* Quick Actions & Budgets */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick Add Button Area */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
             <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-1">
                <Wallet size={24} />
             </div>
             <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t.finance.trackMoney}</h3>
             <button 
               onClick={onAddTransaction}
               className="mt-1 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 text-xs sm:text-sm"
             >
                <Plus size={16} /> {t.finance.addTx}
             </button>
          </div>

          {/* Monthly Budget Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
             <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <PieChart size={16} className="text-gray-400" /> {t.finance.spending}
             </h3>
             {chartData.length > 0 ? (
                <div className="flex items-center gap-3">
                   <div className="shrink-0">
                      <DonutChart data={chartData} size={100} thickness={12} />
                   </div>
                   <div className="flex-1 space-y-1.5">
                      {chartData.slice(0, 3).map((item, i) => (
                         <div key={i} className="flex justify-between text-[10px]">
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                               {item.label}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">{getFormattedCurrency(item.value)}</span>
                         </div>
                      ))}
                   </div>
                </div>
             ) : (
                <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                   No expenses this month
                </div>
             )}
          </div>
       </div>

       {/* Recent Transactions Preview */}
       <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 px-2">{t.finance.recent}</h3>
          <div className="space-y-2">
             {transactions.slice(0, 5).map(tx => {
                const isExpense = tx.type === 'expense';
                const isSavings = tx.type === 'savings';
                return (
                   <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpense ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : isSavings ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' : 'bg-green-50 text-green-500 dark:bg-green-900/20'}`}>
                            {isExpense ? <TrendingDown size={14} /> : isSavings ? <PiggyBank size={14} /> : <TrendingUp size={14} />}
                         </div>
                         <div>
                            <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{tx.description}</p>
                            <p className="text-[10px] text-gray-500">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs sm:text-sm ${isExpense ? 'text-gray-900 dark:text-white' : isSavings ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                           {isExpense || isSavings ? '-' : '+'}{getFormattedCurrency(tx.amount)}
                        </span>
                        
                        {/* Delete Button */}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(tx.id); }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete transaction"
                        >
                           <Trash2 size={14} />
                        </button>
                      </div>
                   </div>
                )
             })}
             {transactions.length === 0 && (
                <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs">
                   No transactions yet.
                </div>
             )}
          </div>
       </div>

       <ConfirmationModal 
         isOpen={confirmConfig.isOpen}
         onClose={() => setConfirmConfig({ isOpen: false, id: null })}
         onConfirm={confirmDelete}
         title="Delete Transaction"
         message="Are you sure you want to delete this transaction?"
         type="danger"
       />
    </div>
  );
};
