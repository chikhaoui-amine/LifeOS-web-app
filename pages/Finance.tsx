import React, { useState } from 'react';
import { DollarSign, LayoutDashboard, Settings } from 'lucide-react';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { TransactionForm } from '../components/finance/TransactionForm';
import { useFinance, CURRENCIES } from '../context/FinanceContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const Finance: React.FC = () => {
  const { loading, currency, setCurrency } = useFinance();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  if (loading) return <LoadingSkeleton count={3} />;

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.label.toLowerCase().includes(currencySearch.toLowerCase()) || 
    c.code.toLowerCase().includes(currencySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             Finance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Master your money, design your future.</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 relative">
           <button 
             onClick={() => setShowCurrencySelector(!showCurrencySelector)}
             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
              <Settings size={16} />
              <span>{currency}</span>
           </button>

           {showCurrencySelector && (
             <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-80">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                   <input 
                     type="text" 
                     placeholder="Search currency..." 
                     value={currencySearch}
                     onChange={(e) => setCurrencySearch(e.target.value)}
                     className="w-full px-3 py-1.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                     autoFocus
                   />
                </div>
                <div className="p-2 overflow-y-auto">
                   {filteredCurrencies.map(c => (
                     <button
                       key={c.code}
                       onClick={() => { setCurrency(c.code); setShowCurrencySelector(false); setCurrencySearch(''); }}
                       className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${currency === c.code ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     >
                        <span className="truncate mr-2">{c.label}</span>
                        <span className="font-mono text-xs opacity-50 shrink-0">{c.code}</span>
                     </button>
                   ))}
                   {filteredCurrencies.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-2">No currency found</p>
                   )}
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Content */}
      <FinanceOverview onAddTransaction={() => setIsTxModalOpen(true)} />

      {/* Modals */}
      {isTxModalOpen && (
         <TransactionForm onClose={() => setIsTxModalOpen(false)} />
      )}

    </div>
  );
};

export default Finance;