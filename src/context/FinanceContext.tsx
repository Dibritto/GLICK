import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Account, Transaction, Category, Goal, Card, DerivedData } from '../types';
import { useFinanceCalculations } from '../hooks/useFinanceCalculations';
import { cryptoPriceService } from '../services/cryptoPriceService';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: Card[];
  debts: any[];
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

  // Debts
  createDebt: (data: any) => Promise<void>;
  simulatePayoff: (extraMonthly: number, strategy: string) => Promise<any>;

  // Crypto
  createCryptoTransaction: (data: any) => Promise<void>;
  updateCryptoAsset: (id: number, data: any) => Promise<void>;
  deleteCryptoAsset: (id: number) => Promise<void>;
  deleteCryptoTransaction: (id: number) => Promise<void>;
  updateCryptoTransaction: (id: number, data: any) => Promise<void>;

  // Investments
  createInvestmentTransaction: (data: any) => Promise<void>;
  updateInvestmentAsset: (id: number, data: any) => Promise<void>;
  deleteInvestmentAsset: (id: number) => Promise<void>;
  deleteInvestmentTransaction: (id: number) => Promise<void>;
  updateInvestmentTransaction: (id: number, data: any) => Promise<void>;
  apiAction: (url: string, method: string, body?: any) => Promise<any>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const EMPTY_ARRAY: any[] = [];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const fetchApi = async (url: string) => {
    if (!token) throw new Error('No token');
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Fetch failed for ${url}`);
    const json = await res.json();
    return json.success !== undefined ? json.data : json;
  };

  const { data: accounts = EMPTY_ARRAY, isLoading: isLoadingAccounts } = useQuery({ queryKey: ['accounts'], queryFn: () => fetchApi('/api/accounts'), enabled: !!token });
  const { data: transactions = EMPTY_ARRAY, isLoading: isLoadingTransactions } = useQuery({ queryKey: ['transactions'], queryFn: () => fetchApi('/api/transactions'), enabled: !!token });
  const { data: categories = EMPTY_ARRAY, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: () => fetchApi('/api/categories'), enabled: !!token });
  const { data: goals = EMPTY_ARRAY, isLoading: isLoadingGoals } = useQuery({ queryKey: ['goals'], queryFn: () => fetchApi('/api/goals'), enabled: !!token });
  const { data: cards = EMPTY_ARRAY, isLoading: isLoadingCards } = useQuery({ queryKey: ['cards'], queryFn: () => fetchApi('/api/cards'), enabled: !!token });
  const { data: debts = EMPTY_ARRAY, isLoading: isLoadingDebts } = useQuery({ queryKey: ['debts'], queryFn: () => fetchApi('/api/debts'), enabled: !!token });
  const { data: coreStats = null, isLoading: isLoadingCoreStats } = useQuery({ queryKey: ['coreStats'], queryFn: () => fetchApi('/api/finance/core-stats'), enabled: !!token });
  const { data: chartDataApi = null, isLoading: isLoadingChartData } = useQuery({ queryKey: ['chartData'], queryFn: () => fetchApi('/api/finance/chart-data'), enabled: !!token });
  const { data: modules = EMPTY_ARRAY, isLoading: isLoadingModules } = useQuery({ queryKey: ['modules'], queryFn: () => fetchApi('/api/modules'), enabled: !!token });
  const { data: recurringTransactions = EMPTY_ARRAY, isLoading: isLoadingRecurring } = useQuery({ queryKey: ['recurringTransactions'], queryFn: () => fetchApi('/api/recurring-transactions'), enabled: !!token });
  const { data: forecasts = EMPTY_ARRAY, isLoading: isLoadingForecasts } = useQuery({ queryKey: ['forecasts'], queryFn: () => fetchApi('/api/forecasts'), enabled: !!token });
  const { data: cryptoAssets = EMPTY_ARRAY, isLoading: isLoadingCryptoAssets } = useQuery({ queryKey: ['cryptoAssets'], queryFn: () => fetchApi('/api/crypto/assets'), enabled: !!token });
  const { data: cryptoTransactions = EMPTY_ARRAY, isLoading: isLoadingCryptoTx } = useQuery({ queryKey: ['cryptoTransactions'], queryFn: () => fetchApi('/api/crypto/transactions'), enabled: !!token });
  const { data: investmentAssets = EMPTY_ARRAY, isLoading: isLoadingInvAssets } = useQuery({ queryKey: ['investmentAssets'], queryFn: () => fetchApi('/api/investments/assets'), enabled: !!token });
  const { data: investmentTransactions = EMPTY_ARRAY, isLoading: isLoadingInvTx } = useQuery({ queryKey: ['investmentTransactions'], queryFn: () => fetchApi('/api/investments/transactions'), enabled: !!token });

  const isLoading = isLoadingAccounts || isLoadingTransactions || isLoadingCategories || isLoadingGoals || isLoadingCards || isLoadingDebts || isLoadingCoreStats || isLoadingChartData || isLoadingModules || isLoadingRecurring || isLoadingForecasts || isLoadingCryptoAssets || isLoadingCryptoTx || isLoadingInvAssets || isLoadingInvTx;

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Conecta ao mesmo host/porta
    const socket = io();

    socket.on('connect', () => {
      console.log('🔗 Conectado ao WebSocket');
      socket.emit('join-user-room', user.id);
    });

    socket.on('transaction-processed', (data) => {
      console.log('⚡ Transação processada via WS:', data);
      refreshData();
    });

    socket.on('bill-closed', (data) => {
      console.log('⚡ Fatura fechada via WS:', data);
      refreshData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, refreshData]);

  // Função para forçar a data a ser interpretada localmente, ignorando o fuso horário
  const getLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Provedor de preços em tempo real
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const USD_TO_BRL = 5.16;

  useEffect(() => {
    const updatePrices = () => {
      const prices: Record<string, number> = {};
      cryptoAssets.forEach((asset: any) => {
        const priceUSD = cryptoPriceService.getCurrentPrice(asset.symbol);
        if (priceUSD) {
          prices[asset.symbol] = priceUSD * USD_TO_BRL;
        }
      });
      setCryptoPrices(prices);
    };

    updatePrices();
    const interval = setInterval(updatePrices, 30000); // Polling a cada 30s
    return () => clearInterval(interval);
  }, [cryptoAssets]);

  // Cálculos Centralizados (Elimina redundância de API e lógica)
  const derivedData = useFinanceCalculations({
    accounts,
    transactions,
    categories,
    goals,
    cards,
    debts,
    coreStats,
    chartDataApi,
    cryptoAssets,
    cryptoTransactions,
    investmentAssets,
    investmentTransactions,
    cryptoPrices
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
      const json = await res.json();
      return json.success !== undefined ? json.data : json;
    } catch (error) {
      console.error(`Erro na operação ${method} em ${url}:`, error);
      throw error;
    }
  }, [token]);

  const invalidate = (keys: string[]) => {
    keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const deleteTransaction = async (id: string) => {
    await apiAction(`/api/transactions/${id}`, 'DELETE');
    invalidate(['transactions', 'accounts', 'coreStats']);
  };

  const reconcileTransaction = async (id: string) => {
    await apiAction(`/api/transactions/${id}/reconcile`, 'PATCH');
    invalidate(['transactions', 'accounts', 'coreStats']);
  };
  
  const updateTransaction = async (id: string, data: any) => {
    await apiAction(`/api/transactions/${id}`, 'PUT', data);
    invalidate(['transactions', 'accounts', 'coreStats']);
  };
  
  const createTransaction = async (data: any) => {
    await apiAction('/api/transactions', 'POST', data);
    invalidate(['transactions', 'accounts', 'coreStats']);
  };
  
  const createAccount = async (data: any) => {
    await apiAction('/api/accounts', 'POST', data);
    invalidate(['accounts', 'coreStats']);
  };
  
  const updateAccount = async (id: number, data: any) => {
    await apiAction(`/api/accounts/${id}`, 'PUT', data);
    invalidate(['accounts', 'coreStats']);
  };
  
  const deleteAccount = async (id: number) => {
    await apiAction(`/api/accounts/${id}`, 'DELETE');
    invalidate(['accounts', 'coreStats', 'transactions']);
  };

  const recalculateAccountBalance = async (id: number) => {
    await apiAction(`/api/accounts/${id}/recalculate`, 'POST');
    invalidate(['accounts', 'coreStats']);
  };
  
  const createGoal = async (data: any) => {
    await apiAction('/api/goals', 'POST', data);
    invalidate(['goals']);
  };
  
  const updateGoal = async (id: number, data: any) => {
    await apiAction(`/api/goals/${id}`, 'PUT', data);
    invalidate(['goals']);
  };
  
  const deleteGoal = async (id: number) => {
    await apiAction(`/api/goals/${id}`, 'DELETE');
    invalidate(['goals']);
  };
  
  const createCard = async (data: any) => {
    await apiAction('/api/cards', 'POST', data);
    invalidate(['cards']);
  };
  
  const updateCard = async (id: number, data: any) => {
    await apiAction(`/api/cards/${id}`, 'PUT', data);
    invalidate(['cards']);
  };
  
  const deleteCard = async (id: number) => {
    await apiAction(`/api/cards/${id}`, 'DELETE');
    invalidate(['cards']);
  };
  
  const createCategory = async (data: any) => {
    await apiAction('/api/categories', 'POST', data);
    invalidate(['categories']);
  };
  
  const updateCategory = async (id: number, data: any) => {
    await apiAction(`/api/categories/${id}`, 'PUT', data);
    invalidate(['categories']);
  };
  
  const deleteCategory = async (id: number) => {
    await apiAction(`/api/categories/${id}`, 'DELETE');
    invalidate(['categories']);
  };

  const createDebt = async (data: any) => {
    await apiAction('/api/debts', 'POST', data);
    invalidate(['debts', 'transactions', 'coreStats']);
  };

  const simulatePayoff = async (extraMonthly: number, strategy: string) => {
    return await apiAction('/api/debts/simulate', 'POST', { extra_monthly: extraMonthly, strategy });
  };

  const createRecurringTransaction = async (data: any) => {
    await apiAction('/api/recurring-transactions', 'POST', data);
    invalidate(['recurringTransactions']);
  };

  const deleteRecurringTransaction = async (id: string) => {
    await apiAction(`/api/recurring-transactions/${id}`, 'DELETE');
    invalidate(['recurringTransactions']);
  };

  const createForecast = async (data: any) => {
    await apiAction('/api/forecasts', 'POST', data);
    invalidate(['forecasts']);
  };

  const deleteForecast = async (id: string) => {
    await apiAction(`/api/forecasts/${id}`, 'DELETE');
    invalidate(['forecasts']);
  };

  const createCryptoTransaction = async (data: any) => {
    await apiAction('/api/crypto/transactions', 'POST', data);
    invalidate(['cryptoTransactions', 'cryptoAssets', 'coreStats']);
  };

  const updateCryptoAsset = async (id: number, data: any) => {
    await apiAction(`/api/crypto/assets/${id}`, 'PUT', data);
    invalidate(['cryptoAssets', 'coreStats']);
  };

  const deleteCryptoAsset = async (id: number) => {
    await apiAction(`/api/crypto/assets/${id}`, 'DELETE');
    invalidate(['cryptoAssets', 'cryptoTransactions', 'coreStats']);
  };

  const deleteCryptoTransaction = async (id: number) => {
    await apiAction(`/api/crypto/transactions/${id}`, 'DELETE');
    invalidate(['cryptoTransactions', 'cryptoAssets', 'coreStats']);
  };

  const updateCryptoTransaction = async (id: number, data: any) => {
    await apiAction(`/api/crypto/transactions/${id}`, 'PUT', data);
    invalidate(['cryptoTransactions', 'cryptoAssets', 'coreStats']);
  };

  const createInvestmentTransaction = async (data: any) => {
    await apiAction('/api/investments/transactions', 'POST', data);
    invalidate(['investmentTransactions', 'investmentAssets', 'coreStats']);
  };

  const updateInvestmentAsset = async (id: number, data: any) => {
    await apiAction(`/api/investments/assets/${id}`, 'PUT', data);
    invalidate(['investmentAssets', 'coreStats']);
  };

  const deleteInvestmentAsset = async (id: number) => {
    await apiAction(`/api/investments/assets/${id}`, 'DELETE');
    invalidate(['investmentAssets', 'investmentTransactions', 'coreStats']);
  };

  const deleteInvestmentTransaction = async (id: number) => {
    await apiAction(`/api/investments/transactions/${id}`, 'DELETE');
    invalidate(['investmentTransactions', 'investmentAssets', 'coreStats']);
  };

  const updateInvestmentTransaction = async (id: number, data: any) => {
    await apiAction(`/api/investments/transactions/${id}`, 'PUT', data);
    invalidate(['investmentTransactions', 'investmentAssets', 'coreStats']);
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

  return (
    <FinanceContext.Provider value={{ 
      accounts, 
      transactions, 
      categories, 
      goals, 
      cards,
      debts,
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
      createDebt,
      simulatePayoff,
      createCryptoTransaction,
      updateCryptoAsset,
      deleteCryptoAsset,
      deleteCryptoTransaction,
      updateCryptoTransaction,
      createInvestmentTransaction,
      updateInvestmentAsset,
      deleteInvestmentAsset,
      deleteInvestmentTransaction,
      updateInvestmentTransaction,
      apiAction
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
