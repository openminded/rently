import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';

const router = Router();

import { uploadImages, resizeImages } from '../middleware/upload.js';

// Items
router.get('/', inventoryController.getItems);
router.post('/', uploadImages, resizeImages, inventoryController.createItem);
router.put('/:id', uploadImages, resizeImages, inventoryController.updateItem);
router.delete('/images/:imageId', inventoryController.deleteItemImage);

// Variants
router.post('/variants', inventoryController.createVariant);
router.delete('/variants/:variantId', inventoryController.deleteVariant);
router.get('/variants/:variantId/stock', inventoryController.getVariantStock);

// Stock (instances)
router.post('/stock', inventoryController.addStock);

// History
router.get('/resume', inventoryController.getResume);
router.get('/history', inventoryController.getHistory);

export default router;
