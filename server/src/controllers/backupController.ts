import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import fs from 'fs';
import path from 'path';

// Define model order for dependencies
// For Restore/Deletion: Delete in reverse order of creation
const models = [
    'Fine', 'Payment', 'TransactionItem', 'Transaction', // Transactions depends on Customer
    'LaundryLog', 'ItemInstance', 'ItemVariant', 'ItemImage', 'Item', // Items
    'Customer', 'Category', 'Brand', 'Color', 'Size', 'PaymentMethod', 'ViolationType', 'AppSetting', 'User'
];

// For Restore/Creation: Create in this order
const creationOrder = [
    'User', 'AppSetting', 'ViolationType', 'PaymentMethod', 'Size', 'Color', 'Brand', 'Category', 'Customer',
    'Item', 'ItemImage', 'ItemVariant', 'ItemInstance', 'LaundryLog',
    'Transaction', 'TransactionItem', 'Payment', 'Fine'
];

export const backupController = {
    // 1. BACKUP: Dump all data to JSON
    getBackup: async (req: Request, res: Response) => {
        try {
            const backupData: any = {};

            // Loop through all models and fetch data
            // We use creationOrder for backup content (logical grouping)
            for (const modelName of creationOrder) {
                // @ts-ignore
                if (prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]) {
                    // @ts-ignore
                    backupData[modelName] = await prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)].findMany();
                }
            }

            backupData.timestamp = new Date().toISOString();
            backupData.version = "1.0";

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=pos_backup_${Date.now()}.json`);
            res.send(JSON.stringify(backupData, null, 2));

        } catch (error) {
            console.error("Backup Failed:", error);
            res.status(500).json({ error: 'Backup process failed' });
        }
    },

    // 2. RESTORE: Clear DB and Insert Data
    restoreBackup: async (req: Request, res: Response) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No backup file provided' });

            const fileContent = fs.readFileSync(req.file.path, 'utf-8');
            const backupData = JSON.parse(fileContent);

            await prisma.$transaction(async (tx) => {
                // 1. Delete all existing data (Respect Foreign Keys)
                for (const modelName of models) {
                    const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                    // @ts-ignore
                    if (tx[modelKey]) {
                        // @ts-ignore
                        await tx[modelKey].deleteMany();
                    }
                }

                // 2. Insert new data (Respect Dependency Order)
                for (const modelName of creationOrder) {
                    if (backupData[modelName] && Array.isArray(backupData[modelName])) {
                        const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                        // @ts-ignore
                        if (tx[modelKey]) {
                            // Use createMany for bulk insert (some DB drivers might limit this, but usually fine for <10k rows)
                            // Note: createMany might skip relations. Backup data usually has raw FK IDs.
                            // So createMany is perfect.
                            if (backupData[modelName].length > 0) {
                                // @ts-ignore
                                await tx[modelKey].createMany({
                                    data: backupData[modelName],
                                    skipDuplicates: true // Safety
                                });
                            }
                        }
                    }
                }
            }, {
                maxWait: 10000, // default: 2000
                timeout: 60000  // default: 5000 (Allow 60s for restore)
            });

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.json({ message: 'Restore completed successfully' });
        } catch (error) {
            console.error("Restore Failed:", error);
            res.status(500).json({ error: 'Restore failed (Check file format or constraints)' });
        }
    },

    // 3. RESET: Clear All Data
    resetData: async (req: Request, res: Response) => {
        try {
            await prisma.$transaction(async (tx) => {
                // Delete all data (Respect Foreign Keys)
                for (const modelName of models) {
                    const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                    // @ts-ignore
                    if (tx[modelKey]) {
                        // @ts-ignore
                        await tx[modelKey].deleteMany();

                        // Reset Auto Increment? (Optional, specific to MySQL. Requires raw query)
                        // await tx.$executeRawUnsafe(`ALTER TABLE ${modelName} AUTO_INCREMENT = 1`); 
                        // Note: Prisma table names might differ (e.g. PascalCase vs snake_case). 
                        // Skipping auto-increment reset to avoid complexity issues with table naming.
                    }
                }
            });
            res.json({ message: 'All data has been reset.' });
        } catch (error) {
            console.error("Reset Failed:", error);
            res.status(500).json({ error: 'Failed to reset data' });
        }
    }
};
