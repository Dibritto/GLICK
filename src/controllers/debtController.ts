import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { createDebtInstallments, simulatePayoff } from '../services/debtService.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getDebts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const debts = await db('debts').where('user_id', userId);
    return sendSuccess(res, debts);
  } catch (error) {
    return sendError(res, 'Erro ao buscar dívidas');
  }
};

export const createDebt = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, principal, monthly_rate, total_months, payment_method, start_date } = req.body;
  
  try {
    const [id] = await db('debts').insert({
      user_id: userId,
      name,
      principal,
      monthly_rate,
      total_months,
      payment_method,
      start_date,
      status: 'active'
    });

    // Generate installments
    await createDebtInstallments(id, userId!);

    return sendSuccess(res, { id, message: 'Dívida criada com sucesso e parcelas geradas' }, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Erro ao criar dívida');
  }
};

export const simulatePayoffEndpoint = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { extra_monthly, strategy } = req.body; // strategy: 'snowball' | 'avalanche'

  try {
    const result = await simulatePayoff(userId!, Number(extra_monthly), strategy || 'avalanche');
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Erro ao simular quitação');
  }
};
