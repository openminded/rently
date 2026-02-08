import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { inventoryController } from '../controllers/inventoryController.js';
import { masterController } from '../controllers/masterController.js';

const router = Router();

// Public inventory and master data
router.get('/items', inventoryController.getItems);
router.get('/categories', masterController.categories.getAll);
router.get('/variants/:variantId/availability', inventoryController.getVariantAvailability);

// Public booking for landing page
router.post('/book', transactionController.publicBook);
router.get('/transactions/:id/status', transactionController.getTransactionStatus);

// Public Business Info
router.get('/business/:slug', masterController.getBusinessBySlug);

export default router;
