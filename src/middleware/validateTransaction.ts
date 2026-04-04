import { Request, Response, NextFunction } from 'express';
import db from '../lib/db.ts';
import { sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const validateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'Não autorizado', 401);

  const { account_id, type, amount, date, description, destination_account_id, category, recurrence } = req.body;

  try {
    console.log(`[VALIDATE_TX] Iniciando validação para usuário ${userId}, tipo: ${type}`);

    // 1. Data futura: Proibido data > hoje (exceto recorrências)
    if (!recurrence || recurrence === 'none') {
      const today = new Date().toISOString().split('T')[0];
      const txDate = new Date(date).toISOString().split('T')[0];
      if (txDate > today) {
        return sendError(res, 'Data futura não permitida para transações não recorrentes', 400);
      }
    }

    // 2. Transferência válida: account_id ≠ destination_account_id e ambos do user_id
    if (type === 'transfer') {
      if (!destination_account_id) {
        return sendError(res, 'Conta de destino obrigatória para transferência', 400);
      }
      if (account_id === destination_account_id) {
        return sendError(res, 'Conta de origem e destino não podem ser iguais', 400);
      }
      
      const accounts = await db('accounts')
        .whereIn('id', [account_id, destination_account_id])
        .where('user_id', userId);
        
      if (accounts.length !== 2) {
        return sendError(res, 'Uma ou ambas as contas não pertencem ao usuário', 400);
      }
    }

    // 3. Saldo negativo bloqueado: Para 'expense' ou 'transfer' ou 'installment'
    if (type === 'expense' || type === 'transfer' || type === 'installment') {
      const account = await db('accounts')
        .where({ id: account_id, user_id: userId })
        .first();
        
      if (!account) return sendError(res, 'Conta não encontrada', 404);
      
      const checkAmount = type === 'installment' 
        ? Number(req.body.total_value) / Number(req.body.installments)
        : Number(amount);

      // Cheque saldo atual da account_id >= valor
      if (Number(account.balance) < checkAmount) {
        return sendError(res, 'Saldo insuficiente', 400);
      }
    }

    // 4. Duplicatas: Verifique se existe transação idêntica nos últimos 5 min
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicateAmount = type === 'installment' ? Number(req.body.total_value) / Number(req.body.installments) : amount;
    
    const duplicate = await db('transactions')
      .where({
        user_id: userId,
        account_id,
        amount: duplicateAmount,
        date,
        description: type === 'installment' ? `${description} (1/${req.body.installments})` : description
      })
      .where('created_at', '>=', fiveMinsAgo)
      .first();

    // Se for edição (PUT), o req.params.id estará presente
    if (duplicate && req.params.id !== String(duplicate.id)) {
      return sendError(res, 'Transação duplicada detectada (últimos 5 minutos)', 409);
    }

    // 5. Limites de orçamento: Se categoria tem budget
    if (category && (type === 'expense' || type === 'installment')) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Verifica se a tabela budgets existe e tem orçamento para a categoria
      const hasBudgetsTable = await db.schema.hasTable('budgets');
      if (hasBudgetsTable) {
        const budget = await db('budgets')
          .where({ user_id: userId, category, month: currentMonth, year: currentYear })
          .first();
          
        if (budget) {
          const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
          const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
          
          const expenses = await db('transactions')
            .where({ user_id: userId, category, type: 'expense' })
            .whereBetween('date', [startDate, endDate])
            .sum('amount as total')
            .first();
            
          const totalSpent = Number(expenses?.total || 0);
          const checkAmount = type === 'installment' ? Number(req.body.total_value) / Number(req.body.installments) : Number(amount);
          const newTotal = totalSpent + checkAmount;
          
          if (newTotal > Number(budget.amount)) {
            return sendError(res, 'Orçamento excedido para esta categoria', 403);
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('[VALIDATE_TX] Erro no middleware:', error);
    return sendError(res, 'Erro interno na validação da transação', 500);
  }
};
