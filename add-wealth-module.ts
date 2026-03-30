import db from './src/lib/db.ts';

async function addModule() {
  try {
    const existing = await db('modules').where('slug', 'wealth').first();
    if (!existing) {
      await db('modules').insert({
        name: 'Gestão de Patrimônio',
        slug: 'wealth',
        description: 'Visão consolidada de patrimônio líquido, incluindo imóveis e ativos físicos.',
        icon: 'Users',
        price: 49.90,
        trial_days: 15
      });
      console.log('✅ Módulo [Gestão de Patrimônio] adicionado ao marketplace.');
    } else {
      console.log('ℹ️ Módulo [Gestão de Patrimônio] já existe.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addModule();
