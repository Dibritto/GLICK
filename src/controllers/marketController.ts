import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import fetch from 'node-fetch';

export const getMarketPrice = async (req: Request, res: Response) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`);
    if (!response.ok) {
      return sendError(res, 'Preço não encontrado', 404);
    }
    const data = await response.json() as { price: string };
    return sendSuccess(res, { price: parseFloat(data.price) });
  } catch (error) {
    return sendError(res, 'Erro ao buscar preço de mercado');
  }
};
