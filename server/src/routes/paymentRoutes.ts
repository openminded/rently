import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = Router();

// Endpoint for Duitku Notification (Callback)
// Note: This endpoint should be public/unauthenticated as it's called by Duitku
router.post('/duitku/callback', paymentController.handleCallback);

// Endpoint to manually check status (authenticated - usually for admin/POS)
router.get('/duitku/status/:id', paymentController.checkStatus);

export default router;
