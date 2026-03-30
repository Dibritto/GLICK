import express from 'express';
import { 
  getAssets, 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  updateAsset, 
  deleteAsset 
} from '../controllers/cryptoController.ts';

const router = express.Router();

// Assets
router.get('/assets', getAssets);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;
