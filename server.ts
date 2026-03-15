import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './src/lib/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend SQL operacional' });
  });

  // 1. Resumo de Telemetria (TopBar)
  app.get('/api/summary', async (req, res) => {
    try {
      const income = await db('transactions').where('type', 'income').sum('amount as total').first();
      const expenses = await db('transactions').where('type', 'expense').sum('amount as total').first();
      const accounts = await db('accounts').sum('balance as total').first();

      res.json({
        totalBalance: accounts?.total || 0,
        monthlyIncome: income?.total || 0,
        monthlyExpenses: expenses?.total || 0,
        projectedBalance: (accounts?.total || 0) + (income?.total || 0) - (expenses?.total || 0),
        freeCapital: (accounts?.total || 0) * 0.4 // Exemplo de lógica: 40% livre
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular resumo' });
    }
  });

  // 2. Listar Transações
  app.get('/api/transactions', async (req, res) => {
    try {
      const transactions = await db('transactions')
        .select('transactions.*', 'accounts.name as account_name')
        .leftJoin('accounts', 'transactions.account_id', 'accounts.id')
        .orderBy('date', 'desc')
        .limit(50);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  // 3. Criar Transação
  app.post('/api/transactions', async (req, res) => {
    const { account_id, type, category, amount, date, description, status } = req.body;
    
    try {
      await db.transaction(async (trx) => {
        // Inserir transação
        await trx('transactions').insert({
          account_id, type, category, amount, date, description, status: status || 'pending'
        });

        // Atualizar saldo da conta
        const adjustment = type === 'income' ? amount : -amount;
        await trx('accounts')
          .where('id', account_id)
          .increment('balance', adjustment);
      });

      res.status(201).json({ message: 'Transação registrada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao registrar transação' });
    }
  });

  // 4. Listar Contas
  app.get('/api/accounts', async (req, res) => {
    try {
      const accounts = await db('accounts').select('*');
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar contas' });
    }
  });

  // 5. Catálogo de Módulos
  app.get('/api/modules', async (req, res) => {
    try {
      const modules = await db('modules').select('*');
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar catálogo de módulos' });
    }
  });

  // 6. Módulos Instalados pelo Usuário (Simulando user_id 1 por enquanto)
  app.get('/api/user/modules', async (req, res) => {
    try {
      const installed = await db('user_modules')
        .join('modules', 'user_modules.module_id', 'modules.id')
        .where('user_modules.user_id', 1)
        .select('modules.*', 'user_modules.status', 'user_modules.trial_ends_at');
      res.json(installed);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar módulos do usuário' });
    }
  });

  // 7. Instalar/Ativar Módulo (Trial)
  app.post('/api/user/modules/install', async (req, res) => {
    const { module_id } = req.body;
    const user_id = 1; // Simulação

    try {
      const module = await db('modules').where('id', module_id).first();
      if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });

      const trialDays = module.trial_days || 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      await db('user_modules').insert({
        user_id,
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
