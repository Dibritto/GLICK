import express from 'express';
import { getMarketPrice } from '../controllers/marketController.ts';

const router = express.Router();

router.get('/price/:symbol', (req, res, next) => {
  console.log('marketRoutes: Received request for', req.params.symbol);
  next();
}, getMarketPrice);

export default router;
