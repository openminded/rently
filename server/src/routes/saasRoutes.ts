
import { Router } from 'express';
import { saasController } from '../controllers/saasController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/history', authenticateToken, saasController.getHistory);

export default router;
