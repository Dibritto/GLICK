import db from './db';

export interface Module {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  price: number;
  trial_days: number;
  status?: 'trial' | 'active' | 'expired' | 'locked';
  trial_ends_at?: string;
}

export async function getUserModules(userId: number): Promise<Module[]> {
  const allModules = await db('modules').select('*');
  const userModules = await db('user_modules')
    .where('user_id', userId)
    .select('*');

  return allModules.map(mod => {
    const userMod = userModules.find(um => um.module_id === mod.id);
    
    if (!userMod) {
      return { ...mod, status: 'locked' };
    }

    return {
      ...mod,
      status: userMod.status,
      trial_ends_at: userMod.trial_ends_at
    };
  });
}

export async function activateModule(userId: number, moduleSlug: string, isTrial: boolean = true) {
  const module = await db('modules').where('slug', moduleSlug).first();
  if (!module) throw new Error('Módulo não encontrado');

  const existing = await db('user_modules')
    .where({ user_id: userId, module_id: module.id })
    .first();

  if (existing) {
    if (existing.status === 'active') return existing;
    // Se expirou ou está em trial, podemos reativar se for compra real
    if (!isTrial) {
      await db('user_modules')
        .where('id', existing.id)
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          trial_ends_at: null
        });
    }
    return existing;
  }

  const isFree = Number(module.price) === 0;
  const finalStatus = isFree || !isTrial ? 'active' : 'trial';

  const trialEndsAt = finalStatus === 'trial' 
    ? new Date(Date.now() + module.trial_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const [id] = await db('user_modules').insert({
    user_id: userId,
    module_id: module.id,
    status: finalStatus,
    activated_at: new Date().toISOString(),
    trial_ends_at: trialEndsAt
  });

  return { id, status: finalStatus };
}

export async function checkModuleAccess(userId: number, moduleSlug: string): Promise<boolean> {
  const module = await db('modules').where('slug', moduleSlug).first();
  if (!module) return false;

  const userMod = await db('user_modules')
    .where({ user_id: userId, module_id: module.id })
    .first();

  if (!userMod) return false;
  if (userMod.status === 'active') return true;
  if (userMod.status === 'trial') {
    const now = new Date();
    const trialEnd = new Date(userMod.trial_ends_at);
    return now < trialEnd;
  }

  return false;
}
