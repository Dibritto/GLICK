import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getCards = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const cards = await db('cards').where('user_id', userId);
    return sendSuccess(res, cards);
  } catch (error) {
    return sendError(res, 'Erro ao buscar cartões');
  }
};

export const createCard = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, limit_amount, closing_day, due_day, color } = req.body;
  try {
    const [id] = await db('cards').insert({
      user_id: userId,
      name,
      limit_amount,
      closing_day,
      due_day,
      color,
      current_bill: 0
    });
    return sendSuccess(res, { id, message: 'Cartão criado com sucesso' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar cartão');
  }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, limit_amount, closing_day, due_day, color } = req.body;
  const userId = req.user?.id;

  try {
    const updated = await db('cards')
      .where({ id, user_id: userId })
      .update({ name, limit_amount, closing_day, due_day, color, updated_at: db.fn.now() });

    if (!updated) return sendError(res, 'Cartão não encontrado', 404);
    return sendSuccess(res, { message: 'Cartão atualizado com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao atualizar cartão');
  }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const hasTransactions = await db('transactions').where({ card_id: id, user_id: userId }).first();
    if (hasTransactions) {
      return sendError(res, 'Não é possível excluir um cartão com transações vinculadas', 400);
    }

    const deleted = await db('cards').where({ id, user_id: userId }).delete();
    if (!deleted) return sendError(res, 'Cartão não encontrado', 404);

    return sendSuccess(res, { message: 'Cartão excluído com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir cartão');
  }
};
