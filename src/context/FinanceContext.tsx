import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Account, Transaction, Category, Goal, Card, DerivedData } from '../types';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: Card[];
  derivedData: DerivedData;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  
  // Transactions
  createTransaction: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Accounts
  updateAccount: (id: number, data: any) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  
  // Goals
  updateGoal: (id: number, data: any) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  
  // Cards
  updateCard: (id: number, data: any) => Promise<void>;
  deleteCard: (id: number) => Promise<void>;
  
  // Categories
  updateCategory: (id: number, data: any) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [accRes, transRes, catRes, goalsRes, cardsRes] = await Promise.all([
        fetch('/api/accounts', { headers }),
        fetch('/api/transactions', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/cards', { headers })
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (cardsRes.ok) setCards(await cardsRes.json());
    } catch (error) {
      console.error('Erro ao sincronizar dados financeiros:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Cálculos Centralizados (Elimina redundância de API e lógica)
  const derivedData = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const reservedBalance = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
    const freeCapital = totalBalance - reservedBalance;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    
    // Transações do mês atual
    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    // Projeção de Recorrência
    // Identificar transações recorrentes que ainda não aconteceram este mês
    let predictedIncome = 0;
    let predictedExpense = 0;
    const projectedTransactions: Transaction[] = [];

    // Pegar transações recorrentes únicas (por descrição e categoria)
    const recurringTemplates = transactions.filter(t => t.recurrence && t.recurrence !== 'none');
    const uniqueTemplates = Array.from(new Map(recurringTemplates.map(t => [`${t.description}-${t.category}`, t])).values()) as Transaction[];

    uniqueTemplates.forEach(template => {
      const alreadyHappened = monthlyTransactions.some(t => 
        t.description === template.description && t.category === template.category
      );

      if (!alreadyHappened) {
        if (template.type === 'income') predictedIncome += Number(template.amount);
        if (template.type === 'expense') predictedExpense += Number(template.amount);
        
        projectedTransactions.push({
          ...template,
          id: `projected-${template.id}`,
          status: 'pending',
          date: new Date(currentYear, currentMonth, new Date(template.date).getDate()).toISOString().split('T')[0]
        });
      }
    });

    // Adicionar transações pendentes explícitas ao cálculo de predição
    predictedIncome += pendingTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    predictedExpense += pendingTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

    const allTransactionsSorted = [...transactions, ...projectedTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const moneyVelocity = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome).toFixed(2) : '0.00';
    const retentionRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;

    // Telemetria de longo prazo (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30DaysExpenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'confirmed' && new Date(t.date) >= thirtyDaysAgo)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const dailyAverageSpending = last30DaysExpenses / 30;
    const financialAutonomy = dailyAverageSpending > 0 ? Math.floor(totalBalance / dailyAverageSpending) : 0;
    const weeklyBurnRate = last30DaysExpenses / 4;

    // Dados para o gráfico de fluxo de caixa (últimos 6 meses)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = monthNames[m];
      
      const monthTrans = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });

      chartData.push({
        month: label,
        receitas: monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0),
        despesas: monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)
      });
    }

    // Agrupamento por categoria para gráficos
    const categoryMap: Record<string, { name: string, value: number, color: string }> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      if (!categoryMap[t.category]) {
        const catInfo = categories.find(c => c.name === t.category);
        categoryMap[t.category] = { 
          name: t.category, 
          value: 0, 
          color: catInfo?.color || '#8E9299' 
        };
      }
      categoryMap[t.category].value += Number(t.amount);
    });

    const totalCardLimit = cards.reduce((acc, curr) => acc + Number(curr.limit), 0);
    const totalCardUsed = cards.reduce((acc, curr) => acc + Number(curr.current_bill || 0), 0);
    const completedGoalsCount = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      totalBalance,
      reservedBalance,
      freeCapital,
      monthlyIncome,
      monthlyExpenses,
      predictedIncome,
      predictedExpense,
      projectedBalance: totalBalance + predictedIncome - predictedExpense,
      moneyVelocity,
      retentionRate,
      dailyAverageSpending,
      financialAutonomy,
      weeklyBurnRate,
      chartData,
      spendingByCategory: Object.values(categoryMap).sort((a, b) => b.value - a.value),
      projectedTransactions,
      confirmedTransactions,
      pendingTransactions,
      allTransactionsSorted,
      totalCardLimit,
      totalCardUsed,
      completedGoalsCount,
      totalIncome,
      totalExpense
    };
  }, [accounts, transactions, categories, goals]);

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
      if (res.ok) {
        await refreshData();
      } else {
        const error = await res.json();
        throw new Error(error.error || `Erro ao realizar operação ${method} em ${url}`);
      }
    } catch (error) {
      console.error(`Erro na operação ${method} em ${url}:`, error);
      throw error;
    }
  }, [token, refreshData]);

  const deleteTransaction = (id: string) => apiAction(`/api/transactions/${id}`, 'DELETE');
  const updateTransaction = (id: string, data: any) => apiAction(`/api/transactions/${id}`, 'PUT', data);
  const createTransaction = (data: any) => apiAction('/api/transactions', 'POST', data);
  
  const updateAccount = (id: number, data: any) => apiAction(`/api/accounts/${id}`, 'PUT', data);
  const deleteAccount = (id: number) => apiAction(`/api/accounts/${id}`, 'DELETE');
  
  const updateGoal = (id: number, data: any) => apiAction(`/api/goals/${id}`, 'PUT', data);
  const deleteGoal = (id: number) => apiAction(`/api/goals/${id}`, 'DELETE');
  
  const updateCard = (id: number, data: any) => apiAction(`/api/cards/${id}`, 'PUT', data);
  const deleteCard = (id: number) => apiAction(`/api/cards/${id}`, 'DELETE');
  
  const updateCategory = (id: number, data: any) => apiAction(`/api/categories/${id}`, 'PUT', data);
  const deleteCategory = (id: number) => apiAction(`/api/categories/${id}`, 'DELETE');

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
      derivedData,
      isLoading, 
      refreshData,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      updateAccount,
      deleteAccount,
      updateGoal,
      deleteGoal,
      updateCard,
      deleteCard,
      updateCategory,
      deleteCategory
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
