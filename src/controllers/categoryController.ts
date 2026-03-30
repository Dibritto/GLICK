import { Request, Response } from 'express';
import db from '../lib/db.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const getCategories = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const categories = await db('categories')
      .where('user_id', userId)
      .orderBy('name', 'asc');
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, 'Erro ao buscar categorias');
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, type, color, icon } = req.body;
  try {
    const existing = await db('categories')
      .where({ user_id: userId, name, type })
      .first();
      
    if (existing) {
      return sendError(res, 'Já existe uma categoria com este nome para este tipo', 400);
    }

    const [id] = await db('categories').insert({
      user_id: userId,
      name,
      type,
      color,
      icon
    });
    return sendSuccess(res, { id, message: 'Categoria criada com sucesso' }, 201);
  } catch (error) {
    return sendError(res, 'Erro ao criar categoria');
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, type, color, icon } = req.body;
  const userId = req.user?.id;

  try {
    const category = await db('categories').where({ id, user_id: userId }).first();
    if (!category) return sendError(res, 'Categoria não encontrada ou acesso negado', 404);

    await db('categories')
      .where({ id, user_id: userId })
      .update({ name, type, color, icon, updated_at: db.fn.now() });

    return sendSuccess(res, { message: 'Categoria atualizada com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao atualizar categoria');
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const category = await db('categories').where({ id, user_id: userId }).first();
    if (!category) return sendError(res, 'Categoria não encontrada ou acesso negado', 404);

    const hasTransactions = await db('transactions')
      .where({ user_id: userId, category: category.name })
      .first();
    
    if (hasTransactions) {
      return sendError(res, 'Não é possível excluir uma categoria em uso', 400);
    }

    await db('categories').where({ id, user_id: userId }).delete();
    return sendSuccess(res, { message: 'Categoria excluída com sucesso' });
  } catch (error) {
    return sendError(res, 'Erro ao excluir categoria');
  }
};
