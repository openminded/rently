import { Router } from 'express';
import { getAllSettings, updateSettings, getPublicSettings } from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/public', getPublicSettings);
router.get('/', authenticateToken, getAllSettings);
router.post('/', authenticateToken, updateSettings);
export default router;
//# sourceMappingURL=settingsRoutes.js.map