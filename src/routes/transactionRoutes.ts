import express from 'express';
import { 
  listTransactions, 
  listTransactionsPaginated,
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  reconcileTransaction 
} from '../controllers/transactionController.ts';
import { validate } from '../lib/validation.ts';
import { transactionSchema } from '../schemas/financeSchemas.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', listTransactions);
router.get('/paginated', listTransactionsPaginated);
router.post('/', validate(transactionSchema), createTransaction);
router.put('/:id', validate(transactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);
router.patch('/:id/reconcile', reconcileTransaction);

export default router;
