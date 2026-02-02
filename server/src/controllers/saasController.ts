
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const saasController = {
    getHistory: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;

            const where: any = {};

            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            const logs = await prisma.saaSFeeLog.findMany({
                where,
                include: {
                    transaction: {
                        select: {
                            id: true,
                            pickupDate: true,
                            returnPlanDate: true,
                            status: true,
                            customer: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Calculate Summary
            const totalRevenue = logs.reduce((sum, log) => sum + log.amount, 0);
            const breakdown = {
                CUSTOMER: logs.filter(l => l.chargedTo === 'CUSTOMER').reduce((sum, l) => sum + l.amount, 0),
                MERCHANT: logs.filter(l => l.chargedTo === 'MERCHANT').reduce((sum, l) => sum + l.amount, 0),
            };

            res.json({ logs, summary: { totalRevenue, breakdown } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch SaaS history' });
        }
    }
};
