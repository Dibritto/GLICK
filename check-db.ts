import db from './src/lib/db.js';

async function check() {
  const res = await db('user_modules')
    .join('modules', 'user_modules.module_id', 'modules.id')
    .select('modules.slug', 'user_modules.status', 'user_modules.activated_at', 'user_modules.trial_ends_at');
  console.log(res);
  process.exit(0);
}
check();
