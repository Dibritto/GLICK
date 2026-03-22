import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import bcryptjs from 'bcryptjs';
const bcrypt = (bcryptjs as any).default || bcryptjs;
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from './src/lib/db.js';
import { calculateCoreStats, validateAndRegisterTransaction } from './src/lib/financeEngine.js';
import { getUserModules, activateModule, checkModuleAccess } from './src/lib/moduleManager.js';

dotenv.config();

// --- SCHEMAS DE VALIDAÇÃO ---
const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória')
});

const transactionSchema = z.object({
  account_id: z.number().positive(),
  destination_account_id: z.number().positive().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1),
  amount: z.number().positive('O valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  description: z.string().min(1),
  status: z.enum(['confirmed', 'pending', 'reconciled']).default('confirmed'),
  recurrence: z.enum(['none', 'monthly', 'weekly', 'yearly']).optional().default('none'),
  card_id: z.number().positive().optional().nullable(),
  goal_id: z.number().positive().optional().nullable()
});

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.number(),
  initial_balance: z.number().optional().default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida')
});

const goalSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).optional().default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  color: z.string().regex(/^#[0-9A-F]{6}$/i)
});

const cardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  account_id: z.number().positive('Selecione uma conta válida'),
  brand: z.string().min(1, 'Bandeira é obrigatória'),
  limit: z.number().min(0, 'O limite deve ser maior ou igual a zero'),
  closing_day: z.number().min(1, 'Dia de fechamento inválido').max(31, 'Dia de fechamento inválido'),
  due_day: z.number().min(1, 'Dia de vencimento inválido').max(31, 'Dia de vencimento inválido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida')
});

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  budget: z.number().min(0).optional().default(0)
});

const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    next(error);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'glick_secret_key_2026';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- MIDDLEWARE DE AUTENTICAÇÃO ---
  const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
      req.user = user;
      next();
    });
  };

  // --- API ROUTES (AUTH) ---
  
  app.post('/api/auth/register', validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userId] = await db('users').insert({
        name,
        email,
        password: hashedPassword
      });
      
      // Criar conta padrão para o novo usuário
      await db('accounts').insert({
        user_id: userId,
        name: 'Carteira Principal',
        type: 'checking',
        balance: 0,
        initial_balance: 0,
        color: '#2CC7FF'
      });

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: userId, name, email } });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  });

  app.post('/api/auth/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const user = await db('users').where('email', normalizedEmail).first();
      if (!user) {
        console.log(`Login failed: User ${normalizedEmail} not found`);
        return res.status(400).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log(`Login failed: Invalid password for ${email}`);
        return res.status(400).json({ error: 'Senha incorreta' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error('Login error details:', error);
      res.status(500).json({ error: 'Erro interno no servidor ao realizar login' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await db('users').where('id', req.user?.id).select('id', 'name', 'email').first();
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  });

  // --- API ROUTES (USER SETTINGS) ---
  app.get('/api/user/export', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    try {
      const data = {
        accounts: await db('accounts').where('user_id', userId),
        cards: await db('cards').where('user_id', userId),
        goals: await db('goals').where('user_id', userId),
        categories: await db('categories').where('user_id', userId),
        transactions: await db('transactions').where('user_id', userId),
        assets: await db('assets').where('user_id', userId),
        crypto_transactions: await db('crypto_transactions').where('user_id', userId),
        investment_transactions: await db('investment_transactions').where('user_id', userId),
        recurring_transactions: await db('recurring_transactions').where('user_id', userId),
        user_modules: await db('user_modules').where('user_id', userId),
      };
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao exportar dados' });
    }
  });

  app.delete('/api/user/reset', authenticateToken, async (req: AuthRequest, res) => {
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
        await trx('accounts').where('user_id', userId).delete();
        
        // Recriar conta padrão
        await trx('accounts').insert({
          user_id: userId,
          name: 'Carteira Principal',
          type: 'checking',
          balance: 0,
          initial_balance: 0,
          color: '#2CC7FF'
        });
      });
      res.json({ message: 'Dados resetados com sucesso' });
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      res.status(500).json({ error: 'Erro ao resetar dados' });
    }
  });

  app.put('/api/user/profile', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { name, email } = req.body;
    try {
      // Verificar se email já existe para outro usuário
      if (email) {
        const existing = await db('users').where('email', email).whereNot('id', userId).first();
        if (existing) return res.status(400).json({ error: 'Email já em uso' });
      }
      
      await db('users').where('id', userId).update({ name, email });
      const updatedUser = await db('users').where('id', userId).select('id', 'name', 'email').first();
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  });

  app.put('/api/user/password', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await db('users').where('id', userId).first();
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Senha atual incorreta' });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db('users').where('id', userId).update({ password: hashedNewPassword });
      
      res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  });

  // --- API ROUTES (MODULES) ---
  
  app.get('/api/modules', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const modules = await getUserModules(userId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar módulos' });
    }
  });

  app.post('/api/modules/:slug/activate', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { slug } = req.params;
      const { isTrial } = req.body;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      
      const result = await activateModule(userId, slug, isTrial !== false);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao ativar módulo' });
    }
  });

  app.post('/api/modules/:slug/deactivate', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { slug } = req.params;
      console.log(`[DEBUG] Deactivating module: ${slug} for user: ${userId}`);
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      
      const module = await db('modules').where('slug', slug).first();
      console.log(`[DEBUG] Found module:`, module);
      if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });

      const updateCount = await db('user_modules')
        .where({ user_id: userId, module_id: module.id })
        .update({ status: 'inactive' });
      
      console.log(`[DEBUG] Update count: ${updateCount}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[ERROR] Error deactivating module:', error);
      res.status(500).json({ error: 'Erro ao desativar módulo' });
    }
  });

  // --- API ROUTES (DATA - PROTECTED) ---
  
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await db.raw('SELECT 1');
      const isSqlite = db.client.config.client === 'better-sqlite3';
      res.json({ 
        status: 'ok', 
        message: 'Backend operacional',
        dbMode: isSqlite ? 'SQLite (Preview)' : 'MySQL (Production)',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Erro na conexão com o banco' });
    }
  });

  // 1. Resumo de Telemetria - REMOVIDO (Calculado no Cliente)

  // 2. Listar Transações
  app.get('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const transactions = await db('transactions')
        .select('transactions.*', 'accounts.name as account_name', 'cards.name as card_name')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .leftJoin('cards', 'transactions.card_id', 'cards.id')
        .where('accounts.user_id', userId)
        .orderBy('date', 'desc')
        .limit(1000);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // 3. Criar Transação
  app.post('/api/transactions', authenticateToken, validate(transactionSchema), async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autorizado' });
    
    try {
      const id = await validateAndRegisterTransaction(userId, req.body);
      res.status(201).json({ id, message: 'Transação registrada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      res.status(500).json({ error: error.message || 'Erro ao registrar transação' });
    }
  });

  app.put('/api/transactions/:id', authenticateToken, validate(transactionSchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { account_id, type, category, amount, date, description, status, destination_account_id, recurrence, card_id, goal_id } = req.body;
    const userId = req.user?.id;

    try {
      const transaction = await db('transactions')
        .select('transactions.*', 'accounts.user_id')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('transactions.id', id)
        .where('accounts.user_id', userId)
        .first();

      if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

      if (card_id) {
        const card = await db('cards').where({ id: card_id, user_id: userId }).first();
        if (!card) return res.status(403).json({ error: 'Acesso negado ao cartão' });
      }
      
      if (goal_id) {
        const goal = await db('goals').where({ id: goal_id, user_id: userId }).first();
        if (!goal) return res.status(403).json({ error: 'Acesso negado à meta' });
      }

      await db.transaction(async (trx) => {
        // 1. Reverter saldo antigo (apenas se confirmado ou conciliado e não for cartão)
        if (!transaction.card_id && (transaction.status === 'confirmed' || transaction.status === 'reconciled')) {
          const oldAdjustment = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          await trx('accounts').where('id', transaction.account_id).increment('balance', oldAdjustment);
          
          if (transaction.type === 'transfer' && transaction.destination_account_id) {
            await trx('accounts').where('id', transaction.destination_account_id).decrement('balance', transaction.amount);
          }
        }

        // 1.1 Reverter saldo da meta antigo
        if (transaction.goal_id) {
          let oldGoalAdjustment = 0;
          if (transaction.type === 'expense') {
            if (transaction.category === 'Aporte em Meta') {
              oldGoalAdjustment = -transaction.amount;
            } else {
              oldGoalAdjustment = transaction.amount;
            }
          } else if (transaction.type === 'income' && transaction.category === 'Resgate de Meta') {
            oldGoalAdjustment = transaction.amount;
          }
          
          if (oldGoalAdjustment !== 0) {
            await trx('goals').where('id', transaction.goal_id).increment('current_amount', oldGoalAdjustment);
          }
        }

        // 2. Aplicar novo saldo (apenas se confirmado ou conciliado e não for cartão)
        const newAccount = await trx('accounts').where({ id: account_id, user_id: userId }).first();
        if (!newAccount) throw new Error('Conta de origem inválida');

        if (status === 'confirmed' || status === 'reconciled') {
          if (type === 'transfer') {
            if (!destination_account_id) throw new Error('Conta de destino necessária');
            const destAccount = await trx('accounts').where({ id: destination_account_id, user_id: userId }).first();
            if (!destAccount) throw new Error('Conta de destino inválida');

            await trx('accounts').where('id', account_id).decrement('balance', amount);
            await trx('accounts').where('id', destination_account_id).increment('balance', amount);
          } else if (!card_id) { // Só ajusta saldo se não for cartão
            const newAdjustment = type === 'income' ? amount : -amount;
            await trx('accounts').where('id', account_id).increment('balance', newAdjustment);
          }

          // 2.1 Aplicar novo saldo da meta
          if (goal_id) {
            let newGoalAdjustment = 0;
            if (type === 'expense') {
              if (category === 'Aporte em Meta') {
                newGoalAdjustment = amount;
              } else {
                newGoalAdjustment = -amount;
              }
            } else if (type === 'income' && category === 'Resgate de Meta') {
              newGoalAdjustment = -amount;
            }
            
            if (newGoalAdjustment !== 0) {
              await trx('goals').where('id', goal_id).increment('current_amount', newGoalAdjustment);
            }
          }
        }

        // 3. Atualizar registro
        await trx('transactions').where('id', id).update({
          account_id, type, category, amount, date, description, status, destination_account_id: destination_account_id || null, recurrence, card_id: card_id || null, goal_id: goal_id || null
        });
      });

      res.json({ message: 'Transação atualizada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar transação' });
    }
  });

  // 4. Listar Contas
  app.get('/api/accounts', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const accounts = await db('accounts').where('user_id', userId).select('*');
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar contas' });
    }
  });

  app.post('/api/accounts', authenticateToken, validate(accountSchema), async (req: AuthRequest, res) => {
    const { name, type, balance, initial_balance, color } = req.body;
    const userId = req.user?.id;
    try {
      const [id] = await db('accounts').insert({
        user_id: userId,
        name,
        type,
        balance,
        initial_balance: initial_balance || 0,
        color
      });
      res.status(201).json({ id, name, type, balance, initial_balance: initial_balance || 0, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  });

  app.put('/api/accounts/:id', authenticateToken, validate(accountSchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, type, balance, initial_balance, color } = req.body;
    const userId = req.user?.id;
    try {
      const updated = await db('accounts')
        .where({ id, user_id: userId })
        .update({ name, type, balance, initial_balance, color });
      
      if (!updated) return res.status(404).json({ error: 'Conta não encontrada' });
      res.json({ id, name, type, balance, initial_balance, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
  });

  // Recalcular saldo baseado em transações confirmadas
  app.post('/api/accounts/:id/recalculate', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const account = await db('accounts').where({ id, user_id: userId }).first();
      if (!account) return res.status(404).json({ error: 'Conta não encontrada' });

      // Somar todas as transações confirmadas ou conciliadas que NÃO são de cartão de crédito
      const transactions = await db('transactions')
        .where('account_id', id)
        .whereIn('status', ['confirmed', 'reconciled'])
        .whereNull('card_id')
        .select('type', 'amount', 'destination_account_id');

      let totalAdjustment = 0;
      for (const t of transactions) {
        if (t.type === 'income') {
          totalAdjustment += t.amount;
        } else if (t.type === 'expense') {
          totalAdjustment -= t.amount;
        } else if (t.type === 'transfer') {
          // Se for a conta de origem da transferência
          totalAdjustment -= t.amount;
        }
      }

      // Somar transferências onde esta conta é o destino
      const incomingTransfers = await db('transactions')
        .where('destination_account_id', id)
        .whereIn('status', ['confirmed', 'reconciled'])
        .where('type', 'transfer')
        .sum('amount as total')
        .first();

      const incomingTotal = incomingTransfers?.total || 0;
      const newBalance = Number(account.initial_balance) + totalAdjustment + Number(incomingTotal);

      await db('accounts').where('id', id).update({ balance: newBalance });

      res.json({ id, balance: newBalance });
    } catch (error) {
      console.error('Erro ao recalcular saldo:', error);
      res.status(500).json({ error: 'Erro ao recalcular saldo' });
    }
  });

  app.delete('/api/accounts/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    try {
      await db.transaction(async (trx) => {
        // 1. Verificar se a conta pertence ao usuário
        const account = await trx('accounts').where({ id, user_id: userId }).first();
        if (!account) {
          throw new Error('ACCOUNT_NOT_FOUND');
        }

        // 2. Remover transações vinculadas (origem ou destino)
        await trx('transactions')
          .where('account_id', id)
          .orWhere('destination_account_id', id)
          .delete();

        // 3. Remover cartões vinculados
        await trx('cards').where('account_id', id).delete();

        // 4. Remover transações recorrentes vinculadas
        await trx('recurring_transactions').where('account_id', id).delete();

        // 5. Finalmente, excluir a conta
        await trx('accounts').where({ id, user_id: userId }).delete();
      });

      res.json({ message: 'Conta e todos os dados vinculados foram excluídos com sucesso.' });
    } catch (error: any) {
      if (error.message === 'ACCOUNT_NOT_FOUND') {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }
      console.error('Erro ao excluir conta (Cascade):', error);
      res.status(500).json({ error: 'Erro interno ao processar exclusão em cascata.' });
    }
  });

  // 8. Listar Cartões
  app.get('/api/cards', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const cards = await db('cards')
        .select('cards.*', 'accounts.name as account_name')
        .join('accounts', 'cards.account_id', 'accounts.id')
        .where('cards.user_id', userId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cartões' });
    }
  });

  app.post('/api/cards', authenticateToken, validate(cardSchema), async (req: AuthRequest, res) => {
    const { name, account_id, brand, limit, closing_day, due_day, color } = req.body;
    const userId = req.user?.id;
    try {
      // Verificar se a conta pertence ao usuário
      const account = await db('accounts').where({ id: account_id, user_id: userId }).first();
      if (!account) return res.status(403).json({ error: 'Acesso negado à conta vinculada' });

      const [id] = await db('cards').insert({
        user_id: userId,
        account_id,
        name,
        brand,
        limit,
        closing_day,
        due_day,
        color,
        current_bill: 0
      });
      res.status(201).json({ id, name, brand, limit, closing_day, due_day, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar cartão' });
    }
  });

  app.put('/api/cards/:id', authenticateToken, validate(cardSchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, account_id, brand, limit, closing_day, due_day, color } = req.body;
    const userId = req.user?.id;
    try {
      const account = await db('accounts').where({ id: account_id, user_id: userId }).first();
      if (!account) return res.status(403).json({ error: 'Acesso negado à conta vinculada' });

      const updated = await db('cards')
        .where({ id, user_id: userId })
        .update({ name, account_id, brand, limit, closing_day, due_day, color });
      
      if (!updated) return res.status(404).json({ error: 'Cartão não encontrado' });
      res.json({ id, name, brand, limit, closing_day, due_day, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar cartão' });
    }
  });

  app.delete('/api/cards/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const linkedTransactions = await db('transactions').where('card_id', id).first();
      if (linkedTransactions) {
        return res.status(400).json({ error: 'Não é possível excluir um cartão com transações vinculadas.' });
      }

      const deleted = await db('cards').where({ id, user_id: userId }).delete();
      if (!deleted) return res.status(404).json({ error: 'Cartão não encontrado' });
      res.json({ message: 'Cartão excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir cartão' });
    }
  });

  // 9. Listar Metas
  app.get('/api/goals', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const goals = await db('goals').where('user_id', userId).select('*');
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar metas' });
    }
  });

  app.post('/api/goals', authenticateToken, validate(goalSchema), async (req: AuthRequest, res) => {
    const { name, target_amount, current_amount, deadline, color } = req.body;
    const userId = req.user?.id;
    try {
      const [id] = await db('goals').insert({
        user_id: userId,
        name,
        target_amount,
        current_amount: current_amount || 0,
        deadline,
        color
      });
      res.status(201).json({ id, name, target_amount, current_amount: current_amount || 0, deadline, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar meta' });
    }
  });

  app.put('/api/goals/:id', authenticateToken, validate(goalSchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline, color } = req.body;
    const userId = req.user?.id;
    try {
      const updateData: any = { name, target_amount, deadline, color };
      if (current_amount !== undefined) {
        updateData.current_amount = current_amount;
      }
      
      const updated = await db('goals')
        .where({ id, user_id: userId })
        .update(updateData);
      
      if (!updated) return res.status(404).json({ error: 'Meta não encontrada' });
      res.json({ id, ...updateData });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
  });

  app.delete('/api/goals/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const linkedTransactions = await db('transactions').where('goal_id', id).first();
      if (linkedTransactions) {
        return res.status(400).json({ error: 'Não é possível excluir uma meta com transações vinculadas.' });
      }

      const deleted = await db('goals').where({ id, user_id: userId }).delete();
      if (!deleted) return res.status(404).json({ error: 'Meta não encontrada' });
      res.json({ message: 'Meta excluída com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir meta' });
    }
  });

  // 10. Listar Categorias
  app.get('/api/categories', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const categories = await db('categories').where('user_id', userId).select('*');
      
      // Calcular gastos reais por categoria no mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const expensesByCategory = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('accounts.user_id', userId)
        .where('transactions.type', 'expense')
        .where('transactions.date', '>=', startOfMonth.toISOString().split('T')[0])
        .select('category')
        .sum('amount as total')
        .groupBy('category');

      const enrichedCategories = categories.map(cat => {
        const expense = expensesByCategory.find(e => e.category === cat.name);
        return {
          ...cat,
          spent: expense?.total || 0
        };
      });

      res.json(enrichedCategories);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  });

  app.post('/api/categories', authenticateToken, validate(categorySchema), async (req: AuthRequest, res) => {
    const { name, type, color, budget } = req.body;
    const userId = req.user?.id;
    try {
      const [id] = await db('categories').insert({
        user_id: userId,
        name,
        type,
        color,
        budget: budget || 0
      });
      res.status(201).json({ id, name, type, color, budget: budget || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  });

  app.put('/api/categories/:id', authenticateToken, validate(categorySchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, type, color, budget } = req.body;
    const userId = req.user?.id;
    try {
      const updated = await db('categories')
        .where({ id, user_id: userId })
        .update({ name, type, color, budget: budget || 0 });
      
      if (!updated) return res.status(404).json({ error: 'Categoria não encontrada' });
      res.json({ id, name, type, color, budget: budget || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  });

  app.delete('/api/categories/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const deleted = await db('categories').where({ id, user_id: userId }).delete();
      if (!deleted) return res.status(404).json({ error: 'Categoria não encontrada' });
      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
  });

  // 11. Relatórios (Dados agregados) - REMOVIDO (Calculado no Cliente)


  // 12. Deletar Transação
  app.delete('/api/transactions/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const transaction = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('transactions.id', id)
        .where('accounts.user_id', userId)
        .first();

      if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

      await db.transaction(async (trx) => {
        // Reverter saldo da conta apenas se confirmado ou conciliado
        if (transaction.status === 'confirmed' || transaction.status === 'reconciled') {
          if (transaction.card_id) {
            // Reverter fatura do cartão
            const cardAdjustment = transaction.type === 'income' ? transaction.amount : -transaction.amount;
            await trx('cards').where('id', transaction.card_id).increment('current_bill', cardAdjustment);
          } else {
            const adjustment = transaction.type === 'income' ? -transaction.amount : transaction.amount;
            await trx('accounts').where('id', transaction.account_id).increment('balance', adjustment);
            
            // Se for transferência, reverter conta destino também
            if (transaction.type === 'transfer' && transaction.destination_account_id) {
              await trx('accounts').where('id', transaction.destination_account_id).decrement('balance', transaction.amount);
            }
          }

          // Reverter saldo da meta se presente
          if (transaction.goal_id) {
            let goalAdjustment = 0;
            if (transaction.type === 'expense') {
              if (transaction.category === 'Aporte em Meta') {
                goalAdjustment = -transaction.amount;
              } else {
                goalAdjustment = transaction.amount;
              }
            } else if (transaction.type === 'income' && transaction.category === 'Resgate de Meta') {
              goalAdjustment = transaction.amount;
            }
            
            if (goalAdjustment !== 0) {
              await trx('goals').where('id', transaction.goal_id).increment('current_amount', goalAdjustment);
            }
          }
        }

        await trx('transactions').where('id', id).delete();
      });

      res.json({ message: 'Transação removida com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar transação' });
    }
  });

  // --- CORE FINANCE ENGINE ENDPOINTS ---
  app.get('/api/finance/core-stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      
      const stats = await calculateCoreStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular estatísticas core' });
    }
  });

  app.patch('/api/transactions/:id/reconcile', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      const updated = await db('transactions')
        .where({ id, user_id: userId })
        .update({ status: 'reconciled' });
      
      if (!updated) return res.status(404).json({ error: 'Transação não encontrada' });
      res.json({ success: true, status: 'reconciled' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao conciliar transação' });
    }
  });

  // --- RECURRING TRANSACTIONS ---
  app.get('/api/recurring-transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const items = await db('recurring_transactions').where('user_id', userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações recorrentes' });
    }
  });

  app.post('/api/recurring-transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const [id] = await db('recurring_transactions').insert({
        ...req.body,
        user_id: userId
      });
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar transação recorrente' });
    }
  });

  app.delete('/api/recurring-transactions/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      await db('recurring_transactions').where({ id: req.params.id, user_id: userId }).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir transação recorrente' });
    }
  });

  // --- FORECASTS ---
  app.get('/api/forecasts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const items = await db('forecasts').where('user_id', userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar previsões' });
    }
  });

  app.post('/api/forecasts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const [id] = await db('forecasts').insert({
        ...req.body,
        user_id: userId
      });
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar previsão' });
    }
  });

  app.delete('/api/forecasts/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      await db('forecasts').where({ id: req.params.id, user_id: userId }).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir previsão' });
    }
  });

  // --- CRYPTO API ---
  app.get('/api/crypto/assets', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const assets = await db('assets').where({ user_id: userId, type: 'crypto' });
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar ativos' });
    }
  });

  app.post('/api/crypto/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      
      const { symbol, name, type, quantity, price_at_time, fee, date, account_id } = req.body;
      
      await db.transaction(async (trx) => {
        let asset = await trx('assets').where({ user_id: userId, symbol, type: 'crypto' }).first();
        
        if (!asset) {
          if (type !== 'buy') throw new Error('Ativo não encontrado para venda');
          const [assetId] = await trx('assets').insert({
            user_id: userId,
            name,
            symbol,
            type: 'crypto',
            quantity: 0,
            average_price: 0,
            current_price: price_at_time
          });
          asset = { id: assetId, quantity: 0, average_price: 0 };
        }
        
        const q = Number(quantity);
        const p = Number(price_at_time);
        const f = Number(fee || 0);
        const totalValue = (q * p) + (type === 'buy' ? f : -f);
        
        // Update core balance if account_id is provided
        if (account_id) {
          const account = await trx('accounts').where({ id: account_id, user_id: userId }).first();
          if (!account) throw new Error('Conta não encontrada');
          
          const transType = type === 'buy' ? 'expense' : 'income';
          
          await trx('transactions').insert({
            user_id: userId,
            account_id,
            type: transType,
            amount: totalValue,
            description: `${type === 'buy' ? 'Compra' : 'Venda'} de ${q} ${symbol}`,
            category: 'Investimentos',
            date,
            status: 'completed',
            reconciled: 1
          });
          
          const newBalance = transType === 'income' 
            ? Number(account.balance) + totalValue 
            : Number(account.balance) - totalValue;
            
          await trx('accounts').where('id', account_id).update({ balance: newBalance });
        }
        
        let newQuantity = Number(asset.quantity);
        let newAvgPrice = Number(asset.average_price);
        
        if (type === 'buy') {
          const totalCost = (newQuantity * newAvgPrice) + (q * p);
          newQuantity += q;
          newAvgPrice = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else if (type === 'sell') {
          if (newQuantity < q) throw new Error('Quantidade insuficiente');
          newQuantity -= q;
          if (newQuantity === 0) newAvgPrice = 0;
        }
        
        await trx('assets').where('id', asset.id).update({
          quantity: newQuantity,
          average_price: newAvgPrice,
          current_price: p
        });
        
        await trx('crypto_transactions').insert({
          user_id: userId,
          asset_id: asset.id,
          type,
          quantity: q,
          price_at_time: p,
          fee: f,
          date
        });
      });
      
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao registrar transação cripto' });
    }
  });
  
  app.get('/api/crypto/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const transactions = await db('crypto_transactions')
        .join('assets', 'crypto_transactions.asset_id', '=', 'assets.id')
        .where('crypto_transactions.user_id', userId)
        .select('crypto_transactions.*', 'assets.symbol', 'assets.name')
        .orderBy('date', 'desc');
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // --- INVESTMENTS API ---
  app.get('/api/investments/assets', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const assets = await db('assets').where({ user_id: userId }).whereIn('type', ['fixed_income', 'stocks', 'funds', 'real_estate']);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar investimentos' });
    }
  });

  app.post('/api/investments/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      
      const { symbol, name, type, assetType, quantity, price_at_time, fee, date, account_id } = req.body;
      
      await db.transaction(async (trx) => {
        let asset = await trx('assets').where({ user_id: userId, symbol, type: assetType }).first();
        
        if (!asset) {
          if (type !== 'buy') throw new Error('Ativo não encontrado para venda/rendimento');
          const [assetId] = await trx('assets').insert({
            user_id: userId,
            name,
            symbol,
            type: assetType,
            quantity: 0,
            average_price: 0,
            current_price: price_at_time
          });
          asset = { id: assetId, quantity: 0, average_price: 0 };
        }
        
        const q = Number(quantity);
        const p = Number(price_at_time);
        const f = Number(fee || 0);
        const totalValue = (q * p) + (type === 'buy' ? f : -f);
        
        // Update core balance if account_id is provided
        if (account_id) {
          const account = await trx('accounts').where({ id: account_id, user_id: userId }).first();
          if (!account) throw new Error('Conta não encontrada');
          
          let transType = 'expense';
          let description = '';
          
          if (type === 'buy') {
            transType = 'expense';
            description = `Compra de ${q} ${symbol}`;
          } else if (type === 'sell') {
            transType = 'income';
            description = `Venda de ${q} ${symbol}`;
          } else if (type === 'yield' || type === 'dividend') {
            transType = 'income';
            description = `Rendimento/Dividendo de ${symbol}`;
          }
          
          await trx('transactions').insert({
            user_id: userId,
            account_id,
            type: transType,
            amount: totalValue,
            description,
            category: 'Investimentos',
            date,
            status: 'completed',
            reconciled: 1
          });
          
          const newBalance = transType === 'income' 
            ? Number(account.balance) + totalValue 
            : Number(account.balance) - totalValue;
            
          await trx('accounts').where('id', account_id).update({ balance: newBalance });
        }
        
        let newQuantity = Number(asset.quantity);
        let newAvgPrice = Number(asset.average_price);
        
        if (type === 'buy') {
          const totalCost = (newQuantity * newAvgPrice) + (q * p);
          newQuantity += q;
          newAvgPrice = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else if (type === 'sell') {
          if (newQuantity < q) throw new Error('Quantidade insuficiente');
          newQuantity -= q;
          if (newQuantity === 0) newAvgPrice = 0;
        }
        // yield/dividend doesn't change quantity or average price
        
        await trx('assets').where('id', asset.id).update({
          quantity: newQuantity,
          average_price: newAvgPrice,
          current_price: p
        });
        
        await trx('investment_transactions').insert({
          user_id: userId,
          asset_id: asset.id,
          type,
          quantity: q,
          price_at_time: p,
          fee: f,
          date
        });
      });
      
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao registrar transação de investimento' });
    }
  });
  
  app.get('/api/investments/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado' });
      const transactions = await db('investment_transactions')
        .join('assets', 'investment_transactions.asset_id', '=', 'assets.id')
        .where('investment_transactions.user_id', userId)
        .select('investment_transactions.*', 'assets.symbol', 'assets.name', 'assets.type as asset_type')
        .orderBy('date', 'desc');
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📡 Pronto para conectar ao banco SQL na Hostinger`);
  });
}

startServer();
