import { Router } from 'express';
import masterRoutes from './masterRoutes.js';
import itemRoutes from './itemRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import laundryRoutes from './laundryRoutes.js';
import laundryPartnerRoutes from './laundryPartnerRoutes.js';
import backupRoutes from './backupRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import returnRoutes from './returnRoutes.js';
import authRoutes from './authRoutes.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

router.use('/auth', authRoutes);

// Protect all API routes below
router.use(authenticateToken);

console.log("Main Router: Mapping Routes...");
router.use('/masters', masterRoutes);
router.use('/items', itemRoutes);

// Debug middleware to check if request reaches here
router.use('/transactions', (req, res, next) => {
    console.log(`[DEBUG] Request to /transactions: ${req.method} ${req.path}`);
    next();
}, transactionRoutes);




router.use('/laundry', laundryRoutes);
router.use('/laundry-partners', laundryPartnerRoutes);
router.use('/returns', returnRoutes);
router.use('/backup', backupRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
