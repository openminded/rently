import { Router } from 'express';
import { masterController } from '../controllers/masterController.js';

const router = Router();

// Categories
router.get('/categories', masterController.categories.getAll);
router.post('/categories', masterController.categories.create);
router.put('/categories/:id', masterController.categories.update);
router.delete('/categories/:id', masterController.categories.delete);

// Brands
router.get('/brands', masterController.brands.getAll);
router.post('/brands', masterController.brands.create);
router.put('/brands/:id', masterController.brands.update);
router.delete('/brands/:id', masterController.brands.delete);

// Colors
router.get('/colors', masterController.colors.getAll);
router.post('/colors', masterController.colors.create);
router.put('/colors/:id', masterController.colors.update);
router.delete('/colors/:id', masterController.colors.delete);

// Sizes
router.get('/sizes', masterController.sizes.getAll);
router.post('/sizes', masterController.sizes.create);
router.put('/sizes/:id', masterController.sizes.update);
router.delete('/sizes/:id', masterController.sizes.delete);

// Payment Methods
router.get('/payment-methods', masterController.paymentMethods.getAll);
router.post('/payment-methods', masterController.paymentMethods.create);
router.put('/payment-methods/:id', masterController.paymentMethods.update);
router.delete('/payment-methods/:id', masterController.paymentMethods.delete);

// Violation Types
router.get('/violation-types', masterController.violationTypes.getAll);
router.post('/violation-types', masterController.violationTypes.create);
router.put('/violation-types/:id', masterController.violationTypes.update);
router.delete('/violation-types/:id', masterController.violationTypes.delete);

// Customers
router.get('/customers', masterController.customers.getAll);
router.post('/customers', masterController.customers.create);
router.put('/customers/:id', masterController.customers.update);
router.delete('/customers/:id', masterController.customers.delete);

export default router;
