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
  status: z.enum(['confirmed', 'pending']).default('confirmed'),
  recurrence: z.enum(['none', 'monthly', 'weekly', 'yearly']).optional().default('none'),
  card_id: z.number().positive().optional().nullable(),
  goal_id: z.number().positive().optional().nullable()
});

const accountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.number(),
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
  name: z.string().min(1),
  account_id: z.number().positive(),
  brand: z.string().min(1),
  limit: z.number().positive(),
  closing_day: z.number().min(1).max(31),
  due_day: z.number().min(1).max(31),
  color: z.string().regex(/^#[0-9A-F]{6}$/i)
});

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i)
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
    try {
      const user = await db('users').where('email', email).first();
      if (!user) {
        console.log(`Login failed: User ${email} not found`);
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

  // --- API ROUTES (DATA - PROTECTED) ---
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend SQL operacional' });
  });

  // 1. Resumo de Telemetria - REMOVIDO (Calculado no Cliente)

  // 2. Listar Transações
  app.get('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const transactions = await db('transactions')
        .select('transactions.*', 'accounts.name as account_name')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('accounts.user_id', userId)
        .orderBy('date', 'desc')
        .limit(50);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // 3. Criar Transação
  app.post('/api/transactions', authenticateToken, validate(transactionSchema), async (req: AuthRequest, res) => {
    const { account_id, type, category, amount, date, description, status, destination_account_id, recurrence, card_id, goal_id } = req.body;
    const userId = req.user?.id;
    
    try {
      // Verificar se a conta pertence ao usuário
      const account = await db('accounts').where({ id: account_id, user_id: userId }).first();
      if (!account) return res.status(403).json({ error: 'Acesso negado à conta de origem' });

      if (card_id) {
        const card = await db('cards').where({ id: card_id, user_id: userId }).first();
        if (!card) return res.status(403).json({ error: 'Acesso negado ao cartão' });
      }
      
      if (goal_id) {
        const goal = await db('goals').where({ id: goal_id, user_id: userId }).first();
        if (!goal) return res.status(403).json({ error: 'Acesso negado à meta' });
      }

      if (type === 'transfer') {
        if (!destination_account_id) return res.status(400).json({ error: 'Conta de destino necessária para transferência' });
        const destAccount = await db('accounts').where({ id: destination_account_id, user_id: userId }).first();
        if (!destAccount) return res.status(403).json({ error: 'Acesso negado à conta de destino' });

        await db.transaction(async (trx) => {
          // Registro da saída (a transferência aparece como um único registro no banco com destino)
          await trx('transactions').insert({
            account_id, 
            type: 'transfer', 
            category: 'Transferência', 
            amount, 
            date, 
            description: description || `Transferência para ${destAccount.name}`, 
            status: status || 'confirmed',
            destination_account_id,
            recurrence: recurrence || 'none'
          });

          // Atualizar saldos
          await trx('accounts').where('id', account_id).decrement('balance', amount);
          await trx('accounts').where('id', destination_account_id).increment('balance', amount);
        });
      } else {
        await db.transaction(async (trx) => {
          await trx('transactions').insert({
            account_id, type, category, amount, date, description, status: status || 'confirmed', recurrence: recurrence || 'none', card_id: card_id || null, goal_id: goal_id || null
          });

          // Se for gasto no cartão, não desconta da conta agora. A fatura será paga depois.
          if (!card_id) {
            const adjustment = type === 'income' ? amount : -amount;
            await trx('accounts')
              .where('id', account_id)
              .increment('balance', adjustment);
          }
        });
      }

      res.status(201).json({ message: 'Transação registrada com sucesso' });
    } catch (error) {
      console.error('Erro ao registrar transação:', error);
      res.status(500).json({ error: 'Erro ao registrar transação' });
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
        // 1. Reverter saldo antigo (apenas se não for cartão)
        if (!transaction.card_id) {
          const oldAdjustment = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          await trx('accounts').where('id', transaction.account_id).increment('balance', oldAdjustment);
          
          if (transaction.type === 'transfer' && transaction.destination_account_id) {
            await trx('accounts').where('id', transaction.destination_account_id).decrement('balance', transaction.amount);
          }
        }

        // 2. Aplicar novo saldo
        const newAccount = await trx('accounts').where({ id: account_id, user_id: userId }).first();
        if (!newAccount) throw new Error('Conta de origem inválida');

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
    const { name, type, balance, color } = req.body;
    const userId = req.user?.id;
    try {
      const [id] = await db('accounts').insert({
        user_id: userId,
        name,
        type,
        balance,
        color
      });
      res.status(201).json({ id, name, type, balance, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  });

  app.put('/api/accounts/:id', authenticateToken, validate(accountSchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, type, balance, color } = req.body;
    const userId = req.user?.id;
    try {
      const updated = await db('accounts')
        .where({ id, user_id: userId })
        .update({ name, type, balance, color });
      
      if (!updated) return res.status(404).json({ error: 'Conta não encontrada' });
      res.json({ id, name, type, balance, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
  });

  app.delete('/api/accounts/:id', authenticateToken, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      // 1. Verificar se existem transações vinculadas
      const transactions = await db('transactions')
        .where('account_id', id)
        .orWhere('destination_account_id', id)
        .first();
      
      if (transactions) {
        return res.status(400).json({ error: 'Não é possível excluir conta com transações vinculadas. Remova as transações primeiro.' });
      }

      // 2. Verificar se existem cartões vinculados
      const cards = await db('cards').where('account_id', id).first();
      if (cards) {
        return res.status(400).json({ error: 'Esta conta possui cartões de crédito vinculados. Remova os cartões primeiro.' });
      }

      const deleted = await db('accounts').where({ id, user_id: userId }).delete();
      if (!deleted) return res.status(404).json({ error: 'Conta não encontrada' });
      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      res.status(500).json({ error: 'Erro ao excluir conta' });
    }
  });

  // 5. Catálogo de Módulos
  app.get('/api/modules', authenticateToken, async (req, res) => {
    try {
      const modules = await db('modules').select('*');
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar catálogo de módulos' });
    }
  });

  // 6. Módulos Instalados pelo Usuário
  app.get('/api/user/modules', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const installed = await db('user_modules')
        .join('modules', 'user_modules.module_id', 'modules.id')
        .where('user_modules.user_id', userId)
        .select('modules.*', 'user_modules.status', 'user_modules.trial_ends_at');
      res.json(installed);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar módulos do usuário' });
    }
  });

  // 7. Instalar/Ativar Módulo (Trial)
  app.post('/api/user/modules/install', authenticateToken, async (req: AuthRequest, res) => {
    const { module_id } = req.body;
    const userId = req.user?.id;

    try {
      const module = await db('modules').where('id', module_id).first();
      if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });

      // Verificar se já tem o módulo
      const existing = await db('user_modules').where({ user_id: userId, module_id }).first();
      if (existing) return res.status(400).json({ error: 'Módulo já instalado' });

      const trialDays = module.trial_days || 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      await db('user_modules').insert({
        user_id: userId,
        module_id,
        status: 'trial',
        trial_ends_at: trialEndsAt,
        activated_at: new Date()
      });

      res.json({ message: `Módulo ${module.name} instalado em modo de teste!` });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao instalar módulo' });
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
    const { name, type, color } = req.body;
    const userId = req.user?.id;
    try {
      const [id] = await db('categories').insert({
        user_id: userId,
        name,
        type,
        color,
        budget: 0
      });
      res.status(201).json({ id, name, type, color });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  });

  app.put('/api/categories/:id', authenticateToken, validate(categorySchema), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, type, color } = req.body;
    const userId = req.user?.id;
    try {
      const updated = await db('categories')
        .where({ id, user_id: userId })
        .update({ name, type, color });
      
      if (!updated) return res.status(404).json({ error: 'Categoria não encontrada' });
      res.json({ id, name, type, color });
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
        // Reverter saldo da conta
        const adjustment = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        await trx('accounts').where('id', transaction.account_id).increment('balance', adjustment);
        
        // Se for transferência, reverter conta destino também
        if (transaction.type === 'transfer' && transaction.destination_account_id) {
          await trx('accounts').where('id', transaction.destination_account_id).decrement('balance', transaction.amount);
        }

        await trx('transactions').where('id', id).delete();
      });

      res.json({ message: 'Transação removida com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar transação' });
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
