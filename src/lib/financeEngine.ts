import db from './db.ts';

export interface CoreStats {
  totalBalance: number;
  reservedBalance: number;
  investedBalance: number;
  committedBalance: number;
  freeBalance: number;
  netWorth: number;
  dailyAverageSpend: number;
  financialAutonomy: number; // in days
  projectedBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  moneyVelocity: number;
  retentionRate: number;
  predictedIncome: number;
  predictedExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
}

export async function calculateCoreStats(userId: number, dbOrTrx: any = db): Promise<CoreStats> {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const isoToday = today.toISOString().split('T')[0];
  const isoThirtyDaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
  const isoFirstDayOfMonth = firstDayOfMonth.toISOString().split('T')[0];
  const isoLastDayOfMonth = lastDayOfMonth.toISOString().split('T')[0];
  const isoFirstDayOfPrevMonth = firstDayOfPrevMonth.toISOString().split('T')[0];
  const isoLastDayOfPrevMonth = lastDayOfPrevMonth.toISOString().split('T')[0];

  // 1. Executar todas as consultas básicas em paralelo com agregações SQL
  const [
    accountsRes,
    goalsRes,
    assetsRes,
    pendingExpenseRes,
    cardsRes,
    last30DaysExpensesRes,
    pendingIncomeRes,
    recurringIncomeRes,
    recurringExpenseRes,
    forecastsRes,
    monthlyIncomeRes,
    monthlyExpenseRes,
    prevMonthIncomeRes,
    prevMonthExpenseRes
  ] = await Promise.all([
    dbOrTrx('accounts').where('user_id', userId).sum('balance as total').first(),
    dbOrTrx('goals').where('user_id', userId).sum('current_amount as total').first(),
    dbOrTrx('assets').where('user_id', userId).select(dbOrTrx.raw('SUM(quantity * COALESCE(current_price, 0)) as total')).first(),
    dbOrTrx('transactions').where('user_id', userId).where('status', 'pending').where('type', 'expense').sum('amount as total').first(),
    dbOrTrx('cards').where('user_id', userId).sum('current_bill as total').first(),
    dbOrTrx('transactions')
      .where('user_id', userId)
      .where('type', 'expense')
      .where('status', 'confirmed')
      .whereNotIn('category', ['Pagamento de Fatura', 'Aporte em Meta', 'Investimentos'])
      .where('date', '>=', isoThirtyDaysAgo)
      .sum('amount as total').first(),
    dbOrTrx('transactions').where('user_id', userId).where('status', 'pending').where('type', 'income').sum('amount as total').first(),
    dbOrTrx('recurring_transactions').where('user_id', userId).where('next_date', '<=', isoLastDayOfMonth).where('type', 'income').sum('amount as total').first(),
    dbOrTrx('recurring_transactions').where('user_id', userId).where('next_date', '<=', isoLastDayOfMonth).where('type', 'expense').sum('amount as total').first(),
    dbOrTrx('forecasts')
      .where('user_id', userId)
      .where('forecast_date', '>=', isoToday)
      .where('forecast_date', '<=', isoLastDayOfMonth)
      .sum('projected_income as totalIncome')
      .sum('projected_expense as totalExpense')
      .first(),
    dbOrTrx('transactions')
      .where('user_id', userId)
      .where('type', 'income')
      .where('date', '>=', isoFirstDayOfMonth)
      .where('date', '<=', isoLastDayOfMonth)
      .sum('amount as total').first(),
    dbOrTrx('transactions')
      .where('user_id', userId)
      .where('type', 'expense')
      .whereNotIn('category', ['Pagamento de Fatura', 'Aporte em Meta', 'Investimentos'])
      .where('date', '>=', isoFirstDayOfMonth)
      .where('date', '<=', isoLastDayOfMonth)
      .sum('amount as total').first(),
    dbOrTrx('transactions')
      .where('user_id', userId)
      .where('type', 'income')
      .where('date', '>=', isoFirstDayOfPrevMonth)
      .where('date', '<=', isoLastDayOfPrevMonth)
      .sum('amount as total').first(),
    dbOrTrx('transactions')
      .where('user_id', userId)
      .where('type', 'expense')
      .whereNotIn('category', ['Pagamento de Fatura', 'Aporte em Meta', 'Investimentos'])
      .where('date', '>=', isoFirstDayOfPrevMonth)
      .where('date', '<=', isoLastDayOfPrevMonth)
      .sum('amount as total').first()
  ]);

  console.log(`[ENGINE] CoreStats processado via SQL para usuário ${userId}`);

  // 2. Extrair resultados
  const totalBalance = Number(accountsRes?.total || 0);
  const reservedBalance = Number(goalsRes?.total || 0);
  const investedBalance = Number(assetsRes?.total || 0);
  
  const pendingTotal = Number(pendingExpenseRes?.total || 0);
  const cardDebt = Number(cardsRes?.total || 0);
  const committedBalance = pendingTotal + cardDebt;

  const freeBalance = totalBalance - committedBalance;
  const netWorth = totalBalance + reservedBalance + investedBalance - cardDebt;

  const totalSpent30Days = Number(last30DaysExpensesRes?.total || 0);
  const dailyAverageSpend = totalSpent30Days / 30;
  const financialAutonomy = dailyAverageSpend > 0 ? Math.floor(freeBalance / dailyAverageSpend) : 0;

  const recurringTotal = Number(recurringIncomeRes?.total || 0) - Number(recurringExpenseRes?.total || 0);

  const forecastTotal = Number(forecastsRes?.totalIncome || 0) - Number(forecastsRes?.totalExpense || 0);

  const pendingNet = Number(pendingIncomeRes?.total || 0) - pendingTotal;
  const projectedBalance = totalBalance + pendingNet + recurringTotal + forecastTotal;

  const monthlyIncome = Number(monthlyIncomeRes?.total || 0);
  const monthlyExpenses = Number(monthlyExpenseRes?.total || 0);
  const moneyVelocity = monthlyIncome > 0 ? Number((monthlyExpenses / monthlyIncome).toFixed(2)) : 0;
  const retentionRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;

  const predictedIncome = Number(pendingIncomeRes?.total || 0) + Number(recurringIncomeRes?.total || 0) + Number(forecastsRes?.totalIncome || 0);
  const predictedExpense = pendingTotal + Number(recurringExpenseRes?.total || 0) + Number(forecastsRes?.totalExpense || 0);

  const prevMonthIncome = Number(prevMonthIncomeRes?.total || 0);
  const prevMonthExpense = Number(prevMonthExpenseRes?.total || 0);

  return {
    totalBalance,
    reservedBalance,
    investedBalance,
    committedBalance,
    freeBalance,
    netWorth,
    dailyAverageSpend,
    financialAutonomy,
    projectedBalance,
    monthlyIncome,
    monthlyExpenses,
    moneyVelocity,
    retentionRate,
    predictedIncome,
    predictedExpense,
    prevMonthIncome,
    prevMonthExpense
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
      if (!isNaN(nextDate.getTime())) {
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
      } else {
        console.error('Data inválida encontrada em transação recorrente:', item.next_date);
      }
    });
  }
}

export async function validateAndRegisterTransaction(userId: number, data: any) {
  // Apply Transaction Rules
  if (data.amount <= 0) throw new Error('O valor da transação deve ser maior que zero');
  if (!data.description || data.description.trim() === '') throw new Error('A descrição é obrigatória');
  if (!data.date) throw new Error('A data é obrigatória');

  const installments = Number(data.installments) || 1;
  const installmentId = installments > 1 ? `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

  return await db.transaction(async (trx) => {
    const { account_id, type, amount, status, card_id, destination_account_id, goal_id, date, description } = data;

    // 1. VALIDATE: Check if account belongs to user
    const account = await trx('accounts').where({ id: account_id, user_id: userId }).first();
    if (!account) throw new Error('Conta não encontrada ou acesso negado');

    let firstId: number | null = null;

    // Handle installments
    for (let i = 0; i < installments; i++) {
      const currentAmount = installments > 1 ? Number((amount / installments).toFixed(2)) : amount;
      
      // Calculate date for this installment
      const installmentDate = new Date(date);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      const dateStr = installmentDate.toISOString().split('T')[0];
      
      const currentDescription = installments > 1 
        ? `${description} (${i + 1}/${installments})`
        : description;

      // Determine status: if it's a future installment, it should be 'pending'
      const today = new Date().toISOString().split('T')[0];
      const currentStatus = (dateStr > today) ? 'pending' : status;

      // 2. REGISTER: Insert transaction
      const [id] = await trx('transactions').insert({
        ...data,
        user_id: userId,
        amount: currentAmount,
        date: dateStr,
        description: currentDescription,
        status: currentStatus,
        installments: installments,
        installment_id: installmentId
      });

      if (i === 0) firstId = id;

      // 3. UPDATE BALANCE: If confirmed or reconciled
      if (currentStatus === 'confirmed' || currentStatus === 'reconciled') {
        if (type === 'transfer' && destination_account_id) {
          await trx('accounts').where('id', account_id).decrement('balance', currentAmount);
          await trx('accounts').where('id', destination_account_id).increment('balance', currentAmount);
        } else if (!card_id) {
          // Normal transaction (not credit card)
          const adjustment = type === 'income' ? currentAmount : -currentAmount;
          await trx('accounts').where('id', account_id).increment('balance', adjustment);
        } else if (card_id) {
          // Credit card transaction
          if (data.category === 'Pagamento de Fatura') {
            // Paying the card bill: decreases account balance AND decreases card bill
            await trx('accounts').where('id', account_id).decrement('balance', currentAmount);
            await trx('cards').where('id', card_id).decrement('current_bill', currentAmount);
          } else {
            // Spending on card: only affects card bill
            const cardAdjustment = type === 'income' ? -currentAmount : currentAmount;
            await trx('cards').where('id', card_id).increment('current_bill', cardAdjustment);
          }
        }

        // 4. UPDATE GOAL: If goal_id is present
        if (goal_id) {
          let goalAdjustment = 0;
          if (type === 'expense') {
            if (data.category === 'Aporte em Meta') {
              goalAdjustment = currentAmount;
            } else {
              goalAdjustment = -currentAmount;
            }
          } else if (type === 'income' && data.category === 'Resgate de Meta') {
            goalAdjustment = -currentAmount;
          }
          
          if (goalAdjustment !== 0) {
            await trx('goals').where('id', goal_id).increment('current_amount', goalAdjustment);
          }
        }
      }
    }

    return firstId;
  });
}
