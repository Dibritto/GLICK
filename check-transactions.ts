import db from './src/lib/db';

async function checkTransactions() {
  try {
    const userId = 1;
    const transactions = await db('transactions').where('user_id', userId);
    console.log(`--- TRANSACTIONS FOR USER ${userId} ---`);
    console.table(transactions);

    const accounts = await db('accounts').where('user_id', userId);
    console.log(`--- ACCOUNTS FOR USER ${userId} ---`);
    console.table(accounts);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking transactions:', error);
    process.exit(1);
  }
}

checkTransactions();
