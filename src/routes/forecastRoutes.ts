import express from 'express';
import { getForecasts, createForecast, deleteForecast } from '../controllers/forecastController.ts';

const router = express.Router();

router.get('/', getForecasts);
router.post('/', createForecast);
router.delete('/:id', deleteForecast);

export default router;
