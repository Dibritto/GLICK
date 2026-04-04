import express from 'express';
import { getDebts, createDebt, simulatePayoffEndpoint } from '../controllers/debtController.ts';

const router = express.Router();

router.get('/', getDebts);
router.post('/', createDebt);
router.post('/simulate', simulatePayoffEndpoint);

export default router;
