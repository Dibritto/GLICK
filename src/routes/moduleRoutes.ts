import express from 'express';
import { getModules, activateModule, deactivateModule } from '../controllers/moduleController.ts';

const router = express.Router();

router.get('/', getModules);
router.post('/:slug/activate', activateModule);
router.post('/:slug/deactivate', deactivateModule);

export default router;
