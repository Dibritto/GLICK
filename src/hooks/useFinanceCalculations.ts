import { useMemo } from 'react';
import { Account, Transaction, Category, Goal, Card } from '../types';

// Função para forçar a data a ser interpretada localmente, ignorando o fuso horário
const getLocalDate = (dateString: string) => {
  if (!dateString) return new Date();
  // Se for uma string ISO completa (ex: 2026-03-25T00:00:00.000Z), pegamos apenas a parte da data
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

export const useFinanceCalculations = ({
  accounts,
  transactions,
  categories,
  goals,
  cards,
  coreStats,
  chartDataApi,
  cryptoAssets,
  cryptoTransactions,
  investmentAssets,
  investmentTransactions
}: {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: Card[];
  coreStats: any;
  chartDataApi?: any;
  cryptoAssets: any[];
  cryptoTransactions: any[];
  investmentAssets: any[];
  investmentTransactions: any[];
}) => {
  console.log('[CALCULATIONS] Input data:', {
    accounts: accounts.length,
    transactions: transactions.length,
    categories: categories.length,
    goals: goals.length,
    cards: cards.length,
    coreStats: !!coreStats
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Transaction Filtering & Basic Aggregation
  const {
    confirmedTransactions,
    pendingTransactions,
    monthlyTransactions,
    monthlyIncome,
    monthlyExpenses,
    totalIncome,
    totalExpense,
    prevMonthIncome,
    prevMonthExpense,
    last30DaysExpenses
  } = useMemo(() => {
    const confirmed = transactions.filter(t => t.status === 'confirmed' || t.status === 'reconciled');
    const pending = transactions.filter(t => t.status === 'pending');
    
    const monthly = transactions.filter(t => {
      const d = getLocalDate(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const pm = prevMonthDate.getMonth();
    const py = prevMonthDate.getFullYear();
    
    const prevMonthTrans = transactions.filter(t => {
      const td = getLocalDate(t.date);
      return td.getMonth() === pm && td.getFullYear() === py;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const last30DaysExp = transactions
      .filter(t => 
        t.type === 'expense' && 
        (t.status === 'confirmed' || t.status === 'reconciled') && 
        getLocalDate(t.date) >= thirtyDaysAgo &&
        t.category !== 'Pagamento de Fatura' &&
        t.category !== 'Aporte em Meta' &&
        t.category !== 'Investimentos'
      )
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      confirmedTransactions: confirmed,
      pendingTransactions: pending,
      monthlyTransactions: monthly,
      monthlyIncome: monthly.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0),
      monthlyExpenses: monthly.filter(t => t.type === 'expense' && t.category !== 'Pagamento de Fatura' && t.category !== 'Aporte em Meta' && t.category !== 'Investimentos').reduce((acc, curr) => acc + Number(curr.amount), 0),
      totalIncome: coreStats?.totalIncome || 0,
      totalExpense: coreStats?.totalExpense || 0,
      prevMonthIncome: prevMonthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0),
      prevMonthExpense: prevMonthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0),
      last30DaysExpenses: last30DaysExp
    };
  }, [transactions, currentMonth, currentYear]);

  // 2. Projections & Recurring
  const { predictedIncome, predictedExpense, projectedTransactions, allTransactionsSorted } = useMemo(() => {
    let pIncome = 0;
    let pExpense = 0;
    const projected: Transaction[] = [];

    const recurringTemplates = transactions.filter(t => t.recurrence && t.recurrence !== 'none');
    const uniqueTemplates = Array.from(new Map(
      recurringTemplates
        .sort((a, b) => getLocalDate(b.date).getTime() - getLocalDate(a.date).getTime())
        .map(t => [`${t.description}-${t.category}`, t])
    ).values()) as Transaction[];

    uniqueTemplates.forEach(template => {
      const alreadyHappened = monthlyTransactions.some(t => 
        t.description === template.description && 
        t.category === template.category
      );

      if (!alreadyHappened) {
        if (template.type === 'income') pIncome += Number(template.amount);
        if (template.type === 'expense') pExpense += Number(template.amount);
        
        const templateDate = getLocalDate(template.date);
        const projectedDate = new Date(currentYear, currentMonth, templateDate.getDate());
        
        projected.push({
          ...template,
          id: `projected-${template.id}`,
          status: 'pending',
          date: projectedDate.toISOString().split('T')[0]
        });
      }
    });

    pIncome += pendingTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    pExpense += pendingTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

    const allSorted = [...transactions, ...projected].sort((a, b) => 
      getLocalDate(b.date).getTime() - getLocalDate(a.date).getTime()
    );

    return { 
      predictedIncome: coreStats?.predictedIncome ?? pIncome, 
      predictedExpense: coreStats?.predictedExpense ?? pExpense, 
      projectedTransactions: projected, 
      allTransactionsSorted: allSorted 
    };
  }, [transactions, monthlyTransactions, pendingTransactions, currentMonth, currentYear, coreStats]);

  // 3. Balances & Core Metrics
  const { totalBalance, reservedBalance, investedBalance, totalCardDebt, netWorth, freeCapital, totalCardLimit, totalCardUsed } = useMemo(() => {
    if (coreStats && coreStats.totalBalance !== undefined) {
      return {
        totalBalance: coreStats.totalBalance,
        reservedBalance: coreStats.reservedBalance || 0,
        investedBalance: coreStats.investedBalance || 0,
        totalCardDebt: coreStats.totalCreditUsed || 0,
        netWorth: coreStats.netWorth || 0,
        freeCapital: coreStats.freeBalance || 0,
        totalCardLimit: coreStats.totalCreditLimit || 0,
        totalCardUsed: coreStats.totalCreditUsed || 0
      };
    }

    const tBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const rBalance = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
    const tCardDebt = cards.reduce((acc, curr) => acc + Number(curr.current_bill), 0);
    const tCardLimit = cards.reduce((acc, curr) => acc + Number(curr.limit), 0);
    const tCardUsed = cards.reduce((acc, curr) => acc + Number(curr.current_bill || 0), 0);

    const cryptoValue = cryptoAssets.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.current_price)), 0);
    const investmentValue = investmentAssets.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.current_price)), 0);
    const iBalance = cryptoValue + investmentValue;

    return {
      totalBalance: tBalance,
      reservedBalance: rBalance,
      investedBalance: iBalance,
      totalCardDebt: tCardDebt,
      netWorth: tBalance + rBalance + iBalance - tCardDebt,
      freeCapital: tBalance - tCardDebt,
      totalCardLimit: tCardLimit,
      totalCardUsed: tCardUsed
    };
  }, [accounts, goals, cards, cryptoAssets, investmentAssets, coreStats]);

  // 4. Accounts with Projections
  const accountsWithProjections = useMemo(() => {
    return accounts.map(acc => {
      const accPending = pendingTransactions.filter(t => t.account_id === acc.id || t.destination_account_id === acc.id);
      const accProjected = projectedTransactions.filter(t => t.account_id === acc.id || t.destination_account_id === acc.id);
      const allFuture = [...accPending, ...accProjected];
      
      const futureIncome = allFuture.reduce((sum, t) => {
        if (t.type === 'income' && t.account_id === acc.id) return sum + Number(t.amount);
        if (t.type === 'transfer' && t.destination_account_id === acc.id) return sum + Number(t.amount);
        return sum;
      }, 0);
      
      const futureExpense = allFuture.reduce((sum, t) => {
        if (t.type === 'expense' && t.account_id === acc.id) return sum + Number(t.amount);
        if (t.type === 'transfer' && t.account_id === acc.id) return sum + Number(t.amount);
        return sum;
      }, 0);
      
      return {
        ...acc,
        projected_balance: Number(acc.balance) + futureIncome - futureExpense
      };
    });
  }, [accounts, pendingTransactions, projectedTransactions]);

  // 5. Categories & Charts
  const { categoriesWithSpent, spendingByCategory, incomeByCategory, chartData } = useMemo(() => {
    const catWithSpent = categories.map(cat => {
      const spent = monthlyTransactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);
      return { ...cat, spent };
    });

    if (chartDataApi) {
      // Add colors to categories
      const spendingWithColors = (chartDataApi.spendingByCategory || []).map((item: any) => {
        const catInfo = categories.find(c => c.name === item.name);
        return { ...item, color: catInfo?.color || '#8E9299' };
      });

      const incomeWithColors = (chartDataApi.incomeByCategory || []).map((item: any) => {
        const catInfo = categories.find(c => c.name === item.name);
        return { ...item, color: catInfo?.color || '#00FF9F' };
      });

      return {
        categoriesWithSpent: catWithSpent,
        spendingByCategory: spendingWithColors,
        incomeByCategory: incomeWithColors,
        chartData: chartDataApi.monthlyData || []
      };
    }

    // Fallback if API fails or is loading
    const catMap: Record<string, { name: string, value: number, color: string }> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      if (!catMap[t.category]) {
        const catInfo = categories.find(c => c.name === t.category);
        catMap[t.category] = { name: t.category, value: 0, color: catInfo?.color || '#8E9299' };
      }
      catMap[t.category].value += Number(t.amount);
    });

    const incMap: Record<string, { name: string, value: number, color: string }> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      if (!incMap[t.category]) {
        const catInfo = categories.find(c => c.name === t.category);
        incMap[t.category] = { name: t.category, value: 0, color: catInfo?.color || '#00FF9F' };
      }
      incMap[t.category].value += Number(t.amount);
    });

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const cData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTrans = transactions.filter(t => {
        const td = getLocalDate(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      cData.push({
        month: monthNames[m],
        receitas: monthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0),
        despesas: monthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)
      });
    }

    return {
      categoriesWithSpent: catWithSpent,
      spendingByCategory: Object.values(catMap).sort((a, b) => b.value - a.value),
      incomeByCategory: Object.values(incMap).sort((a, b) => b.value - a.value),
      chartData: cData
    };
  }, [categories, monthlyTransactions, transactions, currentMonth, currentYear, chartDataApi]);

  // 6. Final Derived Metrics
  return useMemo(() => {
    const monthlyIncomeFinal = coreStats?.monthlyIncome ?? monthlyIncome;
    const monthlyExpensesFinal = coreStats?.monthlyExpenses ?? monthlyExpenses;
    const prevMonthIncomeFinal = coreStats?.prevMonthIncome ?? prevMonthIncome;
    const prevMonthExpenseFinal = coreStats?.prevMonthExpense ?? prevMonthExpense;

    const moneyVelocity = coreStats?.moneyVelocity ?? (monthlyIncomeFinal > 0 ? (monthlyExpensesFinal / monthlyIncomeFinal).toFixed(2) : '0.00');
    const retentionRate = coreStats?.retentionRate ?? (monthlyIncomeFinal > 0 ? Math.round(((monthlyIncomeFinal - monthlyExpensesFinal) / monthlyIncomeFinal) * 100) : 0);
    const dailyAverageSpending = last30DaysExpenses / 30;
    const financialAutonomy = dailyAverageSpending > 0 ? Math.floor(freeCapital / dailyAverageSpending) : 0;
    const weeklyBurnRate = last30DaysExpenses / 4;
    
    const incomeChange = prevMonthIncomeFinal > 0 ? ((monthlyIncomeFinal - prevMonthIncomeFinal) / prevMonthIncomeFinal) * 100 : 0;
    const expenseChange = prevMonthExpenseFinal > 0 ? ((monthlyExpensesFinal - prevMonthExpenseFinal) / prevMonthExpenseFinal) * 100 : 0;
    
    const pendingIncome = pendingTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const pendingExpense = pendingTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const completedGoalsCount = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

    return {
      accounts: accountsWithProjections,
      totalBalance: coreStats?.totalBalance ?? totalBalance,
      reservedBalance: coreStats?.reservedBalance ?? reservedBalance,
      investedBalance: coreStats?.investedBalance ?? investedBalance,
      committedBalance: coreStats?.committedBalance ?? (totalCardDebt + pendingExpense),
      totalCardDebt,
      netWorth: coreStats?.netWorth ?? netWorth,
      freeCapital: coreStats?.freeBalance ?? freeCapital,
      monthlyIncome: monthlyIncomeFinal,
      monthlyExpenses: monthlyExpensesFinal,
      predictedIncome,
      predictedExpense,
      projectedBalance: coreStats?.projectedBalance ?? (totalBalance + pendingIncome - pendingExpense + predictedIncome - predictedExpense),
      pendingIncome,
      pendingExpense,
      moneyVelocity: moneyVelocity,
      retentionRate,
      dailyAverageSpending: coreStats?.dailyAverageSpend ?? dailyAverageSpending,
      dailyAverageSpend: coreStats?.dailyAverageSpend ?? dailyAverageSpending,
      financialAutonomy: coreStats?.financialAutonomy ?? financialAutonomy,
      weeklyBurnRate,
      chartData,
      spendingByCategory,
      incomeByCategory,
      projectedTransactions,
      confirmedTransactions,
      pendingTransactions,
      allTransactionsSorted,
      totalCardLimit,
      totalCardUsed,
      completedGoalsCount,
      totalIncome,
      totalExpense,
      incomeChange,
      expenseChange,
      cardsWithDynamicBill: cards,
      goalsWithDynamicAmount: goals,
      categoriesWithSpent,
      coreStats: coreStats ? {
        totalBalance: coreStats.totalBalance,
        reservedBalance: coreStats.reservedBalance,
        investedBalance: coreStats.investedBalance,
        committedBalance: coreStats.committedBalance,
        freeBalance: coreStats.freeBalance,
        dailyAverageSpend: coreStats.dailyAverageSpend,
        financialAutonomy: coreStats.financialAutonomy,
        projectedBalance: coreStats.projectedBalance,
        monthlyIncome: coreStats.monthlyIncome,
        monthlyExpenses: coreStats.monthlyExpenses,
        moneyVelocity: coreStats.moneyVelocity,
        retentionRate: coreStats.retentionRate,
        predictedIncome: coreStats.predictedIncome,
        predictedExpense: coreStats.predictedExpense,
        prevMonthIncome: coreStats.prevMonthIncome,
        prevMonthExpense: coreStats.prevMonthExpense
      } : undefined,
      cryptoAssets,
      cryptoTransactions,
      investmentAssets,
      investmentTransactions
    };
  }, [
    accountsWithProjections, totalBalance, reservedBalance, investedBalance, totalCardDebt, netWorth, freeCapital,
    monthlyIncome, monthlyExpenses, predictedIncome, predictedExpense, chartData, spendingByCategory, incomeByCategory,
    projectedTransactions, confirmedTransactions, pendingTransactions, allTransactionsSorted,
    totalCardLimit, totalCardUsed, totalIncome, totalExpense,
    cards, goals, categoriesWithSpent, coreStats, cryptoAssets, cryptoTransactions, investmentAssets, investmentTransactions,
    last30DaysExpenses, prevMonthIncome, prevMonthExpense
  ]);
};
