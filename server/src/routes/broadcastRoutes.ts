import express from 'express';
import {
    getTemplates, createTemplate, updateTemplate, deleteTemplate,
    createBroadcast, getBroadcastHistory, sendDirectMessage, getReminderTargets
} from '../controllers/broadcastController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

router.post('/send', createBroadcast);
router.get('/history', getBroadcastHistory);
router.post('/direct', sendDirectMessage);
router.get('/reminders', getReminderTargets);

export default router;
