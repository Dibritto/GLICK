import db from './src/lib/db.ts';

async function up() {
  const exists = await db.schema.hasTable('crypto_price_cache');
  if (!exists) {
    await db.schema.createTable('crypto_price_cache', (table) => {
      table.string('symbol').primary();
      table.decimal('price', 20, 8).notNullable();
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('Tabela crypto_price_cache criada.');
  } else {
    console.log('Tabela crypto_price_cache já existe.');
  }
  process.exit(0);
}

up().catch(err => {
  console.error(err);
  process.exit(1);
});
