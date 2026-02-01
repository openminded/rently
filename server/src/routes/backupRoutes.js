import { Router } from 'express';
import { backupController } from '../controllers/backupController.js';
import multer from 'multer';
import fs from 'fs';
const router = Router();
// Configure Multer for Backup File Upload
const upload = multer({
    dest: 'uploads/temp/', // Temporary storage
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
// Ensure temp dir exists
if (!fs.existsSync('uploads/temp')) {
    fs.mkdirSync('uploads/temp', { recursive: true });
}
router.get('/download', backupController.getBackup);
router.post('/restore', upload.single('backupFile'), backupController.restoreBackup);
router.delete('/reset', backupController.resetData);
export default router;
//# sourceMappingURL=backupRoutes.js.map