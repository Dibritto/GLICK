import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { validateAndRegisterTransaction } from '../lib/financeEngine.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { io } from '../../server.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Helper para criar transações parceladas
const createInstallmentTransaction = async (userId: number, data: any) => {
  const { account_id, category, date, description, total_value, installments, card_id } = data;

  if (!total_value || total_value <= 0) {
    throw new Error('Valor total deve ser maior que zero');
  }
  if (!installments || installments < 1 || installments > 36) {
    throw new Error('Número de parcelas deve estar entre 1 e 36');
  }

  const installment_value = total_value / installments;

  return await db.transaction(async (trx) => {
    // 1. Criar a primeira parcela como transação imediata
    const [txId] = await trx('transactions').insert({
      user_id: userId,
      account_id,
      card_id,
      type: 'expense', // Parcelas são tratadas como despesas
      category,
      amount: installment_value,
      date,
      description: `${description} (1/${installments})`,
      status: 'confirmed', // Primeira parcela já debita
      installment_id: `inst_${Date.now()}` // ID agrupador
    });

    // 2. Atualizar o saldo da conta (ou cartão)
    if (card_id) {
      await trx('cards').where({ id: card_id, user_id: userId }).increment('current_bill', installment_value);
    } else {
      await trx('accounts').where({ id: account_id, user_id: userId }).decrement('balance', installment_value);
    }

    // 3. Gerar recorrências para as parcelas restantes
    if (installments > 1) {
      const nextDate = new Date(date);
      nextDate.setMonth(nextDate.getMonth() + 1);

      await trx('recurring_transactions').insert({
        user_id: userId,
        account_id,
        card_id,
        type: 'expense',
        category,
        amount: installment_value,
        description: `${description} (Parcela)`,
        frequency: 'monthly',
        next_date: nextDate.toISOString().split('T')[0],
        status: 'pending' // Conforme solicitado
      });
    }

    return txId;
  });
};

export const listTransactions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const halfYearAgo = new Date();
    halfYearAgo.setDate(halfYearAgo.getDate() - 180);
    const isoHalfYearAgo = halfYearAgo.toISOString().split('T')[0];

    const transactions = await db('transactions')
      .select('transactions.*', 'accounts.name as account_name', 'cards.name as card_name')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .leftJoin('cards', 'transactions.card_id', 'cards.id')
      .where('transactions.user_id', userId)
      .where('transactions.date', '>=', isoHalfYearAgo)
      .orderBy('transactions.date', 'desc')
      .limit(1000);
    return sendSuccess(res, transactions);
  } catch (error) {
    return sendError(res, 'Erro ao buscar transações');
  }
};

export const listTransactionsPaginated = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  try {
    const totalResult = await db('transactions')
      .where('user_id', userId)
      .count('* as total')
      .first();
    const total = Number(totalResult?.total || 0);

    const transactions = await db('transactions')
      .select('transactions.*', 'accounts.name as account_name', 'cards.name as card_name')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .leftJoin('cards', 'transactions.card_id', 'cards.id')
      .where('transactions.user_id', userId)
      .orderBy('transactions.date', 'desc')
      .limit(limit)
      .offset(offset);

    return sendSuccess(res, {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, 'Erro ao buscar transações paginadas');
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'Não autorizado', 401);
  
  try {
    let id;
    
    if (req.body.type === 'installment') {
      console.log(`[TRANSACTION] Criando transação parcelada para usuário ${userId}`);
      id = await createInstallmentTransaction(userId, req.body);
    } else {
      id = await validateAndRegisterTransaction(userId, req.body);
    }
    
    // Emit WebSocket event
    if (io) {
      io.to(`user_${userId}`).emit('transaction-processed', { id, type: 'create' });
    }

    return sendSuccess(res, { id, message: 'Transação registrada com sucesso' }, 201);
  } catch (error: any) {
    console.error('Erro ao registrar transação:', error);
    return sendError(res, error.message || 'Erro ao registrar transação');
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { account_id, type, category, amount, date, description, status, destination_account_id, recurrence, card_id, goal_id } = req.body;
  const userId = req.user?.id;

  try {
    const transaction = await db('transactions')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!transaction) return sendError(res, 'Transação não encontrada', 404);

    if (card_id) {
      const card = await db('cards').where({ id: card_id, user_id: userId }).first();
      if (!card) return sendError(res, 'Acesso negado ao cartão', 403);
    }
    
    if (goal_id) {
      const goal = await db('goals').where({ id: goal_id, user_id: userId }).first();
      if (!goal) return sendError(res, 'Acesso negado à meta', 403);
    }

    await db.transaction(async (trx) => {
      let transactionsToUpdate = [transaction];

      // Se for uma compra parcelada, buscar todas as parcelas para atualizar campos comuns
      if (transaction.installment_id) {
        transactionsToUpdate = await trx('transactions')
          .where('installment_id', transaction.installment_id)
          .where('user_id', userId);
      }

      for (const tx of transactionsToUpdate) {
        // 1. Reverter saldo antigo (apenas se confirmado ou conciliado)
        if (tx.status === 'confirmed' || tx.status === 'reconciled') {
          if (tx.card_id) {
            if (tx.category === 'Pagamento de Fatura') {
              await trx('accounts').where('id', tx.account_id).increment('balance', tx.amount);
              await trx('cards').where('id', tx.card_id).increment('current_bill', tx.amount);
            } else {
              const oldCardAdj = tx.type === 'income' ? tx.amount : -tx.amount;
              await trx('cards').where('id', tx.card_id).increment('current_bill', oldCardAdj);
            }
          } else {
            const oldAdjustment = tx.type === 'income' ? -tx.amount : tx.amount;
            await trx('accounts').where('id', tx.account_id).increment('balance', oldAdjustment);
            
            if (tx.type === 'transfer' && tx.destination_account_id) {
              await trx('accounts').where('id', tx.destination_account_id).decrement('balance', tx.amount);
            }
          }
        }

        // 2. Atualizar transação
        const isCurrentTx = tx.id === transaction.id;
        
        // Se for a transação atual, atualiza tudo. Se for outra parcela, atualiza apenas campos comuns.
        const updateData = isCurrentTx ? {
          account_id, type, category, amount, date, description, status,
          destination_account_id, recurrence, card_id, goal_id,
          updated_at: db.fn.now()
        } : {
          account_id, type, category, 
          description: description.replace(/ \(\d+\/\d+\)$/, '') + (tx.description.match(/ \(\d+\/\d+\)$/) ? tx.description.match(/ \(\d+\/\d+\)$/)[0] : ''),
          destination_account_id, recurrence, card_id, goal_id,
          updated_at: db.fn.now()
        };

        await trx('transactions').where('id', tx.id).update(updateData);

        // 3. Aplicar novo saldo (apenas se confirmado ou conciliado)
        const newStatus = isCurrentTx ? status : tx.status;
        const newAmount = isCurrentTx ? amount : tx.amount;

        if (newStatus === 'confirmed' || newStatus === 'reconciled') {
          if (card_id) {
            if (category === 'Pagamento de Fatura') {
              await trx('accounts').where('id', account_id).decrement('balance', newAmount);
              await trx('cards').where('id', card_id).decrement('current_bill', newAmount);
            } else {
              const newCardAdj = type === 'income' ? -newAmount : newAmount;
              await trx('cards').where('id', card_id).increment('current_bill', newCardAdj);
            }
          } else {
            const newAdjustment = type === 'income' ? newAmount : -newAmount;
            await trx('accounts').where('id', account_id).increment('balance', newAdjustment);
            
            if (type === 'transfer' && destination_account_id) {
              await trx('accounts').where('id', destination_account_id).increment('balance', newAmount);
            }
          }
        }
      }
    });

    return sendSuccess(res, { message: 'Transação(ões) atualizada(s) com sucesso' });
  } catch (error: any) {
    console.error('[TRANSACTION_CONTROLLER] Error updating transaction:', error);
    return sendError(res, error.message || 'Erro ao atualizar transação');
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const transaction = await db('transactions')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!transaction) return sendError(res, 'Transação não encontrada', 404);

    await db.transaction(async (trx) => {
      let transactionsToDelete = [transaction];

      // Se for uma compra parcelada, buscar todas as parcelas
      if (transaction.installment_id) {
        transactionsToDelete = await trx('transactions')
          .where('installment_id', transaction.installment_id)
          .where('user_id', userId);
      }

      for (const tx of transactionsToDelete) {
        // Reverter saldo se estava confirmada/conciliada
        if (tx.status === 'confirmed' || tx.status === 'reconciled') {
          if (tx.card_id) {
            if (tx.category === 'Pagamento de Fatura') {
              await trx('accounts').where('id', tx.account_id).increment('balance', tx.amount);
              await trx('cards').where('id', tx.card_id).increment('current_bill', tx.amount);
            } else {
              const oldCardAdj = tx.type === 'income' ? tx.amount : -tx.amount;
              await trx('cards').where('id', tx.card_id).increment('current_bill', oldCardAdj);
            }
          } else {
            const oldAdjustment = tx.type === 'income' ? -tx.amount : tx.amount;
            await trx('accounts').where('id', tx.account_id).increment('balance', oldAdjustment);
            
            if (tx.type === 'transfer' && tx.destination_account_id) {
              await trx('accounts').where('id', tx.destination_account_id).decrement('balance', tx.amount);
            }
          }
        }
        await trx('transactions').where('id', tx.id).delete();
      }
    });

    return sendSuccess(res, { message: 'Transação(ões) excluída(s) com sucesso' });
  } catch (error) {
    console.error('[TRANSACTION_CONTROLLER] Error deleting transaction:', error);
    return sendError(res, 'Erro ao excluir transação');
  }
};

export const reconcileTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const transaction = await db('transactions')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!transaction) return sendError(res, 'Transação não encontrada', 404);
    if (transaction.status === 'reconciled') return sendError(res, 'Transação já está conciliada', 400);

    await db.transaction(async (trx) => {
      // Se estava pendente, aplica o saldo agora
      if (transaction.status === 'pending') {
        if (transaction.card_id) {
          if (transaction.category === 'Pagamento de Fatura') {
            await trx('accounts').where('id', transaction.account_id).decrement('balance', transaction.amount);
            await trx('cards').where('id', transaction.card_id).decrement('current_bill', transaction.amount);
          } else {
            const cardAdj = transaction.type === 'income' ? -transaction.amount : transaction.amount;
            await trx('cards').where('id', transaction.card_id).increment('current_bill', cardAdj);
          }
        } else {
          const adjustment = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          await trx('accounts').where('id', transaction.account_id).increment('balance', adjustment);
          
          if (transaction.type === 'transfer' && transaction.destination_account_id) {
            await trx('accounts').where('id', transaction.destination_account_id).increment('balance', transaction.amount);
          }
        }
      }

      await trx('transactions').where('id', id).update({
        status: 'reconciled',
        updated_at: db.fn.now()
      });
    });

    return sendSuccess(res, { message: 'Transação conciliada com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao conciliar transação');
  }
};
