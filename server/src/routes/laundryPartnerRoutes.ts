import express from 'express';
import * as laundryPartnerController from '../controllers/laundryPartnerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', laundryPartnerController.getAllPartners);
router.get('/:id', laundryPartnerController.getPartner);
router.post('/', laundryPartnerController.createPartner);
router.put('/:id', laundryPartnerController.updatePartner);
router.delete('/:id', laundryPartnerController.deletePartner);

export default router;
