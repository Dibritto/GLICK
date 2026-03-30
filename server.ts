import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import db from './src/lib/db.ts';
import authRoutes from './src/routes/authRoutes.ts';
import transactionRoutes from './src/routes/transactionRoutes.ts';
import accountRoutes from './src/routes/accountRoutes.ts';
import cryptoRoutes from './src/routes/cryptoRoutes.ts';
import investmentRoutes from './src/routes/investmentRoutes.ts';
import userRoutes from './src/routes/userRoutes.ts';
import moduleRoutes from './src/routes/moduleRoutes.ts';
import cardRoutes from './src/routes/cardRoutes.ts';
import goalRoutes from './src/routes/goalRoutes.ts';
import categoryRoutes from './src/routes/categoryRoutes.ts';
import financeRoutes from './src/routes/financeRoutes.ts';
import recurringTransactionRoutes from './src/routes/recurringTransactionRoutes.ts';
import forecastRoutes from './src/routes/forecastRoutes.ts';
import marketRoutes from './src/routes/marketRoutes.ts';

import { authenticateToken } from './src/middleware/authMiddleware.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES (AUTH) ---
  app.use('/api/auth', authRoutes);

  // --- API ROUTES DELEGATION (PROTECTED) ---
  app.use('/api/user', authenticateToken, userRoutes);
  app.use('/api/transactions', authenticateToken, transactionRoutes);
  app.use('/api/accounts', authenticateToken, accountRoutes);
  app.use('/api/crypto', authenticateToken, cryptoRoutes);
  app.use('/api/investments', authenticateToken, investmentRoutes);
  app.use('/api/modules', authenticateToken, moduleRoutes);
  app.use('/api/cards', authenticateToken, cardRoutes);
  app.use('/api/goals', authenticateToken, goalRoutes);
  app.use('/api/categories', authenticateToken, categoryRoutes);
  app.use('/api/finance', authenticateToken, financeRoutes);
  app.use('/api/recurring-transactions', authenticateToken, recurringTransactionRoutes);
  app.use('/api/forecasts', authenticateToken, forecastRoutes);
  app.use('/api/market', authenticateToken, marketRoutes);

  // 404 for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Rota da API não encontrada' });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro global:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.destroy().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  db.destroy().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

startServer();
