
import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const laundryController = {
    // Get laundry items by status (WAITING, IN_PROGRESS, COMPLETED)
    getAll: async (req: Request, res: Response) => {
        try {
            const { status } = req.query;
            const where = status ? { status: status as string } : {};

            const items = await prisma.laundryLog.findMany({
                where,
                include: {
                    itemInstance: {
                        include: {
                            itemVariant: {
                                include: { item: true, size: true, color: true }
                            }
                        }
                    },
                    batch: {
                        include: {
                            partner: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(items);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch laundry items' });
        }
    },

    // Get all batches (for In Progress and Complete tabs)
    getBatches: async (req: Request, res: Response) => {
        try {
            const { status } = req.query;
            const where = status ? { status: status as string } : {};

            const batches = await prisma.laundryBatch.findMany({
                where,
                include: {
                    partner: true,
                    logs: {
                        include: {
                            itemInstance: {
                                include: {
                                    itemVariant: {
                                        include: { item: true, size: true, color: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(batches);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch batches' });
        }
    },

    // Create batch and send to laundry partner
    createBatch: async (req: Request, res: Response) => {
        try {
            const { partnerId, logIds, expense, note } = req.body;
            const userId = (req as any).user?.id;

            if (!partnerId || !logIds || logIds.length === 0) {
                return res.status(400).json({ error: 'Partner and items are required' });
            }

            const result = await prisma.$transaction(async (tx) => {
                // Create batch
                const batch = await tx.laundryBatch.create({
                    data: {
                        partnerId,
                        expense: expense || 0,
                        note,
                        status: 'IN_PROGRESS'
                    }
                });

                // Update laundry logs
                await tx.laundryLog.updateMany({
                    where: { id: { in: logIds } },
                    data: {
                        batchId: batch.id,
                        status: 'IN_PROGRESS'
                    }
                });

                // Create expense record
                if (expense && expense > 0) {
                    await tx.expense.create({
                        data: {
                            type: 'LAUNDRY',
                            amount: expense,
                            description: `Laundry batch #${batch.id} - ${note || 'Sent to partner'}`,
                            referenceId: batch.id,
                            createdBy: userId
                        }
                    });
                }

                return batch;
            });

            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create batch' });
        }
    },

    // Complete batch (or specific items in batch)
    completeBatch: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { items } = req.body; // Array of { logId: number, status: 'AVAILABLE' | 'NOT_READY', note?: string }

            await prisma.$transaction(async (tx) => {
                const batchId = parseInt(id);

                // If items provided, update specific logs
                if (items && Array.isArray(items) && items.length > 0) {
                    for (const item of items) {
                        // Get log to find instance SKU
                        const log = await tx.laundryLog.findUnique({
                            where: { id: item.logId }
                        });

                        if (!log) continue;

                        // Update Log
                        await tx.laundryLog.update({
                            where: { id: log.id },
                            data: {
                                status: 'COMPLETED',
                                completedDate: new Date()
                            }
                        });

                        // Update Item Instance Status
                        await tx.itemInstance.update({
                            where: { sku: log.itemInstanceSku },
                            data: {
                                status: item.status // 'AVAILABLE' or 'NOT_READY'
                                // Note: Schema might need a condition, check transactionController update
                            }
                        });
                    }
                } else {
                    // Fallback: Mark ALL logs as COMPLETED/AVAILABLE (Old behavior)
                    const logs = await tx.laundryLog.findMany({
                        where: { batchId: batchId, status: { not: 'COMPLETED' } }
                    });

                    for (const log of logs) {
                        await tx.laundryLog.update({
                            where: { id: log.id },
                            data: { status: 'COMPLETED', completedDate: new Date() }
                        });
                        await tx.itemInstance.update({
                            where: { sku: log.itemInstanceSku },
                            data: { status: 'AVAILABLE' }
                        });
                    }
                }

                // Check if ALL logs in batch are completed
                const remainingLogs = await tx.laundryLog.count({
                    where: { batchId: batchId, status: { not: 'COMPLETED' } }
                });

                if (remainingLogs === 0) {
                    await tx.laundryBatch.update({
                        where: { id: batchId },
                        data: {
                            status: 'COMPLETED',
                            completedDate: new Date()
                        }
                    });
                }
            });

            res.json({ message: 'Batch items processed successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to complete batch' });
        }
    }
};
