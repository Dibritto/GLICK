import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { closeCardBill, payCardBill, calculateProjectedInterest } from '../services/cardService.ts';
import { io } from '../../server.ts';

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
  const { name, brand, limit, closing_day, due_day, color, interest_rate } = req.body;
  try {
    const [id] = await db('cards').insert({
      user_id: userId,
      name,
      brand: brand || 'Outros',
      limit: limit || 0,
      closing_day,
      due_day,
      color,
      interest_rate: interest_rate || 0.1200,
      current_bill: 0
    });
    return sendSuccess(res, { id, message: 'Cartão criado com sucesso' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar cartão');
  }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, brand, limit, closing_day, due_day, color, interest_rate } = req.body;
  const userId = req.user?.id;

  try {
    const updated = await db('cards')
      .where({ id, user_id: userId })
      .update({ name, brand, limit, closing_day, due_day, color, interest_rate, updated_at: db.fn.now() });

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

// --- NOVAS FUNÇÕES: JUROS ROTATIVOS E FATURAS ---

export const getCardBills = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Verifica se o cartão pertence ao usuário
    const card = await db('cards').where({ id, user_id: userId }).first();
    if (!card) return sendError(res, 'Cartão não encontrado', 404);

    const bills = await db('card_bills').where('card_id', id).orderBy('month_year', 'desc');
    return sendSuccess(res, bills);
  } catch (error) {
    return sendError(res, 'Erro ao buscar faturas');
  }
};

export const closeBill = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { month_year } = req.body; // YYYY-MM
  const userId = req.user?.id;

  try {
    const card = await db('cards').where({ id, user_id: userId }).first();
    if (!card) return sendError(res, 'Cartão não encontrado', 404);

    const result = await closeCardBill(Number(id), month_year);

    if (io) {
      io.to(`user_${userId}`).emit('bill-closed', { cardId: id, month_year });
    }

    return sendSuccess(res, { message: 'Fatura fechada com sucesso', ...result });
  } catch (error: any) {
    return sendError(res, error.message || 'Erro ao fechar fatura');
  }
};

export const payBill = async (req: AuthRequest, res: Response) => {
  const { billId } = req.params;
  const { amount } = req.body;
  const userId = req.user?.id;

  try {
    // Verifica se a fatura pertence a um cartão do usuário
    const bill = await db('card_bills')
      .join('cards', 'card_bills.card_id', '=', 'cards.id')
      .where('card_bills.id', billId)
      .where('cards.user_id', userId)
      .select('card_bills.*')
      .first();

    if (!bill) return sendError(res, 'Fatura não encontrada', 404);

    const result = await payCardBill(Number(billId), Number(amount));
    return sendSuccess(res, { message: 'Pagamento registrado', ...result });
  } catch (error: any) {
    return sendError(res, error.message || 'Erro ao registrar pagamento');
  }
};

export const projectInterest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const card = await db('cards').where({ id, user_id: userId }).first();
    if (!card) return sendError(res, 'Cartão não encontrado', 404);

    const projection = calculateProjectedInterest(Number(card.current_bill), Number(card.interest_rate));
    return sendSuccess(res, projection);
  } catch (error) {
    return sendError(res, 'Erro ao projetar juros');
  }
};
