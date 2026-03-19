import knex from 'knex';

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: './data.sqlite'
  },
  useNullAsDefault: true
});

async function checkCardTransactions() {
  try {
    const transactions = await db('transactions').where('card_id', 1);
    console.log('Transações do Cartão 1:', JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await db.destroy();
  }
}

checkCardTransactions();
