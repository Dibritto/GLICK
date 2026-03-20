import db from './src/lib/db.js';

async function fix() {
  console.log('Fixing modules...');
  await db('user_modules').del();
  await db('modules').del();
  
  // Reset auto-increment (SQLite specific)
  await db.raw("DELETE FROM sqlite_sequence WHERE name='modules'");
  await db.raw("DELETE FROM sqlite_sequence WHERE name='user_modules'");

  await db('modules').insert([
    { name: 'Financeiro', slug: 'core', description: 'Gestão essencial de contas, transações e metas', icon: 'LayoutDashboard', price: 0 },
    { name: 'Cripto', slug: 'crypto', description: 'Gestão de ativos digitais e P&L', icon: 'Zap', price: 29.90 },
    { name: 'Investimentos', slug: 'investments', description: 'Renda fixa, ações e fundos', icon: 'TrendingUp', price: 39.90 }
  ]);
  
  await db('user_modules').insert({
    user_id: 1,
    module_id: 1, // Now this is 'core'
    status: 'active',
    activated_at: new Date().toISOString()
  });

  console.log('Fixed!');
  process.exit(0);
}

fix();
