import db from './src/lib/db.js';

async function check() {
  try {
    const result = await db('users').select('*').limit(1);
    console.log('✅ Database connection successful:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

check();
