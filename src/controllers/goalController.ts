import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getGoals = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const goals = await db('goals').where('user_id', userId);
    return sendSuccess(res, goals);
  } catch (error) {
    return sendError(res, 'Erro ao buscar metas');
  }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, target_amount, current_amount, deadline, color, icon } = req.body;
  try {
    const [id] = await db('goals').insert({
      user_id: userId,
      name,
      target_amount,
      current_amount: current_amount || 0,
      deadline,
      color,
      icon
    });
    return sendSuccess(res, { id, message: 'Meta criada com sucesso' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar meta');
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, target_amount, current_amount, deadline, color, icon } = req.body;
  const userId = req.user?.id;

  try {
    const updated = await db('goals')
      .where({ id, user_id: userId })
      .update({ name, target_amount, current_amount, deadline, color, icon, updated_at: db.fn.now() });

    if (!updated) return sendError(res, 'Meta não encontrada', 404);
    return sendSuccess(res, { message: 'Meta atualizada com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao atualizar meta');
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const hasTransactions = await db('transactions').where({ goal_id: id, user_id: userId }).first();
    if (hasTransactions) {
      return sendError(res, 'Não é possível excluir uma meta com transações vinculadas', 400);
    }

    const deleted = await db('goals').where({ id, user_id: userId }).delete();
    if (!deleted) return sendError(res, 'Meta não encontrada', 404);

    return sendSuccess(res, { message: 'Meta excluída com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir meta');
  }
};
