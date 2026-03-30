import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

const bcrypt = (bcryptjs as any).default || bcryptjs;
const JWT_SECRET = process.env.JWT_SECRET || 'glick_secret_key_2026';

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

async function seedUserData(userId: number) {
  await db.transaction(async (trx) => {
    // 1. Criar Conta Padrão
    await trx('accounts').insert({
      user_id: userId,
      name: 'Carteira Principal',
      type: 'checking',
      balance: 0,
      initial_balance: 0,
      color: '#2CC7FF'
    });

    // 2. Criar Categorias Padrão
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      user_id: userId
    }));
    await trx('categories').insert(categoriesToInsert);

    // 3. Ativar Módulo Core
    const coreModule = await trx('modules').where('slug', 'core').first();
    if (coreModule) {
      await trx('user_modules').insert({
        user_id: userId,
        module_id: coreModule.id,
        status: 'active',
        activated_at: new Date()
      });
    }
  });
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({
      name,
      email,
      password: hashedPassword
    });
    
    // Seed initial data for the new user
    await seedUserData(userId);

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    return sendSuccess(res, { token, user: { id: userId, name, email } }, 201);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Email já cadastrado', 400);
    }
    return sendError(res, 'Erro ao registrar usuário');
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const user = await db('users').where('email', normalizedEmail).first();
    if (!user) {
      return sendError(res, 'Usuário não encontrado', 400);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendError(res, 'Senha incorreta', 400);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return sendSuccess(res, { token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error details:', error);
    return sendError(res, 'Erro interno no servidor ao realizar login');
  }
};
