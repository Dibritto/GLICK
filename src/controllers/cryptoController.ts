import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getAssets = async (req: AuthRequest, res: Response) => {
  try {
    const assets = await db('assets').where('user_id', req.user!.id);
    return sendSuccess(res, assets);
  } catch (error) {
    console.error('Erro ao buscar ativos de cripto:', error);
    return sendError(res, 'Erro ao buscar ativos de cripto');
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await db('crypto_transactions')
      .where('user_id', req.user!.id)
      .orderBy('date', 'desc');
    return sendSuccess(res, transactions);
  } catch (error) {
    console.error('Erro ao buscar transações de cripto:', error);
    return sendError(res, 'Erro ao buscar transações de cripto');
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  // Auth check obrigatório antes de qualquer insert
  if (!req.user || !req.user.id) {
    return sendError(res, 'Usuário não autenticado', 401);
  }

  const userId = req.user.id;
  const { symbol, type, quantity, price_at_time, date, account_id } = req.body;

  try {
    await db.transaction(async (trx) => {
      let transactionId = null;

      // 1. Bloco financeiro principal (Comentado porque depende de account_id na tabela crypto_transactions para vínculo futuro)
      // account_id removido temporariamente porque coluna não existe na tabela crypto_transactions
      /* 
      if (account_id) {
        const amount = type === 'buy' ? -(quantity * price_at_time) : (quantity * price_at_time);
        const transactionType = type === 'buy' ? 'expense' : 'income';
        const description = `${type === 'buy' ? 'Compra' : 'Venda'} de ${quantity} ${symbol}`;

        const [newTxId] = await trx('transactions').insert({
          user_id: userId,
          account_id,
          type: transactionType,
          category: 'Investimentos',
          amount,
          date,
          description,
          status: 'confirmed'
        });
        transactionId = newTxId;

        // Atualiza o saldo da conta
        await trx('accounts')
          .where({ id: account_id, user_id: userId })
          .increment('balance', amount);
      }
      */

      // 2. Busca ou cria o ativo (Asset) para obter o asset_id
      let existingAsset = await trx('assets')
        .where({ user_id: userId, symbol })
        .first();

      let assetId;
      if (existingAsset) {
        assetId = existingAsset.id;
        let newQuantity = Number(existingAsset.quantity);
        let newAveragePrice = Number(existingAsset.average_price);

        if (type === 'buy') {
          const totalCost = (newQuantity * newAveragePrice) + (Number(quantity) * Number(price_at_time));
          newQuantity += Number(quantity);
          newAveragePrice = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else {
          newQuantity -= Number(quantity);
          if (newQuantity <= 0) {
            newQuantity = 0;
            newAveragePrice = 0;
          }
        }

        await trx('assets')
          .where({ id: existingAsset.id })
          .update({
            quantity: newQuantity,
            average_price: newAveragePrice,
            updated_at: db.fn.now()
          });
      } else if (type === 'buy') {
        const [newAssetId] = await trx('assets').insert({
          user_id: userId,
          symbol,
          name: symbol,
          type: 'crypto',
          quantity,
          average_price: price_at_time
        });
        assetId = newAssetId;
      }

      // Verificação de asset_id adicionada pra evitar insert inválido.
      if (!assetId) {
        if (type === 'sell') {
          throw new Error('Ativo não encontrado para venda');
        }
        throw new Error('Não foi possível localizar ou criar o ativo para esta transação');
      }

      // 3. Cria a transação de cripto (Sem account_id, symbol e transaction_id)
      await trx('crypto_transactions').insert({
        user_id: userId,
        asset_id: assetId,
        type,
        quantity,
        price_at_time, // Usando price_at_time para bater com o esquema original do banco
        date,
        // account_id removido temporariamente porque coluna não existe na tabela
        // transaction_id removido porque coluna não existe na tabela
      });
    });

    return sendSuccess(res, { message: 'Transação de cripto registrada com sucesso' }, 201);
  } catch (error) {
    console.error('Erro ao registrar transação de cripto:', error);
    return sendError(res, error instanceof Error ? error.message : 'Erro ao registrar transação de cripto');
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { quantity, price_at_time, date } = req.body;

  try {
    await db.transaction(async (trx) => {
      const oldTx = await trx('crypto_transactions')
        .where({ id, user_id: userId })
        .first();

      if (!oldTx) throw new Error('Transação não encontrada');

      // Atualiza a transação principal se existir
      // account_id removido temporariamente porque coluna não existe na tabela
      if (oldTx.transaction_id && oldTx.account_id) {
        const oldAmount = oldTx.type === 'buy' ? -(oldTx.quantity * oldTx.price_at_time) : (oldTx.quantity * oldTx.price_at_time);
        const newAmount = oldTx.type === 'buy' ? -(quantity * price_at_time) : (quantity * price_at_time);
        const difference = newAmount - oldAmount;

        await trx('transactions')
          .where({ id: oldTx.transaction_id, user_id: userId })
          .update({ amount: newAmount, date });

        await trx('accounts')
          .where({ id: oldTx.account_id, user_id: userId })
          .increment('balance', difference);
      }

      // Atualiza a transação de cripto
      await trx('crypto_transactions')
        .where({ id, user_id: userId })
        .update({ quantity, price_at_time, date, updated_at: db.fn.now() });

      // Recalcula o ativo
      const allTxs = await trx('crypto_transactions')
        .where({ user_id: userId, asset_id: oldTx.asset_id })
        .orderBy('date', 'asc');

      let newQuantity = 0;
      let totalCost = 0;

      for (const tx of allTxs) {
        if (tx.type === 'buy') {
          newQuantity += Number(tx.quantity);
          totalCost += Number(tx.quantity) * Number(tx.price_at_time);
        } else {
          newQuantity -= Number(tx.quantity);
          if (newQuantity <= 0) {
            newQuantity = 0;
            totalCost = 0;
          } else {
            const avgPrice = totalCost / (newQuantity + Number(tx.quantity));
            totalCost = newQuantity * avgPrice;
          }
        }
      }

      const newAveragePrice = newQuantity > 0 ? totalCost / newQuantity : 0;

      await trx('assets')
        .where({ user_id: userId, symbol: oldTx.symbol })
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          updated_at: db.fn.now()
        });
    });

    return sendSuccess(res, { message: 'Transação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar transação de cripto:', error);
    return sendError(res, 'Erro ao atualizar transação de cripto');
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    await db.transaction(async (trx) => {
      const tx = await trx('crypto_transactions')
        .where({ id, user_id: userId })
        .first();

      if (!tx) throw new Error('Transação não encontrada');

      // Estorna a transação principal se existir
      // account_id removido temporariamente porque coluna não existe na tabela
      if (tx.transaction_id && tx.account_id) {
        const amountToReverse = tx.type === 'buy' ? (tx.quantity * tx.price_at_time) : -(tx.quantity * tx.price_at_time);
        
        await trx('accounts')
          .where({ id: tx.account_id, user_id: userId })
          .increment('balance', amountToReverse);

        await trx('transactions')
          .where({ id: tx.transaction_id, user_id: userId })
          .delete();
      }

      // Remove a transação de cripto
      await trx('crypto_transactions')
        .where({ id, user_id: userId })
        .delete();

      // Recalcula o ativo
      const allTxs = await trx('crypto_transactions')
        .where({ user_id: userId, asset_id: tx.asset_id })
        .orderBy('date', 'asc');

      let newQuantity = 0;
      let totalCost = 0;

      for (const t of allTxs) {
        if (t.type === 'buy') {
          newQuantity += Number(t.quantity);
          totalCost += Number(t.quantity) * Number(t.price_at_time);
        } else {
          newQuantity -= Number(t.quantity);
          if (newQuantity <= 0) {
            newQuantity = 0;
            totalCost = 0;
          } else {
            const avgPrice = totalCost / (newQuantity + Number(t.quantity));
            totalCost = newQuantity * avgPrice;
          }
        }
      }

      const newAveragePrice = newQuantity > 0 ? totalCost / newQuantity : 0;

      await trx('assets')
        .where({ user_id: userId, symbol: tx.symbol })
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          updated_at: db.fn.now()
        });
    });

    return sendSuccess(res, { message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação de cripto:', error);
    return sendError(res, 'Erro ao excluir transação de cripto');
  }
};

export const updateAsset = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { quantity, average_price } = req.body;

  try {
    await db('assets')
      .where({ id, user_id: userId })
      .update({ quantity, average_price, updated_at: db.fn.now() });
    
    return sendSuccess(res, { message: 'Ativo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ativo de cripto:', error);
    return sendError(res, 'Erro ao atualizar ativo');
  }
};

export const deleteAsset = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    await db.transaction(async (trx) => {
      const asset = await trx('assets').where({ id, user_id: userId }).first();
      if (asset) {
        await trx('crypto_transactions').where({ user_id: userId, asset_id: asset.id }).delete();
        await trx('assets').where({ id, user_id: userId }).delete();
      }
    });
    return sendSuccess(res, { message: 'Ativo e transações excluídos' });
  } catch (error) {
    console.error('Erro ao excluir ativo de cripto:', error);
    return sendError(res, 'Erro ao excluir ativo');
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  const { symbol } = req.params;
  const { timeframe } = req.query;
  
  try {
    // Simples: busca os últimos 100 registros
    const history = await db('crypto_price_history')
      .where('symbol', symbol.toUpperCase())
      .orderBy('timestamp', 'desc')
      .limit(100);
      
    return sendSuccess(res, history.reverse());
  } catch (error) {
    console.error('Erro ao buscar histórico de preço:', error);
    return sendError(res, 'Erro ao buscar histórico');
  }
};
