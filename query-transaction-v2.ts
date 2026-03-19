import knex from 'knex';

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: './data.sqlite'
  },
  useNullAsDefault: true
});

async function findTransaction() {
  try {
    console.log('--- Buscando todas as transações de valor 100 ---');
    const transactions = await db('transactions')
      .select('transactions.*', 'accounts.name as account_name')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .whereRaw('ABS(amount - 100) < 0.01');
    
    console.log('Transações encontradas:', JSON.stringify(transactions, null, 2));

    const goals = await db('goals').select('*');
    console.log('Metas:', JSON.stringify(goals, null, 2));

    const accounts = await db('accounts').select('*');
    console.log('Contas:', JSON.stringify(accounts, null, 2));

  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await db.destroy();
  }
}

findTransaction();
