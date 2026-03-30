import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { calculateCoreStats } from '../lib/financeEngine.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getCoreStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'Usuário não autenticado', 401);

  try {
    const [coreStatsEngine, cardsResult, goalsResult, incomeResult, expenseResult] = await Promise.all([
      calculateCoreStats(userId),
      db('cards').where('user_id', userId).sum('current_bill as totalCreditUsed').sum('limit_amount as totalCreditLimit').first(),
      db('goals').where('user_id', userId).sum('target_amount as totalGoalsTarget').sum('current_amount as totalGoalsCurrent').first(),
      db('transactions')
        .where('user_id', userId)
        .where('type', 'income')
        .whereNot('category', 'Resgate de Meta')
        .sum('amount as totalIncome').first(),
      db('transactions')
        .where('user_id', userId)
        .where('type', 'expense')
        .whereNotIn('category', ['Pagamento de Fatura', 'Aporte em Meta', 'Investimentos'])
        .sum('amount as totalExpense').first()
    ]);

    return sendSuccess(res, {
      ...coreStatsEngine,
      totalCreditUsed: Number(cardsResult?.totalCreditUsed || 0),
      totalCreditLimit: Number(cardsResult?.totalCreditLimit || 0),
      totalGoalsTarget: Number(goalsResult?.totalGoalsTarget || 0),
      totalGoalsCurrent: Number(goalsResult?.totalGoalsCurrent || 0),
      totalIncome: Number(incomeResult?.totalIncome || 0),
      totalExpense: Number(expenseResult?.totalExpense || 0)
    });
  } catch (error) {
    console.error('[FINANCE_CONTROLLER] Error getting core stats:', error);
    return sendError(res, 'Erro ao buscar estatísticas principais');
  }
};

export const getChartData = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    // Current month start
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthStartStr = currentMonthStart.toISOString().split('T')[0];

    const [monthlyDataRaw, spendingByCategoryRaw, incomeByCategoryRaw] = await Promise.all([
      db('transactions')
        .where('user_id', userId)
        .where('date', '>=', sixMonthsAgoStr)
        .select(
          db.raw('YEAR(date) as year'),
          db.raw('MONTH(date) as month'),
          db.raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as receitas'),
          db.raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as despesas')
        )
        .groupByRaw('YEAR(date), MONTH(date)')
        .orderByRaw('YEAR(date) ASC, MONTH(date) ASC') as Promise<any[]>,
      
      db('transactions')
        .where('user_id', userId)
        .where('type', 'expense')
        .where('date', '>=', currentMonthStartStr)
        .select('category as name')
        .sum('amount as value')
        .groupBy('category')
        .orderBy('value', 'desc') as Promise<any[]>,

      db('transactions')
        .where('user_id', userId)
        .where('type', 'income')
        .where('date', '>=', currentMonthStartStr)
        .select('category as name')
        .sum('amount as value')
        .groupBy('category')
        .orderBy('value', 'desc') as Promise<any[]>
    ]);

    // Format monthlyData
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      const found = monthlyDataRaw.find((row: any) => row.year === y && row.month === m);
      monthlyData.push({
        month: monthNames[m - 1],
        receitas: Number(found?.receitas || 0),
        despesas: Number(found?.despesas || 0)
      });
    }

    return sendSuccess(res, {
      monthlyData,
      spendingByCategory: spendingByCategoryRaw.map((row: any) => ({ name: row.name, value: Number(row.value) })),
      incomeByCategory: incomeByCategoryRaw.map((row: any) => ({ name: row.name, value: Number(row.value) }))
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return sendError(res, 'Erro ao buscar dados dos gráficos');
  }
};
