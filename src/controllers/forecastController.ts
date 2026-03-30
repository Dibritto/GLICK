import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getForecasts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const forecasts = await db('forecasts')
      .where('user_id', userId)
      .orderBy('month', 'asc');
    return sendSuccess(res, forecasts);
  } catch (error) {
    return sendError(res, 'Erro ao buscar previsões');
  }
};

export const createForecast = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const [id] = await db('forecasts').insert({
      ...req.body,
      user_id: userId
    });
    return sendSuccess(res, { id, message: 'Previsão criada' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar previsão');
  }
};

export const deleteForecast = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const deleted = await db('forecasts').where({ id, user_id: userId }).delete();
    if (!deleted) return sendError(res, 'Previsão não encontrada', 404);
    return sendSuccess(res, { message: 'Previsão excluída' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir previsão');
  }
};
