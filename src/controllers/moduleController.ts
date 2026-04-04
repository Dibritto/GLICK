import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { getUserModules, activateModule as activateMod, checkModuleAccess } from '../lib/moduleManager.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getModules = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'Não autorizado', 401);

  try {
    const userModules = await getUserModules(userId);
    return sendSuccess(res, userModules);
  } catch (error) {
    return sendError(res, 'Erro ao buscar módulos');
  }
};

export const activateModule = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { slug } = req.params;
  if (!userId) return sendError(res, 'Não autorizado', 401);

  try {
    await activateMod(userId, slug);
    return sendSuccess(res, { message: 'Módulo ativado com sucesso' });
  } catch (error: any) {
    return sendError(res, error.message || 'Erro ao ativar módulo');
  }
};

export const deactivateModule = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { slug } = req.params;
  if (!userId) return sendError(res, 'Não autorizado', 401);

  try {
    if (slug === 'core') {
      return sendError(res, 'O módulo principal não pode ser desativado', 400);
    }

    const moduleRecord = await db('modules').where('slug', slug).first();
    if (!moduleRecord) return sendError(res, 'Módulo não encontrado', 404);

    await db('user_modules')
      .where({ user_id: userId, module_id: moduleRecord.id })
      .update({ status: 'inactive', updated_at: db.fn.now() });

    return sendSuccess(res, { message: 'Módulo desativado com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao desativar módulo');
  }
};
