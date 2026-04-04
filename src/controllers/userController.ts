import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import bcryptjs from 'bcryptjs';

const bcrypt = (bcryptjs as any).default || bcryptjs;

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await db('users').where('id', req.user?.id).select('id', 'name', 'email').first();
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Erro ao buscar dados do usuário');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const userId = req.user?.id;

  try {
    const existingUser = await db('users').where('email', email).whereNot('id', userId).first();
    if (existingUser) {
      return sendError(res, 'Email já está em uso por outra conta', 400);
    }

    await db('users').where('id', userId).update({ name, email });
    const updatedUser = await db('users').where('id', userId).select('id', 'name', 'email').first();
    return sendSuccess(res, updatedUser);
  } catch (error) {
    return sendError(res, 'Erro ao atualizar perfil');
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  try {
    const user = await db('users').where('id', userId).first();
    if (!user) return sendError(res, 'Usuário não encontrado', 404);

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return sendError(res, 'Senha atual incorreta', 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where('id', userId).update({ password: hashedNewPassword });

    return sendSuccess(res, { message: 'Senha atualizada com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao atualizar senha');
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const [
      accounts,
      cards,
      goals,
      categories,
      transactions,
      assets,
      crypto_transactions,
      investment_transactions,
      recurring_transactions,
      user_modules
    ] = await Promise.all([
      db('accounts').where('user_id', userId),
      db('cards').where('user_id', userId),
      db('goals').where('user_id', userId),
      db('categories').where('user_id', userId),
      db('transactions').where('user_id', userId),
      db('assets').where('user_id', userId),
      db('crypto_transactions').where('user_id', userId),
      db('investment_transactions').where('user_id', userId),
      db('recurring_transactions').where('user_id', userId),
      db('user_modules').where('user_id', userId),
    ]);

    const data = {
      accounts,
      cards,
      goals,
      categories,
      transactions,
      assets,
      crypto_transactions,
      investment_transactions,
      recurring_transactions,
      user_modules
    };
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Erro ao exportar dados');
  }
};

export const resetData = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    await db.transaction(async (trx) => {
      await trx('crypto_transactions').where('user_id', userId).delete();
      await trx('investment_transactions').where('user_id', userId).delete();
      await trx('transactions').where('user_id', userId).delete();
      await trx('recurring_transactions').where('user_id', userId).delete();
      await trx('cards').where('user_id', userId).delete();
      await trx('goals').where('user_id', userId).delete();
      await trx('assets').where('user_id', userId).delete();
      await trx('categories').where('user_id', userId).delete();
      
      await trx('accounts').where('user_id', userId).update({ balance: 0 });

      // Re-inserir categorias padrão para o usuário não ficar num limbo
      const DEFAULT_CATEGORIES = [
        { name: 'Alimentação', type: 'expense', icon: 'Utensils', color: '#FF4B4B' },
        { name: 'Transporte', type: 'expense', icon: 'Car', color: '#4B7BFF' },
        { name: 'Lazer', type: 'expense', icon: 'Gamepad2', color: '#FFB84B' },
        { name: 'Saúde', type: 'expense', icon: 'Heart', color: '#FF4B91' },
        { name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#914BFF' },
        { name: 'Moradia', type: 'expense', icon: 'Home', color: '#4BFFB8' },
        { name: 'Salário', type: 'income', icon: 'Wallet', color: '#4BFF4B' },
        { name: 'Investimentos', type: 'income', icon: 'TrendingUp', color: '#B8FF4B' },
        { name: 'Outros', type: 'expense', icon: 'Tag', color: '#A0A0A0' }
      ];
      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        user_id: userId
      }));
      await trx('categories').insert(categoriesToInsert);
    });
    return sendSuccess(res, { message: 'Dados resetados com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao resetar dados');
  }
};
