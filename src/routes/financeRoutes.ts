import express from 'express';
import { getCoreStats, getChartData } from '../controllers/financeController.ts';

const router = express.Router();

router.get('/core-stats', getCoreStats);
router.get('/chart-data', getChartData);

export default router;
