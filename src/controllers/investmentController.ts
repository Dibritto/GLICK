import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getAssets = async (req: AuthRequest, res: Response) => {
  try {
    const assets = await db('assets')
      .where('user_id', req.user!.id)
      .whereIn('type', ['stock', 'fii', 'fixed_income']);
    return sendSuccess(res, assets);
  } catch (error) {
    console.error('Erro ao buscar ativos de investimento:', error);
    return sendError(res, 'Erro ao buscar ativos de investimento');
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await db('investment_transactions')
      .where('user_id', req.user!.id)
      .orderBy('date', 'desc');
    return sendSuccess(res, transactions);
  } catch (error) {
    console.error('Erro ao buscar transações de investimento:', error);
    return sendError(res, 'Erro ao buscar transações de investimento');
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { symbol, name, type, operation, quantity, price, date, account_id } = req.body;

  try {
    await db.transaction(async (trx) => {
      let transactionId = null;

      // Se uma conta foi selecionada, cria a transação principal e atualiza o saldo
      if (account_id) {
        const amount = operation === 'buy' ? -(quantity * price) : (quantity * price);
        const transactionType = operation === 'buy' ? 'expense' : 'income';
        const description = `${operation === 'buy' ? 'Compra' : 'Venda'} de ${quantity} ${symbol}`;

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

      // Cria a transação de investimento
      await trx('investment_transactions').insert({
        user_id: userId,
        symbol,
        type,
        operation,
        quantity,
        price,
        date,
        account_id: account_id || null,
        transaction_id: transactionId
      });

      // Atualiza ou cria o ativo (Asset)
      const existingAsset = await trx('assets')
        .where({ user_id: userId, symbol })
        .first();

      if (existingAsset) {
        let newQuantity = Number(existingAsset.quantity);
        let newAveragePrice = Number(existingAsset.average_price);

        if (operation === 'buy') {
          const totalCost = (newQuantity * newAveragePrice) + (Number(quantity) * Number(price));
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
      } else if (operation === 'buy') {
        await trx('assets').insert({
          user_id: userId,
          symbol,
          name: name || symbol,
          type,
          quantity,
          average_price: price
        });
      }
    });

    return sendSuccess(res, { message: 'Transação de investimento registrada com sucesso' }, 201);
  } catch (error) {
    console.error('Erro ao registrar transação de investimento:', error);
    return sendError(res, 'Erro ao registrar transação de investimento');
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { quantity, price, date } = req.body;

  try {
    await db.transaction(async (trx) => {
      const oldTx = await trx('investment_transactions')
        .where({ id, user_id: userId })
        .first();

      if (!oldTx) throw new Error('Transação não encontrada');

      // Atualiza a transação principal se existir
      if (oldTx.transaction_id && oldTx.account_id) {
        const oldAmount = oldTx.operation === 'buy' ? -(oldTx.quantity * oldTx.price) : (oldTx.quantity * oldTx.price);
        const newAmount = oldTx.operation === 'buy' ? -(quantity * price) : (quantity * price);
        const difference = newAmount - oldAmount;

        await trx('transactions')
          .where({ id: oldTx.transaction_id, user_id: userId })
          .update({ amount: newAmount, date });

        await trx('accounts')
          .where({ id: oldTx.account_id, user_id: userId })
          .increment('balance', difference);
      }

      // Atualiza a transação de investimento
      await trx('investment_transactions')
        .where({ id, user_id: userId })
        .update({ quantity, price, date, updated_at: db.fn.now() });

      // Recalcula o ativo
      const allTxs = await trx('investment_transactions')
        .where({ user_id: userId, symbol: oldTx.symbol })
        .orderBy('date', 'asc');

      let newQuantity = 0;
      let totalCost = 0;

      for (const tx of allTxs) {
        if (tx.operation === 'buy') {
          newQuantity += Number(tx.quantity);
          totalCost += Number(tx.quantity) * Number(tx.price);
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
    console.error('Erro ao atualizar transação de investimento:', error);
    return sendError(res, 'Erro ao atualizar transação de investimento');
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    await db.transaction(async (trx) => {
      const tx = await trx('investment_transactions')
        .where({ id, user_id: userId })
        .first();

      if (!tx) throw new Error('Transação não encontrada');

      // Estorna a transação principal se existir
      if (tx.transaction_id && tx.account_id) {
        const amountToReverse = tx.operation === 'buy' ? (tx.quantity * tx.price) : -(tx.quantity * tx.price);
        
        await trx('accounts')
          .where({ id: tx.account_id, user_id: userId })
          .increment('balance', amountToReverse);

        await trx('transactions')
          .where({ id: tx.transaction_id, user_id: userId })
          .delete();
      }

      // Remove a transação de investimento
      await trx('investment_transactions')
        .where({ id, user_id: userId })
        .delete();

      // Recalcula o ativo
      const allTxs = await trx('investment_transactions')
        .where({ user_id: userId, symbol: tx.symbol })
        .orderBy('date', 'asc');

      let newQuantity = 0;
      let totalCost = 0;

      for (const t of allTxs) {
        if (t.operation === 'buy') {
          newQuantity += Number(t.quantity);
          totalCost += Number(t.quantity) * Number(t.price);
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
    console.error('Erro ao excluir transação de investimento:', error);
    return sendError(res, 'Erro ao excluir transação de investimento');
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
    console.error('Erro ao atualizar ativo de investimento:', error);
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
        await trx('investment_transactions').where({ user_id: userId, symbol: asset.symbol }).delete();
        await trx('assets').where({ id, user_id: userId }).delete();
      }
    });
    return sendSuccess(res, { message: 'Ativo e transações excluídos' });
  } catch (error) {
    console.error('Erro ao excluir ativo de investimento:', error);
    return sendError(res, 'Erro ao excluir ativo');
  }
};
