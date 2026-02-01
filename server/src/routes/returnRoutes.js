import { Router } from 'express';
import { returnController } from '../controllers/returnController.js';
const router = Router();
router.get('/rentals', returnController.getActiveRentals);
router.get('/rentals/:id', returnController.getRentalById);
router.post('/rentals/:id/return', returnController.processReturn);
export default router;
//# sourceMappingURL=returnRoutes.js.map