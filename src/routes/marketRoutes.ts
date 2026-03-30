import express from 'express';
import { getMarketPrice } from '../controllers/marketController.ts';

const router = express.Router();

router.get('/price/:symbol', getMarketPrice);

export default router;
