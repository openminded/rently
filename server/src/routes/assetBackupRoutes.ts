import { Router, type Request, type Response } from 'express';
import archiver from 'archiver';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();

// Configure Multer for huge zip uploads
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// GET /download: Stream uploads folder as zip
router.get('/download', async (req: Request, res: Response) => {
    try {
        const uploadDir = path.join(process.cwd(), 'uploads');

        if (!fs.existsSync(uploadDir)) {
            return res.status(404).json({ error: 'Uploads directory not found' });
        }

        const date = new Date().toISOString().split('T')[0];
        const filename = `assets_backup_${date}.zip`;

        res.attachment(filename);

        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        archive.on('warning', (err: any) => {
            if (err.code === 'ENOENT') {
                console.warn('Backup warning:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err: any) => {
            throw err;
        });

        archive.pipe(res);

        // Append files from uploads directory, excluding temp directory
        archive.glob('**/*', {
            cwd: uploadDir,
            ignore: ['temp/**'] // Ignore temp uploads
        });

        await archive.finalize();

    } catch (error: any) {
        console.error('Asset Backup Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create backup', details: error.message });
        }
    }
});

// POST /restore: Upload zip and extract to uploads folder
router.post('/restore', upload.single('backupFile'), async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const zipPath = req.file.path;
        const uploadDir = path.join(process.cwd(), 'uploads'); // Target directory

        // Ensure target directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Extract zip
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: uploadDir }))
            .on('close', () => {
                // Cleanup uploaded zip
                fs.unlinkSync(zipPath);

                res.json({ message: 'Assets restored successfully' });
            })
            .on('error', (err: any) => {
                console.error('Unzip Error:', err);
                // Try cleanup on error
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

                res.status(500).json({ error: 'Failed to extract files', details: err.message });
            });

    } catch (error: any) {
        console.error('Asset Restore Error:', error);
        res.status(500).json({ error: 'Failed to restore assets', details: error.message });
    }
});

export default router;
