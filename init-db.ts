import db from './src/lib/db.ts';

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

    // Tabela de Cartões (DEVE VIR ANTES DE TRANSACTIONS)
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
        table.decimal('interest_rate', 5, 4).defaultTo(0.1200); // Juros rotativos (12% a.m.)
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [cards] criada.');
    } else {
      const hasInterestRate = await db.schema.hasColumn('cards', 'interest_rate');
      if (!hasInterestRate) {
        await db.schema.alterTable('cards', table => {
          table.decimal('interest_rate', 5, 4).defaultTo(0.1200);
        });
        console.log('✅ Coluna [interest_rate] adicionada à tabela [cards].');
      }
    }

    // Tabela de Faturas de Cartão (Histórico e Juros Rotativos)
    if (!await db.schema.hasTable('card_bills')) {
      await db.schema.createTable('card_bills', table => {
        table.increments('id').primary();
        table.integer('card_id').unsigned().references('id').inTable('cards').onDelete('CASCADE');
        table.string('month_year').notNullable(); // YYYY-MM
        table.decimal('closing_amount', 15, 2).notNullable();
        table.decimal('paid_amount', 15, 2).defaultTo(0);
        table.decimal('remaining_balance', 15, 2).defaultTo(0);
        table.decimal('interest_rate', 5, 4).defaultTo(0.1200);
        table.decimal('interest_accrued', 15, 2).defaultTo(0);
        table.string('status').defaultTo('open'); // open, closed, overdue, partial
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [card_bills] criada.');
    }

    // Tabela de Dívidas (Empréstimos/Financiamentos)
    if (!await db.schema.hasTable('debts')) {
      await db.schema.createTable('debts', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('name').notNullable();
        table.decimal('principal', 15, 2).notNullable();
        table.decimal('monthly_rate', 5, 4).notNullable(); // Ex: 0.015 para 1.5% a.m.
        table.integer('total_months').notNullable();
        table.string('payment_method').notNullable(); // 'SAC' ou 'Price'
        table.string('status').defaultTo('active'); // active, paid, overdue
        table.date('start_date').notNullable();
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [debts] criada.');
    }

    // Tabela de Metas (DEVE VIR ANTES DE TRANSACTIONS)
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
        table.integer('installments').defaultTo(1);
        table.string('installment_id').nullable();
        table.timestamps(true, true);
        
        // Indexes for performance
        table.index('user_id');
        table.index('account_id');
        table.index('date');
        table.index('type');
      });
      console.log('✅ Tabela [transactions] criada.');
    } else {
      // Adicionar colunas se não existirem
      const hasInstallments = await db.schema.hasColumn('transactions', 'installments');
      if (!hasInstallments) {
        await db.schema.alterTable('transactions', table => {
          table.integer('installments').defaultTo(1);
          table.string('installment_id').nullable();
        });
        console.log('✅ Colunas [installments] e [installment_id] adicionadas à tabela [transactions].');
      }

      // Adicionar índices se não existirem (tentativa segura)
      try {
        const [indexes] = await db.raw("SHOW INDEX FROM transactions WHERE Key_name = 'transactions_user_id_index'");
        if (indexes.length === 0) {
          await db.schema.alterTable('transactions', table => {
            table.index('user_id');
            table.index('account_id');
            table.index('date');
            table.index('type');
          });
          console.log('✅ Índices de performance adicionados à tabela [transactions].');
        }
      } catch (e) {
        console.log('⚠️ Não foi possível verificar/adicionar índices em transactions:', e);
      }
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
        table.string('status').defaultTo('trial'); // trial, active, expired, inactive
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
        table.integer('transaction_id').unsigned().nullable().references('id').inTable('transactions').onDelete('SET NULL');
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
        table.integer('transaction_id').unsigned().nullable().references('id').inTable('transactions').onDelete('SET NULL');
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
        table.date('next_date').nullable(); // Próxima execução
        table.date('end_date').nullable();
        table.boolean('active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('✅ Tabela [recurring_transactions] criada.');
    } else {
      const hasNextDate = await db.schema.hasColumn('recurring_transactions', 'next_date');
      if (!hasNextDate) {
        await db.schema.alterTable('recurring_transactions', table => {
          table.date('next_date').nullable();
        });
        // Inicializar next_date com start_date para registros existentes
        await db('recurring_transactions').update({
          next_date: db.ref('start_date')
        });
        console.log('✅ Coluna [next_date] adicionada à tabela [recurring_transactions].');
      }
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

    // --- SEEDS DE SISTEMA (Apenas se as tabelas estiverem vazias) ---
    
    // Limpar categorias globais antigas para garantir isolamento total
    await db('categories').whereNull('user_id').delete();

    const modulesCount = await db('modules').count('id as count').first();
    if (modulesCount?.count === 0) {
      await db('modules').insert([
        { name: 'Financeiro', slug: 'core', description: 'Gestão essencial de contas, transações e metas', icon: 'LayoutDashboard', price: 0 },
        { name: 'Cripto', slug: 'crypto', description: 'Gestão de ativos digitais e P&L', icon: 'Zap', price: 29.90 },
        { name: 'Investimentos', slug: 'investments', description: 'Renda fixa, ações e fundos', icon: 'TrendingUp', price: 39.90 }
      ]);
      console.log('✅ Módulos do sistema inicializados.');
    }

    console.log('🚀 Banco de dados pronto para uso!');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    await db.destroy();
    process.exit(1);
  }
}

init();
