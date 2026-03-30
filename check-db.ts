import db from './src/lib/db';

async function checkData() {
  try {
    const users = await db('users').select('id', 'email', 'name');
    console.log('--- USERS ---');
    console.table(users);

    for (const user of users) {
      const accounts = await db('accounts').where('user_id', user.id).count('* as count');
      const transactions = await db('transactions').where('user_id', user.id).count('* as count');
      const assets = await db('assets').where('user_id', user.id).count('* as count');
      
      console.log(`User ${user.id} (${user.email}): 
        Accounts: ${accounts[0].count}, 
        Transactions: ${transactions[0].count}, 
        Assets: ${assets[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error);
    process.exit(1);
  }
}

checkData();
