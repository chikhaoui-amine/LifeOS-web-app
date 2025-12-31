import React, { useState } from 'react';
import { Plus, MoreHorizontal, Wallet, CreditCard, Landmark, DollarSign, TrendingUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';

export const AccountList: React.FC = () => {
  const { accounts, addAccount, deleteAccount, getFormattedCurrency, currency } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>('checking');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName) {
       await addAccount({
          name: newAccountName,
          type: newAccountType,
          balance: parseFloat(newAccountBalance) || 0,
          currency: currency, // Use global currency
          color: 'blue',
          icon: 'wallet',
          isExcludedFromTotal: false
       });
       setIsAdding(false);
       setNewAccountName('');
       setNewAccountBalance('');
    }
  };

  const getIcon = (type: AccountType) => {
     switch(type) {
        case 'credit': return <CreditCard size={20} />;
        case 'savings': return <DollarSign size={20} />;
        case 'investment': return <TrendingUp size={20} />; 
        case 'checking': return <Landmark size={20} />;
        default: return <Wallet size={20} />;
     }
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-gray-900 dark:text-white">Your Accounts</h3>
          <button onClick={() => setIsAdding(!isAdding)} className="text-sm text-primary-600 dark:text-primary-400 font-medium">
             {isAdding ? 'Cancel' : '+ Add Account'}
          </button>
       </div>

       {isAdding && (
          <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2">
             <input 
               placeholder="Account Name" 
               value={newAccountName} 
               onChange={e => setNewAccountName(e.target.value)}
               className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
               autoFocus
             />
             <div className="flex gap-2">
               <select 
                  value={newAccountType}
                  onChange={e => setNewAccountType(e.target.value as AccountType)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
               >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="wallet">Cash Wallet</option>
               </select>
               <input 
                  type="number"
                  placeholder="Balance" 
                  value={newAccountBalance} 
                  onChange={e => setNewAccountBalance(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
               />
             </div>
             <button type="submit" className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold">Save</button>
          </form>
       )}

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map(acc => (
             <div key={acc.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group relative">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.type === 'credit' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'}`}>
                      {getIcon(acc.type)}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{acc.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{acc.type}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-gray-900 dark:text-white">{getFormattedCurrency(acc.balance)}</p>
                </div>
                
                <button 
                  type="button"
                  onClick={() => { if(confirm('Delete account?')) deleteAccount(acc.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-500 rounded transition-opacity"
                >
                   <MoreHorizontal size={14} />
                </button>
             </div>
          ))}
       </div>
    </div>
  );
};