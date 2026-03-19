import knex from 'knex';

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: './data.sqlite'
  },
  useNullAsDefault: true
});

async function checkDetails() {
  try {
    const accounts = await db('accounts').select('*');
    const cards = await db('cards').select('*');
    const goals = await db('goals').select('*');
    
    console.log('Contas:', JSON.stringify(accounts, null, 2));
    console.log('Cartões:', JSON.stringify(cards, null, 2));
    console.log('Metas:', JSON.stringify(goals, null, 2));

  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await db.destroy();
  }
}

checkDetails();
