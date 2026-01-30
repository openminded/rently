
import { Router } from 'express';
import { laundryController } from '../controllers/laundryController.js';

const router = Router();

router.get('/', laundryController.getAll);
router.get('/batches', laundryController.getBatches);
router.post('/batches', laundryController.createBatch);
router.put('/batches/:id/complete', laundryController.completeBatch);

export default router;
