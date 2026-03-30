import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getRecurringTransactions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const recurring = await db('recurring_transactions')
      .select('recurring_transactions.*', 'accounts.name as account_name', 'cards.name as card_name')
      .join('accounts', 'recurring_transactions.account_id', 'accounts.id')
      .leftJoin('cards', 'recurring_transactions.card_id', 'cards.id')
      .where('recurring_transactions.user_id', userId)
      .orderBy('next_date', 'asc');
    return sendSuccess(res, recurring);
  } catch (error) {
    return sendError(res, 'Erro ao buscar transações recorrentes');
  }
};

export const createRecurringTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const [id] = await db('recurring_transactions').insert({
      ...req.body,
      user_id: userId
    });
    return sendSuccess(res, { id, message: 'Transação recorrente criada' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar transação recorrente');
  }
};

export const deleteRecurringTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const deleted = await db('recurring_transactions').where({ id, user_id: userId }).delete();
    if (!deleted) return sendError(res, 'Transação recorrente não encontrada', 404);
    return sendSuccess(res, { message: 'Transação recorrente excluída' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir transação recorrente');
  }
};
