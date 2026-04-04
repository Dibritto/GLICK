import express from 'express';
import { getCards, createCard, updateCard, deleteCard, getCardBills, closeBill, payBill, projectInterest } from '../controllers/cardController.ts';
import { validate } from '../lib/validation.ts';
import { cardSchema } from '../schemas/financeSchemas.ts';

const router = express.Router();

router.get('/', getCards);
router.post('/', validate(cardSchema), createCard);
router.put('/:id', validate(cardSchema), updateCard);
router.delete('/:id', deleteCard);

// --- ROTAS DE FATURAS E JUROS ---
router.get('/:id/bills', getCardBills);
router.post('/:id/close-bill', closeBill);
router.post('/bills/:billId/pay', payBill);
router.get('/:id/project-interest', projectInterest);

export default router;
