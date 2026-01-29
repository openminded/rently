import { Router } from 'express';
import masterRoutes from './masterRoutes.js';
import itemRoutes from './itemRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import laundryRoutes from './laundryRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

console.log("Main Router: Mapping Routes...");
router.use('/masters', masterRoutes);
router.use('/items', itemRoutes);

// Debug middleware to check if request reaches here
router.use('/transactions', (req, res, next) => {
    console.log(`[DEBUG] Request to /transactions: ${req.method} ${req.path}`);
    next();
}, transactionRoutes);


router.use('/laundry', laundryRoutes);

export default router;
