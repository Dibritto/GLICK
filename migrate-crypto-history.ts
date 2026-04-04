import db from './src/lib/db.ts';

async function up() {
  const exists = await db.schema.hasTable('crypto_price_history');
  if (!exists) {
    await db.schema.createTable('crypto_price_history', (table) => {
      table.increments('id').primary();
      table.string('symbol').notNullable();
      table.decimal('price', 20, 8).notNullable();
      table.timestamp('timestamp').defaultTo(db.fn.now());
      table.index(['symbol', 'timestamp']);
    });
    console.log('Tabela crypto_price_history criada.');
  } else {
    console.log('Tabela crypto_price_history já existe.');
  }
  process.exit(0);
}

up().catch(err => {
  console.error(err);
  process.exit(1);
});
