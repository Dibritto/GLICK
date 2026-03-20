import db from './src/lib/db.js';

async function debug() {
  try {
    console.log('--- Modules ---');
    const modules = await db('modules').select('*');
    console.log(JSON.stringify(modules, null, 2));

    console.log('--- User Modules ---');
    const userModules = await db('user_modules').select('*');
    console.log(JSON.stringify(userModules, null, 2));

    console.log('--- User Modules Columns ---');
    if (db.client.config.client === 'better-sqlite3') {
      const info = await db.raw('PRAGMA table_info(user_modules)');
      console.log(JSON.stringify(info, null, 2));
    } else {
      const info = await db.raw('DESCRIBE user_modules');
      console.log(JSON.stringify(info, null, 2));
    }
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    process.exit();
  }
}

debug();
