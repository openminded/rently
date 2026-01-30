import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all routes: Must be logged in and be SUPERADMIN or OWNER
router.use(authenticateToken);
router.use(authorizeRole(['SUPERADMIN', 'OWNER']));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
