
import { Router } from 'express';
import { laundryController } from '../controllers/laundryController.js';

const router = Router();

router.get('/', laundryController.getAll);
router.post('/complete', laundryController.complete);

export default router;
