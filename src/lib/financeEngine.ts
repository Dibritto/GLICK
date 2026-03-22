import db from './db.js';

export interface CoreStats {
  totalBalance: number;
  reservedBalance: number;
  committedBalance: number;
  freeBalance: number;
  netWorth: number;
  dailyAverageSpend: number;
  financialAutonomy: number; // in days
  projectedBalance: number;
}

export async function calculateCoreStats(userId: number): Promise<CoreStats> {
  // 1. Total Balance (Sum of all accounts)
  const accounts = await db('accounts').where('user_id', userId);
  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  // 2. Reserved Balance (Sum of current_amount in goals)
  const goals = await db('goals').where('user_id', userId);
  const reservedBalance = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);

  // 3. Committed Balance (Pending transactions + Credit card debt)
  const pendingTransactions = await db('transactions')
    .where('user_id', userId)
    .where('status', 'pending')
    .where('type', 'expense');
  
  const pendingTotal = pendingTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const cards = await db('cards').where('user_id', userId);
  const cardDebt = cards.reduce((acc, curr) => acc + Number(curr.current_bill), 0);

  const committedBalance = pendingTotal + cardDebt;

  // 4. Free Balance
  // O dinheiro das metas já saiu como despesa, então subtraímos apenas as faturas em aberto e transações pendentes
  const freeBalance = totalBalance - committedBalance;

  // Net Worth (Patrimônio Líquido)
  const netWorth = totalBalance + reservedBalance - cardDebt;

  // 5. Money Velocity (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const last30DaysExpenses = await db('transactions')
    .where('user_id', userId)
    .where('type', 'expense')
    .where('status', 'confirmed')
    .where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0]);
  
  const totalSpent30Days = last30DaysExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const dailyAverageSpend = totalSpent30Days / 30;

  // 6. Financial Autonomy
  const financialAutonomy = dailyAverageSpend > 0 ? Math.floor(freeBalance / dailyAverageSpend) : 0;

  // 7. Projected Balance (End of month)
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Pending transactions (income - expense)
  const pendingIncome = await db('transactions')
    .where('user_id', userId)
    .where('status', 'pending')
    .where('type', 'income')
    .sum('amount as total')
    .first();
  
  const pendingExpense = await db('transactions')
    .where('user_id', userId)
    .where('status', 'pending')
    .where('type', 'expense')
    .sum('amount as total')
    .first();

  // Recurring transactions due this month
  const recurringDue = await db('recurring_transactions')
    .where('user_id', userId)
    .where('next_date', '<=', lastDayOfMonth.toISOString().split('T')[0]);
  
  const recurringTotal = recurringDue.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  // Forecasts for this month
  const forecasts = await db('forecasts')
    .where('user_id', userId)
    .where('month', today.getMonth() + 1)
    .where('year', today.getFullYear());
  
  const forecastTotal = forecasts.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const projectedBalance = totalBalance + 
    (Number(pendingIncome?.total || 0) - Number(pendingExpense?.total || 0)) + 
    recurringTotal + 
    forecastTotal;

  return {
    totalBalance,
    reservedBalance,
    committedBalance,
    freeBalance,
    netWorth,
    dailyAverageSpend,
    financialAutonomy,
    projectedBalance
  };
}

export async function processRecurringTransactions(userId: number) {
  const today = new Date().toISOString().split('T')[0];
  const recurring = await db('recurring_transactions')
    .where('user_id', userId)
    .where('next_date', '<=', today);

  for (const item of recurring) {
    await db.transaction(async (trx) => {
      // Create the transaction
      await trx('transactions').insert({
        user_id: userId,
        account_id: item.account_id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        type: item.type,
        date: item.next_date,
        status: 'confirmed'
      });

      // Update account balance
      const adjustment = item.type === 'income' ? item.amount : -item.amount;
      await trx('accounts').where('id', item.account_id).increment('balance', adjustment);

      // Update goal balance if present
      if (item.goal_id) {
        let goalAdjustment = 0;
        if (item.type === 'expense') {
          if (item.category === 'Aporte em Meta') {
            goalAdjustment = item.amount;
          } else {
            goalAdjustment = -item.amount;
          }
        } else if (item.type === 'income' && item.category === 'Resgate de Meta') {
          goalAdjustment = -item.amount;
        }
        
        if (goalAdjustment !== 0) {
          await trx('goals').where('id', item.goal_id).increment('current_amount', goalAdjustment);
        }
      }

      // Calculate next date
      const nextDate = new Date(item.next_date);
      if (item.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (item.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (item.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      // Update recurring record
      await trx('recurring_transactions')
        .where('id', item.id)
        .update({ next_date: nextDate.toISOString().split('T')[0] });
    });
  }
}

export async function validateAndRegisterTransaction(userId: number, data: any) {
  // Apply Transaction Rules
  if (data.amount <= 0) throw new Error('O valor da transação deve ser maior que zero');
  if (!data.description || data.description.trim() === '') throw new Error('A descrição é obrigatória');
  if (!data.date) throw new Error('A data é obrigatória');

  return await db.transaction(async (trx) => {
    const { account_id, type, amount, status, card_id, destination_account_id, goal_id } = data;

    // 1. VALIDATE: Check if account belongs to user
    const account = await trx('accounts').where({ id: account_id, user_id: userId }).first();
    if (!account) throw new Error('Conta não encontrada ou acesso negado');

    // 2. REGISTER: Insert transaction
    const [id] = await trx('transactions').insert({
      ...data,
      user_id: userId // Ensure user_id is set
    });

    // 3. UPDATE BALANCE: If confirmed or reconciled and not credit card
    if (status === 'confirmed' || status === 'reconciled') {
      if (type === 'transfer' && destination_account_id) {
        await trx('accounts').where('id', account_id).decrement('balance', amount);
        await trx('accounts').where('id', destination_account_id).increment('balance', amount);
      } else if (!card_id) {
        const adjustment = type === 'income' ? amount : -amount;
        await trx('accounts').where('id', account_id).increment('balance', adjustment);
      } else if (card_id) {
        // Update card bill
        const cardAdjustment = type === 'income' ? -amount : amount;
        await trx('cards').where('id', card_id).increment('current_bill', cardAdjustment);
      }

      // 4. UPDATE GOAL: If goal_id is present
      if (goal_id) {
        let goalAdjustment = 0;
        if (type === 'expense') {
          if (data.category === 'Aporte em Meta') {
            goalAdjustment = amount;
          } else {
            goalAdjustment = -amount;
          }
        } else if (type === 'income' && data.category === 'Resgate de Meta') {
          goalAdjustment = -amount;
        }
        
        if (goalAdjustment !== 0) {
          await trx('goals').where('id', goal_id).increment('current_amount', goalAdjustment);
        }
      }
    }

    return id;
  });
}
