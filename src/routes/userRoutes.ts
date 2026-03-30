import express from 'express';
import { getProfile, updateProfile, updatePassword, exportData, resetData } from '../controllers/userController.ts';

const router = express.Router();

router.get('/me', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/export', exportData);
router.delete('/reset', resetData);

export default router;
