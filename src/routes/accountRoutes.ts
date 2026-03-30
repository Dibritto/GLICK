import express from 'express';
import { 
  listAccounts, 
  createAccount, 
  updateAccount, 
  recalculateAccountBalance, 
  deleteAccount 
} from '../controllers/accountController.ts';
import { validate } from '../lib/validation.ts';
import { accountSchema } from '../schemas/financeSchemas.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', listAccounts);
router.post('/', validate(accountSchema), createAccount);
router.put('/:id', validate(accountSchema), updateAccount);
router.post('/:id/recalculate', recalculateAccountBalance);
router.delete('/:id', deleteAccount);

export default router;
