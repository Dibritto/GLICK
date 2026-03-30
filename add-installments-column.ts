import db from './src/lib/db';

async function migrate() {
  try {
    const hasInstallments = await db.schema.hasColumn('transactions', 'installments');
    if (!hasInstallments) {
      await db.schema.table('transactions', (table) => {
        table.integer('installments').defaultTo(1);
      });
      console.log('Added installments column');
    }

    const hasInstallmentId = await db.schema.hasColumn('transactions', 'installment_id');
    if (!hasInstallmentId) {
      await db.schema.table('transactions', (table) => {
        table.string('installment_id').nullable();
      });
      console.log('Added installment_id column');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

migrate();
