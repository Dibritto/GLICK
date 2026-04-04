export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'confirmed' | 'pending' | 'reconciled';
export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  initial_balance: number;
  projected_balance?: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account_id: number;
  account_name?: string;
  card_name?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reconciled?: number;
  destination_account_id?: number;
  recurrence?: RecurrenceType;
  card_id?: number | null;
  goal_id?: number | null;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  budget: number;
  spent: number;
  color: string;
  icon: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
}

export interface Card {
  id: number;
  name: string;
  account_id: number;
  account_name?: string;
  brand: string;
  limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  current_bill: number;
  interest_rate?: number;
}

export interface CryptoAsset {
  id: number;
  name: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
}

export interface CryptoTransaction {
  id: number;
  asset_id: number;
  symbol: string;
  name: string;
  type: 'buy' | 'sell' | 'transfer';
  quantity: number;
  price_at_time: number;
  fee: number;
  date: string;
  account_id?: number;
}

export interface InvestmentAsset {
  id: number;
  name: string;
  symbol: string;
  type: 'fixed_income' | 'stocks' | 'funds' | 'real_estate';
  quantity: number;
  average_price: number;
  current_price: number;
}

export interface InvestmentTransaction {
  id: number;
  asset_id: number;
  symbol: string;
  name: string;
  asset_type: 'fixed_income' | 'stocks' | 'funds' | 'real_estate';
  type: 'buy' | 'sell' | 'yield' | 'dividend';
  quantity: number;
  price_at_time: number;
  fee: number;
  date: string;
  account_id?: number;
}

export interface DerivedData {
  accounts: Account[];
  totalBalance: number;
  reservedBalance: number;
  committedBalance: number;
  totalCardDebt: number;
  netWorth: number;
  freeCapital: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  predictedIncome: number;
  predictedExpense: number;
  projectedBalance: number;
  pendingIncome: number;
  pendingExpense: number;
  moneyVelocity: string | number;
  retentionRate: number;
  dailyAverageSpending: number;
  dailyAverageSpend: number;
  financialAutonomy: number;
  weeklyBurnRate: number;
  chartData: { month: string; receitas: number; despesas: number }[];
  spendingByCategory: { name: string; value: number; color: string }[];
  incomeByCategory: { name: string; value: number; color: string }[];
  projectedTransactions: Transaction[];
  confirmedTransactions: Transaction[];
  pendingTransactions: Transaction[];
  allTransactionsSorted: Transaction[];
  totalCardLimit: number;
  totalCardUsed: number;
  projectedCardInterest: number;
  completedGoalsCount: number;
  totalIncome: number;
  totalExpense: number;
  investedBalance: number;
  cryptoValue: number;
  investmentValue: number;
  incomeChange: number;
  expenseChange: number;
  cardsWithDynamicBill: Card[];
  goalsWithDynamicAmount: Goal[];
  categoriesWithSpent: (Category & { spent: number })[];
  coreStats?: {
    totalBalance: number;
    reservedBalance: number;
    investedBalance: number;
    committedBalance: number;
    freeBalance: number;
    dailyAverageSpend: number;
    financialAutonomy: number;
    projectedBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    moneyVelocity: number;
    retentionRate: number;
    predictedIncome: number;
    predictedExpense: number;
    prevMonthIncome: number;
    prevMonthExpense: number;
  };
  cryptoAssets: CryptoAsset[];
  cryptoTransactions: CryptoTransaction[];
  investmentAssets: InvestmentAsset[];
  investmentTransactions: InvestmentTransaction[];
}
