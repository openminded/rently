import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);
export default router;
//# sourceMappingURL=authRoutes.js.map