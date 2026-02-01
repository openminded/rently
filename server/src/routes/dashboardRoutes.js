import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
const router = Router();
router.get('/summary', dashboardController.getSummary);
router.get('/charts', dashboardController.getCharts);
export default router;
//# sourceMappingURL=dashboardRoutes.js.map