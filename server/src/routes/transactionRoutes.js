import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
const router = Router();
console.log("Loading Transaction Routes...");
console.log("Controller Methods Available:", Object.keys(transactionController));
// Middleware for this router
router.use((req, res, next) => {
    console.log(`[Transaction Router] ${req.method} ${req.url}`);
    next();
});
router.post('/', transactionController.createConfig);
router.get('/test', (req, res) => {
    console.log("Test Route Hit");
    res.send('Transaction Router OK');
});
// Explicitly define getAll
router.get('/', async (req, res) => {
    console.log("getAll Route Hit");
    await transactionController.getAll(req, res);
});
router.post('/:id/pay', transactionController.addPayment);
router.post('/:id/pickup', transactionController.pickup);
router.post('/:id/return', transactionController.returnItems);
router.put('/:id/invalid', transactionController.markInvalid);
// Explicitly define getById
router.get('/:id', async (req, res) => {
    console.log(`getById Route Hit with ID: ${req.params.id}`);
    await transactionController.getById(req, res);
});
export default router;
//# sourceMappingURL=transactionRoutes.js.map