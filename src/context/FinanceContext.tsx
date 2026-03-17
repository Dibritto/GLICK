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

  // Função para forçar a data a ser interpretada localmente, ignorando o fuso horário
  const getLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Cálculos Centralizados (Elimina redundância de API e lógica)
  const derivedData = useMemo(() => {
    // Calcular progresso das metas dinamicamente
    const goalsWithDynamicAmount = goals.map(goal => {
      const goalTransactions = transactions.filter(t => t.goal_id === goal.id);
      const currentAmount = goalTransactions.reduce((acc, curr) => {
        if (curr.type === 'expense') return acc + Number(curr.amount); // Aporte na meta
        if (curr.type === 'income') return acc - Number(curr.amount); // Retirada da meta
        return acc;
      }, 0);
      return { ...goal, current_amount: currentAmount };
    });

    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const reservedBalance = goalsWithDynamicAmount.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
    const freeCapital = totalBalance; // O dinheiro já saiu da conta, então totalBalance já é o capital livre
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    
    // Transações do mês atual
    const monthlyTransactions = transactions.filter(t => {
      const d = getLocalDate(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    // Projeção de Recorrência
    // Identificar transações recorrentes que ainda não aconteceram este mês
    let predictedIncome = 0;
    let predictedExpense = 0;
    const projectedTransactions: Transaction[] = [];

    // Pegar transações recorrentes únicas (por descrição, categoria e valor aproximado)
    const recurringTemplates = transactions.filter(t => t.recurrence && t.recurrence !== 'none');
    
    // Agrupar por uma chave mais robusta para evitar fusão indevida
    const uniqueTemplates = Array.from(new Map(
      recurringTemplates.map(t => [`${t.description}-${t.category}-${t.amount}`, t])
    ).values()) as Transaction[];

    uniqueTemplates.forEach(template => {
      // Verifica se já ocorreu neste mês com base na descrição, categoria e valor
      const alreadyHappened = monthlyTransactions.some(t => 
        t.description === template.description && 
        t.category === template.category &&
        Math.abs(Number(t.amount) - Number(template.amount)) < 1 // Tolerância de 1 real
      );

      if (!alreadyHappened) {
        if (template.type === 'income') predictedIncome += Number(template.amount);
        if (template.type === 'expense') predictedExpense += Number(template.amount);
        
        const templateDate = getLocalDate(template.date);
        const projectedDate = new Date(currentYear, currentMonth, templateDate.getDate());
        
        projectedTransactions.push({
          ...template,
          id: `projected-${template.id}`,
          status: 'pending',
          date: projectedDate.toISOString().split('T')[0]
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
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const last30DaysExpenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'confirmed' && getLocalDate(t.date) >= thirtyDaysAgo)
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
        const td = getLocalDate(t.date);
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

    // Calcular faturas dos cartões dinamicamente
    const cardsWithDynamicBill = cards.map(card => {
      const cardTransactions = transactions.filter(t => t.card_id === card.id && t.type === 'expense');
      const currentBill = cardTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
      return { ...card, current_bill: currentBill };
    });

    const totalCardLimit = cardsWithDynamicBill.reduce((acc, curr) => acc + Number(curr.limit), 0);
    const totalCardUsed = cardsWithDynamicBill.reduce((acc, curr) => acc + Number(curr.current_bill || 0), 0);
    const completedGoalsCount = goalsWithDynamicAmount.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

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
      totalExpense,
      cardsWithDynamicBill,
      goalsWithDynamicAmount
    };
  }, [accounts, transactions, categories, goals, cards]);

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
      createAccount,
      updateAccount,
      deleteAccount,
      createGoal,
      updateGoal,
      deleteGoal,
      createCard,
      updateCard,
      deleteCard,
      createCategory,
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
