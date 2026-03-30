import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.ts';
import { validate } from '../lib/validation.ts';
import { categorySchema } from '../schemas/financeSchemas.ts';

const router = express.Router();

router.get('/', getCategories);
router.post('/', validate(categorySchema), createCategory);
router.put('/:id', validate(categorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
