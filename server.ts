import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import bcryptjs from 'bcryptjs';
const bcrypt = (bcryptjs as any).default || bcryptjs;
import jwt from 'jsonwebtoken';
import db from './src/lib/db.js';

dotenv.config();

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
  
  app.post('/api/auth/register', async (req, res) => {
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

  app.post('/api/auth/login', async (req, res) => {
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

  // 1. Resumo de Telemetria (TopBar)
  app.get('/api/summary', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    try {
      const income = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('accounts.user_id', userId)
        .where('transactions.type', 'income')
        .sum('transactions.amount as total').first();

      const expenses = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('accounts.user_id', userId)
        .where('transactions.type', 'expense')
        .sum('transactions.amount as total').first();

      const accounts = await db('accounts')
        .where('user_id', userId)
        .sum('balance as total').first();

      res.json({
        totalBalance: accounts?.total || 0,
        monthlyIncome: income?.total || 0,
        monthlyExpenses: expenses?.total || 0,
        projectedBalance: (Number(accounts?.total) || 0) + (Number(income?.total) || 0) - (Number(expenses?.total) || 0),
        freeCapital: (Number(accounts?.total) || 0) * 0.4
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular resumo' });
    }
  });

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
  app.post('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
    const { account_id, type, category, amount, date, description, status, destination_account_id } = req.body;
    const userId = req.user?.id;
    
    try {
      // Verificar se a conta pertence ao usuário
      const account = await db('accounts').where({ id: account_id, user_id: userId }).first();
      if (!account) return res.status(403).json({ error: 'Acesso negado à conta de origem' });

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
            destination_account_id
          });

          // Atualizar saldos
          await trx('accounts').where('id', account_id).decrement('balance', amount);
          await trx('accounts').where('id', destination_account_id).increment('balance', amount);
        });
      } else {
        await db.transaction(async (trx) => {
          await trx('transactions').insert({
            account_id, type, category, amount, date, description, status: status || 'confirmed'
          });

          const adjustment = type === 'income' ? amount : -amount;
          await trx('accounts')
            .where('id', account_id)
            .increment('balance', adjustment);
        });
      }

      res.status(201).json({ message: 'Transação registrada com sucesso' });
    } catch (error) {
      console.error('Erro ao registrar transação:', error);
      res.status(500).json({ error: 'Erro ao registrar transação' });
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
