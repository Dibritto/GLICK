import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const listAccounts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const accounts = await db('accounts').where('user_id', userId).select('*');
    return sendSuccess(res, accounts);
  } catch (error) {
    return sendError(res, 'Erro ao buscar contas');
  }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  const { name, type, balance, initial_balance, color } = req.body;
  const userId = req.user?.id;
  try {
    const [id] = await db('accounts').insert({
      user_id: userId,
      name,
      type,
      balance,
      initial_balance: initial_balance || 0,
      color
    });
    return sendSuccess(res, { id, name, type, balance, initial_balance: initial_balance || 0, color }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar conta');
  }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, type, balance, initial_balance, color } = req.body;
  const userId = req.user?.id;
  try {
    const updated = await db('accounts')
      .where({ id, user_id: userId })
      .update({ name, type, balance, initial_balance, color, updated_at: db.fn.now() });
    
    if (!updated) return sendError(res, 'Conta não encontrada', 404);
    return sendSuccess(res, { message: 'Conta atualizada com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao atualizar conta');
  }
};

export const recalculateAccountBalance = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const account = await db('accounts').where({ id, user_id: userId }).first();
    if (!account) return sendError(res, 'Conta não encontrada', 404);

    const [incomeResult, expenseResult, transferOutResult, transferInResult] = await Promise.all([
      db('transactions').where({ account_id: id, user_id: userId, type: 'income' }).whereIn('status', ['confirmed', 'reconciled']).sum('amount as total').first(),
      db('transactions').where({ account_id: id, user_id: userId, type: 'expense' }).whereIn('status', ['confirmed', 'reconciled']).sum('amount as total').first(),
      db('transactions').where({ account_id: id, user_id: userId, type: 'transfer' }).whereIn('status', ['confirmed', 'reconciled']).sum('amount as total').first(),
      db('transactions').where({ destination_account_id: id, user_id: userId, type: 'transfer' }).whereIn('status', ['confirmed', 'reconciled']).sum('amount as total').first(),
    ]);

    let calculatedBalance = Number(account.initial_balance) || 0;
    calculatedBalance += Number(incomeResult?.total || 0);
    calculatedBalance -= Number(expenseResult?.total || 0);
    calculatedBalance -= Number(transferOutResult?.total || 0);
    calculatedBalance += Number(transferInResult?.total || 0);

    await db('accounts').where('id', id).update({ balance: calculatedBalance });

    return sendSuccess(res, { message: 'Saldo recalculado com sucesso', balance: calculatedBalance });
  } catch (error) {
    return sendError(res, 'Erro ao recalcular saldo');
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    const hasTransactions = await db('transactions')
      .where('user_id', userId)
      .andWhere(function() {
        this.where('account_id', id).orWhere('destination_account_id', id);
      })
      .first();
      
    if (hasTransactions) {
      return sendError(res, 'Não é possível excluir uma conta com transações vinculadas', 400);
    }

    const deleted = await db('accounts').where({ id, user_id: userId }).delete();
    if (!deleted) return sendError(res, 'Conta não encontrada', 404);

    return sendSuccess(res, { message: 'Conta excluída com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir conta');
  }
};
