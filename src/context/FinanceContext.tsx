import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Account, Transaction, Category, Goal, Card, DerivedData } from '../types';
import { useFinanceCalculations } from '../hooks/useFinanceCalculations';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: Card[];
  modules: any[];
  recurringTransactions: any[];
  forecasts: any[];
  derivedData: DerivedData;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  
  // Modules
  activateModule: (slug: string, isTrial?: boolean) => Promise<void>;
  deactivateModule: (slug: string) => Promise<void>;
  
  // Recurring Transactions
  createRecurringTransaction: (data: any) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  
  // Forecasts
  createForecast: (data: any) => Promise<void>;
  deleteForecast: (id: string) => Promise<void>;
  
  // Transactions
  createTransaction: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  reconcileTransaction: (id: string) => Promise<void>;
  
  // Accounts
  createAccount: (data: any) => Promise<void>;
  updateAccount: (id: number, data: any) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  
  // Goals
  createGoal: (data: any) => Promise<void>;
  updateGoal: (id: number, data: any) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  
  // Cards
  createCard: (data: any) => Promise<void>;
  updateCard: (id: number, data: any) => Promise<void>;
  deleteCard: (id: number) => Promise<void>;
  
  // Categories
  createCategory: (data: any) => Promise<void>;
  updateCategory: (id: number, data: any) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Recalculate
  recalculateAccountBalance: (id: number) => Promise<void>;

  // Crypto
  createCryptoTransaction: (data: any) => Promise<void>;

  // Investments
  createInvestmentTransaction: (data: any) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [cryptoTransactions, setCryptoTransactions] = useState<any[]>([]);
  const [investmentAssets, setInvestmentAssets] = useState<any[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [accRes, transRes, catRes, goalsRes, cardsRes, coreRes, modRes, recRes, foreRes, cryptoAssetsRes, cryptoTransRes, invAssetsRes, invTransRes] = await Promise.all([
        fetch('/api/accounts', { headers }),
        fetch('/api/transactions', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/cards', { headers }),
        fetch('/api/finance/core-stats', { headers }),
        fetch('/api/modules', { headers }),
        fetch('/api/recurring-transactions', { headers }),
        fetch('/api/forecasts', { headers }),
        fetch('/api/crypto/assets', { headers }),
        fetch('/api/crypto/transactions', { headers }),
        fetch('/api/investments/assets', { headers }),
        fetch('/api/investments/transactions', { headers })
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (cardsRes.ok) setCards(await cardsRes.json());
      if (coreRes.ok) setCoreStats(await coreRes.json());
      if (modRes.ok) setModules(await modRes.json());
      if (recRes.ok) setRecurringTransactions(await recRes.json());
      if (foreRes.ok) setForecasts(await foreRes.json());
      if (cryptoAssetsRes.ok) setCryptoAssets(await cryptoAssetsRes.json());
      if (cryptoTransRes.ok) setCryptoTransactions(await cryptoTransRes.json());
      if (invAssetsRes.ok) setInvestmentAssets(await invAssetsRes.json());
      if (invTransRes.ok) setInvestmentTransactions(await invTransRes.json());
    } catch (error) {
      console.error('Erro ao sincronizar dados financeiros:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const [coreStats, setCoreStats] = useState<any>(null);

  // Função para forçar a data a ser interpretada localmente, ignorando o fuso horário
  const getLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Cálculos Centralizados (Elimina redundância de API e lógica)
  const derivedData = useFinanceCalculations({
    accounts,
    transactions,
    categories,
    goals,
    cards,
    coreStats,
    cryptoAssets,
    cryptoTransactions,
    investmentAssets,
    investmentTransactions
  });

  const apiAction = useCallback(async (url: string, method: string, body?: any) => {
    if (!token) return;
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Erro ao realizar operação ${method} em ${url}`);
      }
      
      // Retornar o resultado para atualizações otimistas ou uso imediato
      return await res.json();
    } catch (error) {
      console.error(`Erro na operação ${method} em ${url}:`, error);
      throw error;
    }
  }, [token]);

  // Debounced refreshData para evitar múltiplas chamadas simultâneas
  const debouncedRefreshData = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshData();
      }, 300); // Aguarda 300ms após a última chamada
    };
  }, [refreshData])();

  const deleteTransaction = async (id: string) => {
    await apiAction(`/api/transactions/${id}`, 'DELETE');
    setTransactions(prev => prev.filter(t => t.id !== id));
    debouncedRefreshData();
  };

  const reconcileTransaction = async (id: string) => {
    await apiAction(`/api/transactions/${id}/reconcile`, 'PATCH');
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'reconciled' } : t));
    debouncedRefreshData();
  };
  
  const updateTransaction = async (id: string, data: any) => {
    await apiAction(`/api/transactions/${id}`, 'PUT', data);
    debouncedRefreshData();
  };
  
  const createTransaction = async (data: any) => {
    await apiAction('/api/transactions', 'POST', data);
    debouncedRefreshData();
  };
  
  const createAccount = async (data: any) => {
    await apiAction('/api/accounts', 'POST', data);
    debouncedRefreshData();
  };
  
  const updateAccount = async (id: number, data: any) => {
    await apiAction(`/api/accounts/${id}`, 'PUT', data);
    debouncedRefreshData();
  };
  
  const deleteAccount = async (id: number) => {
    await apiAction(`/api/accounts/${id}`, 'DELETE');
    setAccounts(prev => prev.filter(a => a.id !== id));
    debouncedRefreshData();
  };

  const recalculateAccountBalance = async (id: number) => {
    await apiAction(`/api/accounts/${id}/recalculate`, 'POST');
    debouncedRefreshData();
  };
  
  const createGoal = async (data: any) => {
    await apiAction('/api/goals', 'POST', data);
    debouncedRefreshData();
  };
  
  const updateGoal = async (id: number, data: any) => {
    await apiAction(`/api/goals/${id}`, 'PUT', data);
    debouncedRefreshData();
  };
  
  const deleteGoal = async (id: number) => {
    await apiAction(`/api/goals/${id}`, 'DELETE');
    setGoals(prev => prev.filter(g => g.id !== id));
    debouncedRefreshData();
  };
  
  const createCard = async (data: any) => {
    await apiAction('/api/cards', 'POST', data);
    debouncedRefreshData();
  };
  
  const updateCard = async (id: number, data: any) => {
    await apiAction(`/api/cards/${id}`, 'PUT', data);
    debouncedRefreshData();
  };
  
  const deleteCard = async (id: number) => {
    await apiAction(`/api/cards/${id}`, 'DELETE');
    setCards(prev => prev.filter(c => c.id !== id));
    debouncedRefreshData();
  };
  
  const createCategory = async (data: any) => {
    await apiAction('/api/categories', 'POST', data);
    debouncedRefreshData();
  };
  
  const updateCategory = async (id: number, data: any) => {
    await apiAction(`/api/categories/${id}`, 'PUT', data);
    debouncedRefreshData();
  };
  
  const deleteCategory = async (id: number) => {
    await apiAction(`/api/categories/${id}`, 'DELETE');
    setCategories(prev => prev.filter(c => c.id !== id));
    debouncedRefreshData();
  };

  const createRecurringTransaction = async (data: any) => {
    await apiAction('/api/recurring-transactions', 'POST', data);
    debouncedRefreshData();
  };

  const deleteRecurringTransaction = async (id: string) => {
    await apiAction(`/api/recurring-transactions/${id}`, 'DELETE');
    debouncedRefreshData();
  };

  const createForecast = async (data: any) => {
    await apiAction('/api/forecasts', 'POST', data);
    debouncedRefreshData();
  };

  const deleteForecast = async (id: string) => {
    await apiAction(`/api/forecasts/${id}`, 'DELETE');
    debouncedRefreshData();
  };

  const createCryptoTransaction = async (data: any) => {
    await apiAction('/api/crypto/transactions', 'POST', data);
    debouncedRefreshData();
  };

  const createInvestmentTransaction = async (data: any) => {
    await apiAction('/api/investments/transactions', 'POST', data);
    debouncedRefreshData();
  };

  const activateModule = async (slug: string, isTrial: boolean = true) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/modules/${slug}/activate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isTrial })
      });
      if (res.ok) {
        await refreshData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao ativar módulo');
      }
    } catch (error) {
      console.error('Erro ao ativar módulo:', error);
      throw error;
    }
  };

  const deactivateModule = async (slug: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/modules/${slug}/deactivate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await refreshData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao desativar módulo');
      }
    } catch (error) {
      console.error('Erro ao desativar módulo:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (token) {
      refreshData();
    } else {
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setGoals([]);
      setCards([]);
    }
  }, [token, refreshData]);

  return (
    <FinanceContext.Provider value={{ 
      accounts, 
      transactions, 
      categories, 
      goals, 
      cards,
      modules,
      recurringTransactions,
      forecasts,
      derivedData,
      isLoading, 
      refreshData,
      activateModule,
      deactivateModule,
      createRecurringTransaction,
      deleteRecurringTransaction,
      createForecast,
      deleteForecast,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      reconcileTransaction,
      createAccount,
      updateAccount,
      deleteAccount,
      recalculateAccountBalance,
      createGoal,
      updateGoal,
      deleteGoal,
      createCard,
      updateCard,
      deleteCard,
      createCategory,
      updateCategory,
      deleteCategory,
      createCryptoTransaction,
      createInvestmentTransaction
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
