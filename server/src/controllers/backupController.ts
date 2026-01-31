import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import fs from 'fs';
import path from 'path';

// Define model order for dependencies
// For Restore/Deletion: Delete in reverse order of creation
const models = [
    'Broadcast', // Depends on BroadcastTemplate
    'Fine', 'Payment', 'TransactionItem', 'Transaction', // Transactions depends on Customer
    'Expense', // Expense might link to User, LaundryBatch, or ExpenseCategory
    'LaundryLog', // LaundryLog depends on LaundryBatch (sometimes) and ItemInstance
    'LaundryBatch', // LaundryBatch depends on LaundryPartner
    'LaundryPartner',
    'ItemInstance', 'ItemVariant', 'ItemImage', 'Item', // Items
    'Customer', 'Category', 'Brand', 'Color', 'Size', 'PaymentMethod', 'ViolationType',
    'ExpenseCategory', 'DepositVariant', 'BroadcastTemplate', 'AppSetting', 'User'
];

// For Restore/Creation: Create in this order
const creationOrder = [
    'User', 'AppSetting', 'ViolationType', 'PaymentMethod', 'Size', 'Color', 'Brand', 'Category', 'Customer',
    'ExpenseCategory', 'DepositVariant', 'BroadcastTemplate',
    'Item', 'ItemImage', 'ItemVariant', 'ItemInstance',
    'LaundryPartner', 'LaundryBatch', 'LaundryLog',
    'Transaction', 'TransactionItem', 'Payment', 'Fine', 'Expense', 'Broadcast'
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

    // 3. RESET: Clear Operational Data Only (Preserves Master Data & Settings)
    // IMPORTANT: This function only deletes operational/transactional data.
    // Master data from Settings menu is PRESERVED (Users, Categories, Brands, Colors, Sizes, etc.)
    // Media assets in /uploads/ directory are also preserved.
    resetData: async (req: Request, res: Response) => {
        try {
            // Only delete operational data, NOT master data
            const operationalModels = [
                'Broadcast',
                'Fine', 'Payment', 'TransactionItem', 'Transaction',
                'Expense',
                'LaundryLog', 'LaundryBatch',
                'ItemInstance', 'ItemVariant', 'ItemImage', 'Item',
                'Customer'
            ];

            await prisma.$transaction(async (tx) => {
                // Delete only operational data (Respects Foreign Keys)
                for (const modelName of operationalModels) {
                    const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                    // @ts-ignore
                    if (tx[modelKey]) {
                        // @ts-ignore
                        await tx[modelKey].deleteMany();
                    }
                }
            });
            res.json({
                message: 'Operational data has been reset. Master data and settings are preserved.'
            });
        } catch (error) {
            console.error("Reset Failed:", error);
            res.status(500).json({ error: 'Failed to reset data' });
        }
    }
};
