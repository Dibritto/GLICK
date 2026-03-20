import db from './src/lib/db.js';

async function init() {
  console.log('🛠️ Iniciando estruturação do banco de dados...');

  try {
    // Tabela de Usuários
    if (!await db.schema.hasTable('users')) {
      await db.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [users] criada.');
    }

    // Tabela de Contas
    if (!await db.schema.hasTable('accounts')) {
      await db.schema.createTable('accounts', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('name').notNullable();
        table.string('type').notNullable(); // checking, savings, etc
        table.decimal('balance', 15, 2).defaultTo(0);
        table.decimal('initial_balance', 15, 2).defaultTo(0);
        table.string('color').defaultTo('#2CC7FF');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [accounts] criada.');
    } else {
      // Adicionar coluna se não existir
      const hasInitialBalance = await db.schema.hasColumn('accounts', 'initial_balance');
      if (!hasInitialBalance) {
        await db.schema.alterTable('accounts', table => {
          table.decimal('initial_balance', 15, 2).defaultTo(0);
        });
        console.log('✅ Coluna [initial_balance] adicionada à tabela [accounts].');
      }
    }

    // Tabela de Transações
    if (!await db.schema.hasTable('transactions')) {
      await db.schema.createTable('transactions', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('account_id').unsigned().references('id').inTable('accounts');
        table.string('type').notNullable(); // income, expense, transfer
        table.string('category').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.date('date').notNullable();
        table.string('description');
        table.string('status').defaultTo('confirmed');
        table.string('recurrence').nullable(); // 'none', 'monthly', 'weekly', etc.
        table.integer('destination_account_id').unsigned().references('id').inTable('accounts'); // Para transferências
        table.integer('card_id').unsigned().references('id').inTable('cards').nullable();
        table.integer('goal_id').unsigned().references('id').inTable('goals').nullable();
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [transactions] criada.');
    }

    // Tabela de Cartões
    if (!await db.schema.hasTable('cards')) {
      await db.schema.createTable('cards', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('account_id').unsigned().references('id').inTable('accounts');
        table.string('name').notNullable();
        table.string('brand').notNullable();
        table.decimal('limit', 15, 2).defaultTo(0);
        table.decimal('current_bill', 15, 2).defaultTo(0);
        table.integer('closing_day').notNullable();
        table.integer('due_day').notNullable();
        table.string('color').defaultTo('#2CC7FF');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [cards] criada.');
    }

    // Tabela de Categorias
    if (!await db.schema.hasTable('categories')) {
      await db.schema.createTable('categories', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('name').notNullable();
        table.string('type').notNullable(); // income, expense
        table.string('icon').defaultTo('Tag');
        table.string('color').defaultTo('#2CC7FF');
        table.decimal('budget', 15, 2).defaultTo(0);
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [categories] criada.');
    }

    // Tabela de Metas
    if (!await db.schema.hasTable('goals')) {
      await db.schema.createTable('goals', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('name').notNullable();
        table.decimal('target_amount', 15, 2).notNullable();
        table.decimal('current_amount', 15, 2).defaultTo(0);
        table.date('deadline');
        table.string('icon').defaultTo('Target');
        table.string('color').defaultTo('#2CC7FF');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [goals] criada.');
    }

    // Tabela de Módulos (Marketplace)
    if (!await db.schema.hasTable('modules')) {
      await db.schema.createTable('modules', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('slug').unique().notNullable();
        table.string('description');
        table.string('icon');
        table.decimal('price', 10, 2).defaultTo(0);
        table.integer('trial_days').defaultTo(7);
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [modules] criada.');
    }

    // Tabela de Módulos do Usuário
    if (!await db.schema.hasTable('user_modules')) {
      await db.schema.createTable('user_modules', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('module_id').unsigned().references('id').inTable('modules');
        table.enum('status', ['trial', 'active', 'expired']).defaultTo('trial');
        table.timestamp('activated_at');
        table.timestamp('trial_ends_at');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [user_modules] criada.');
    }

    // Tabela de Ativos (Crypto, Ações, etc)
    if (!await db.schema.hasTable('assets')) {
      await db.schema.createTable('assets', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('name').notNullable();
        table.string('symbol').notNullable(); // BTC, PETR4, etc
        table.string('type').notNullable(); // crypto, stock, fixed_income
        table.decimal('quantity', 20, 8).notNullable();
        table.decimal('average_price', 20, 8).notNullable();
        table.decimal('current_price', 20, 8).nullable();
        table.string('institution').nullable(); // Binance, XP, etc
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [assets] criada.');
    }

    // Tabela de Transações de Cripto
    if (!await db.schema.hasTable('crypto_transactions')) {
      await db.schema.createTable('crypto_transactions', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('asset_id').unsigned().references('id').inTable('assets');
        table.string('type').notNullable(); // buy, sell, transfer
        table.decimal('quantity', 20, 8).notNullable();
        table.decimal('price_at_time', 20, 8).notNullable();
        table.decimal('fee', 20, 8).defaultTo(0);
        table.date('date').notNullable();
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [crypto_transactions] criada.');
    }

    // Tabela de Transações de Investimentos
    if (!await db.schema.hasTable('investment_transactions')) {
      await db.schema.createTable('investment_transactions', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('asset_id').unsigned().references('id').inTable('assets');
        table.string('type').notNullable(); // buy, sell, yield, dividend
        table.decimal('quantity', 20, 8).notNullable();
        table.decimal('price_at_time', 20, 8).notNullable();
        table.decimal('fee', 20, 8).defaultTo(0);
        table.date('date').notNullable();
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [investment_transactions] criada.');
    }

    // Tabela de Transações Recorrentes
    if (!await db.schema.hasTable('recurring_transactions')) {
      await db.schema.createTable('recurring_transactions', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('account_id').unsigned().references('id').inTable('accounts');
        table.string('type').notNullable(); // income, expense
        table.string('category').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('frequency').notNullable(); // monthly, weekly, yearly
        table.integer('day_of_month').defaultTo(1);
        table.string('description');
        table.date('start_date').notNullable();
        table.date('end_date').nullable();
        table.boolean('active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [recurring_transactions] criada.');
    }

    // Tabela de Projeções (Snapshots)
    if (!await db.schema.hasTable('forecasts')) {
      await db.schema.createTable('forecasts', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.date('forecast_date').notNullable();
        table.decimal('projected_balance', 15, 2).notNullable();
        table.decimal('projected_income', 15, 2).defaultTo(0);
        table.decimal('projected_expense', 15, 2).defaultTo(0);
        table.json('details'); // Detalhes da projeção (quais transações incluídas)
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [forecasts] criada.');
    }

    // --- SEEDS INICIAIS (Apenas se as tabelas estiverem vazias) ---
    
    const usersCount = await db('users').count('id as count').first();
    if (usersCount?.count === 0) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('123456', 10);
      await db('users').insert({ name: 'Dime de Britto', email: 'dimedebritto@gmail.com', password: hashedPassword });
      console.log('🌱 Seed: Usuário padrão criado (Senha: 123456).');
    }

    const accountsCount = await db('accounts').count('id as count').first();
    if (accountsCount?.count === 0) {
      await db('accounts').insert([
        { user_id: 1, name: 'Nubank', type: 'checking', balance: 2500.50, color: '#8A05BE' },
        { user_id: 1, name: 'Itaú', type: 'checking', balance: 12000.00, color: '#EC7000' },
        { user_id: 1, name: 'Carteira', type: 'cash', balance: 150.00, color: '#00FF9F' }
      ]);
      console.log('🌱 Seed: Contas iniciais criadas.');
    }

    const modulesCount = await db('modules').count('id as count').first();
    if (modulesCount?.count === 0) {
      await db('modules').insert([
        { name: 'Financeiro', slug: 'core', description: 'Gestão essencial de contas, transações e metas', icon: 'LayoutDashboard', price: 0 },
        { name: 'Cripto', slug: 'crypto', description: 'Gestão de ativos digitais e P&L', icon: 'Zap', price: 29.90 },
        { name: 'Investimentos', slug: 'investments', description: 'Renda fixa, ações e fundos', icon: 'TrendingUp', price: 39.90 }
      ]);
      console.log('🌱 Seed: Módulos do marketplace criados conforme documentação.');
    }

    const userModulesCount = await db('user_modules').count('id as count').first();
    if (userModulesCount?.count === 0) {
      await db('user_modules').insert({
        user_id: 1,
        module_id: 1, // Financeiro
        status: 'active',
        activated_at: new Date().toISOString()
      });
      console.log('🌱 Seed: Módulo Financeiro ativado para o usuário padrão.');
    }

    const categoriesCount = await db('categories').count('id as count').first();
    if (categoriesCount?.count === 0) {
      await db('categories').insert([
        { user_id: 1, name: 'Alimentação', type: 'expense', icon: '🍔', color: '#FF4B4B', budget: 1200 },
        { user_id: 1, name: 'Transporte', type: 'expense', icon: '🚗', color: '#2CC7FF', budget: 400 },
        { user_id: 1, name: 'Moradia', type: 'expense', icon: '🏠', color: '#F27D26', budget: 2500 },
        { user_id: 1, name: 'Lazer', type: 'expense', icon: '🎬', color: '#00FF9F', budget: 500 },
        { user_id: 1, name: 'Renda', type: 'income', icon: '💰', color: '#2ECC71', budget: 0 }
      ]);
      console.log('🌱 Seed: Categorias iniciais criadas.');
    }

    const transactionsCount = await db('transactions').count('id as count').first();
    if (transactionsCount?.count === 0) {
      const today = new Date();
      const currentMonth = today.toISOString().split('T')[0].substring(0, 7);
      
      await db('transactions').insert([
        { user_id: 1, account_id: 1, type: 'income', category: 'Renda', amount: 5000.00, date: `${currentMonth}-05`, description: 'Salário Mensal', status: 'confirmed' },
        { user_id: 1, account_id: 1, type: 'expense', category: 'Moradia', amount: 2200.00, date: `${currentMonth}-10`, description: 'Aluguel', status: 'confirmed' },
        { user_id: 1, account_id: 1, type: 'expense', category: 'Alimentação', amount: 450.00, date: `${currentMonth}-12`, description: 'Supermercado', status: 'confirmed' },
        { user_id: 1, account_id: 1, type: 'expense', category: 'Transporte', amount: 120.00, date: `${currentMonth}-15`, description: 'Combustível', status: 'confirmed' },
        { user_id: 1, account_id: 1, type: 'expense', category: 'Lazer', amount: 80.00, date: `${currentMonth}-18`, description: 'Cinema', status: 'confirmed' }
      ]);
      console.log('🌱 Seed: Transações iniciais criadas.');
      
      // Atualizar saldos das contas
      await db('accounts').where('id', 1).update({ balance: 2500.50 + 5000 - 2200 - 450 - 120 - 80 });
    }

    console.log('🚀 Banco de dados pronto para uso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

init();
