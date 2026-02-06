import { Router } from 'express';
import { referralController } from '../controllers/referralController.js';

const router = Router();

// Partners
router.post('/partners', referralController.createPartner);
router.get('/partners', referralController.getAllPartners);
router.get('/partners/:id', referralController.getPartnerById);
router.put('/partners/:id', referralController.updatePartner);
router.delete('/partners/:id', referralController.deletePartner);

// Codes
router.post('/codes', referralController.createCode);
router.post('/validate', referralController.validateCode);

// Commissions
router.get('/commissions', referralController.getCommissionLogs);
router.get('/commissions/history', referralController.getPayoutHistory);
router.post('/commissions/bulk-pay', referralController.bulkPayCommissions);
router.post('/commissions/:id/pay', referralController.payCommission);

export default router;
