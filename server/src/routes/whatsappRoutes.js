import { Router } from 'express';
import * as whatsappController from '../controllers/whatsappController.js';
const router = Router();
router.get('/status', whatsappController.getStatus);
router.get('/qr', whatsappController.getQR);
router.post('/logout', whatsappController.logout);
router.post('/reconnect', whatsappController.reconnect);
export default router;
//# sourceMappingURL=whatsappRoutes.js.map