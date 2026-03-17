import db from './src/lib/db.js';

async function alter() {
  try {
    const hasCardId = await db.schema.hasColumn('transactions', 'card_id');
    if (!hasCardId) {
      await db.schema.alterTable('transactions', table => {
        table.integer('card_id').unsigned().references('id').inTable('cards').nullable();
      });
      console.log('✅ Coluna card_id adicionada à tabela transactions.');
    } else {
      console.log('ℹ️ Coluna card_id já existe.');
    }
  } catch (error) {
    console.error('Erro ao alterar banco:', error);
  } finally {
    process.exit(0);
  }
}

alter();
