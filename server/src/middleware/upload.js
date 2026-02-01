import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
export const uploadImages = upload.array('images', 5); // Max 5 images
export const resizeImages = async (req, res, next) => {
    if (!req.files)
        return next();
    req.body.imageUrls = [];
    // Process files
    const files = req.files;
    try {
        await Promise.all(files.map(async (file, index) => {
            const filename = `item-${Date.now()}-${index}.webp`; // Use WebP for efficiency
            const filepath = path.join(uploadDir, filename);
            // Resize to 80% scale equivalent (or sensible max width) and compress
            // "resize hingga 80%" can be interpreted as 80% quality and optimized size.
            // We'll set a standard max width of 1000px which is good for catalogs,
            // and quality 80%.
            await sharp(file.buffer)
                .resize({ width: 1000, withoutEnlargement: true }) // Ensure it doesn't blow up small images, but limits large ones
                .webp({ quality: 80 })
                .toFile(filepath);
            req.body.imageUrls.push(`/uploads/${filename}`);
        }));
        next();
    }
    catch (error) {
        console.error("Image processing error", error);
        res.status(500).json({ error: 'Failed to process images' });
    }
};
//# sourceMappingURL=upload.js.map