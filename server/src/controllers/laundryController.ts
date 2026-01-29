
import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const laundryController = {
    // Get all items currently in laundry
    getAll: async (req: Request, res: Response) => {
        try {
            const items = await prisma.laundryLog.findMany({
                where: { status: 'IN_LAUNDRY' },
                include: {
                    itemInstance: {
                        include: {
                            itemVariant: {
                                include: { item: true, size: true, color: true }
                            }
                        }
                    }
                },
                orderBy: { sentDate: 'desc' }
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch laundry items' });
        }
    },

    // Mark items as completed (clean)
    complete: async (req: Request, res: Response) => {
        try {
            const { logIds } = req.body; // Array of LaundryLog IDs

            await prisma.$transaction(async (tx) => {
                for (const logId of logIds) {
                    const log = await tx.laundryLog.findUnique({ where: { id: logId } });
                    if (!log) continue;

                    // Update Log
                    await tx.laundryLog.update({
                        where: { id: logId },
                        data: {
                            status: 'COMPLETED',
                            receivedDate: new Date()
                        }
                    });

                    // Update Item Instance to AVAILABLE
                    await tx.itemInstance.update({
                        where: { sku: log.itemInstanceSku },
                        data: { status: 'AVAILABLE' }
                    });
                }
            });

            res.json({ message: 'Laundry completed successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete laundry' });
        }
    }
};
