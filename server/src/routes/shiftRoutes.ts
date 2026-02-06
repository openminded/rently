import { Router } from 'express';
import { shiftController } from '../controllers/shiftController.js';

const router = Router();

router.get('/current', shiftController.getCurrentShift);
router.post('/open', shiftController.openShift);
router.post('/:id/close', shiftController.closeShift);
router.get('/history', shiftController.getHistory);

export default router;
