import express from 'express';
import { getCards, createCard, updateCard, deleteCard } from '../controllers/cardController.ts';
import { validate } from '../lib/validation.ts';
import { cardSchema } from '../schemas/financeSchemas.ts';

const router = express.Router();

router.get('/', getCards);
router.post('/', validate(cardSchema), createCard);
router.put('/:id', validate(cardSchema), updateCard);
router.delete('/:id', deleteCard);

export default router;
