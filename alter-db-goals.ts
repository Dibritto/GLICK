import db from './src/lib/db.js';

async function alter() {
  console.log('🛠️ Adicionando goal_id em transactions...');
  try {
    const hasColumn = await db.schema.hasColumn('transactions', 'goal_id');
    if (!hasColumn) {
      await db.schema.alterTable('transactions', table => {
        table.integer('goal_id').unsigned().references('id').inTable('goals').nullable();
      });
      console.log('✅ Coluna goal_id adicionada com sucesso.');
    } else {
      console.log('ℹ️ Coluna goal_id já existe.');
    }
  } catch (error) {
    console.error('❌ Erro ao alterar banco:', error);
  } finally {
    process.exit(0);
  }
}

alter();
