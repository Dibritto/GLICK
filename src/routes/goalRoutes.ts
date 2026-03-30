import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalController.ts';
import { validate } from '../lib/validation.ts';
import { goalSchema } from '../schemas/financeSchemas.ts';

const router = express.Router();

router.get('/', getGoals);
router.post('/', validate(goalSchema), createGoal);
router.put('/:id', validate(goalSchema), updateGoal);
router.delete('/:id', deleteGoal);

export default router;
