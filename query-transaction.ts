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
    console.log('--- Buscando transação de 100.00 BRL em Metas & Objetivos ---');
    const transactions = await db('transactions')
      .select('transactions.*', 'accounts.name as account_name')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('amount', 100)
      .where('category', 'Metas & Objetivos');
    
    console.log('Transações encontradas:', JSON.stringify(transactions, null, 2));

    if (transactions.length === 0) {
      console.log('Nenhuma transação exata encontrada. Buscando por valor 100 em qualquer categoria...');
      const any100 = await db('transactions')
        .select('transactions.*', 'accounts.name as account_name')
        .join('accounts', 'transactions.account_id', 'accounts.id')
        .where('amount', 100);
      console.log('Outras transações de 100:', JSON.stringify(any100, null, 2));
    }

    // Também buscar metas para ver se há algo relacionado
    const goals = await db('goals').select('*');
    console.log('Metas cadastradas:', JSON.stringify(goals, null, 2));

  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await db.destroy();
  }
}

findTransaction();
