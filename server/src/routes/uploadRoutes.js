import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Resolve path to client/public/uploads
        // Assumes server is running in /server
        // We need to go up to root, then client/public/uploads
        const uploadPath = path.resolve(__dirname, '../../../client/public/uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });
// Single file upload endpoint
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return public URL
        // client/public/uploads/filename -> /uploads/filename
        const publicUrl = `/uploads/${req.file.filename}`;
        res.json({ url: publicUrl });
    }
    catch (error) {
        console.error("Upload failed", error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
export default router;
//# sourceMappingURL=uploadRoutes.js.map