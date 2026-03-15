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
        table.string('color').defaultTo('#2CC7FF');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [accounts] criada.');
    }

    // Tabela de Transações
    if (!await db.schema.hasTable('transactions')) {
      await db.schema.createTable('transactions', table => {
        table.increments('id').primary();
        table.integer('account_id').unsigned().references('id').inTable('accounts');
        table.enum('type', ['income', 'expense']).notNullable();
        table.string('category').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.date('date').notNullable();
        table.string('description');
        table.string('status').defaultTo('confirmed');
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [transactions] criada.');
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

    // --- SEEDS INICIAIS (Apenas se as tabelas estiverem vazias) ---
    
    const usersCount = await db('users').count('id as count').first();
    if (usersCount?.count === 0) {
      await db('users').insert({ name: 'Dime de Britto', email: 'dimedebritto@gmail.com', password: 'hash' });
      console.log('🌱 Seed: Usuário padrão criado.');
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
        { name: 'Investimentos Pro', slug: 'investments', description: 'Gestão avançada de ativos e corretoras', icon: 'TrendingUp', price: 29.90 },
        { name: 'Relatórios IA', slug: 'ai-reports', description: 'Insights preditivos baseados no seu comportamento', icon: 'Zap', price: 19.90 },
        { name: 'Multi-Contas', slug: 'multi-accounts', description: 'Gerencie contas de terceiros ou empresas', icon: 'Users', price: 49.90 }
      ]);
      console.log('🌱 Seed: Módulos do marketplace criados.');
    }

    console.log('🚀 Banco de dados pronto para uso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

init();
