import express from 'express';
import { getRecurringTransactions, createRecurringTransaction, deleteRecurringTransaction } from '../controllers/recurringTransactionController.ts';

const router = express.Router();

router.get('/', getRecurringTransactions);
router.post('/', createRecurringTransaction);
router.delete('/:id', deleteRecurringTransaction);

export default router;
