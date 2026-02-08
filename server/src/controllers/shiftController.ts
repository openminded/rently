import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const shiftController = {
    getCurrentShift: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            const shift = await prisma.shift.findFirst({
                where: { userId, status: 'OPEN' }
            });

            if (!shift) {
                return res.json({ isOpen: false });
            }

            // Calculate expected cash dynamically
            const cashPayments = await prisma.payment.aggregate({
                where: {
                    shiftId: shift.id,
                    paymentMethod: { type: 'CASH' }
                },
                _sum: { amount: true }
            });

            const expectedCash = shift.startCash + (cashPayments._sum.amount || 0);

            res.json({
                isOpen: true,
                ...shift,
                expectedCash: Number(expectedCash || 0)
            });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    openShift: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            const { startCash, notes } = req.body;

            console.log(`[Shift] Attempting to open shift for user ${userId}`, { startCash, notes });

            // Check if already open
            const existing = await prisma.shift.findFirst({
                where: { userId, status: 'OPEN' }
            });

            if (existing) {
                console.log(`[Shift] User ${userId} already has an open shift: ${existing.id}`);
                return res.status(400).json({ error: 'Shift already open' });
            }

            const shift = await prisma.shift.create({
                data: {
                    userId,
                    startCash: parseFloat(startCash || 0),
                    notes,
                    status: 'OPEN'
                }
            });

            console.log(`[Shift] Successfully opened shift ${shift.id} for user ${userId}`);
            res.status(201).json(shift);
        } catch (error: any) {
            console.error('[Shift] Error opening shift:', error);
            res.status(500).json({ error: error.message });
        }
    },

    closeShift: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { actualCash, notes } = req.body;

            const shift = await prisma.shift.findUnique({
                where: { id: parseInt(id as string) }
            });

            if (!shift || shift.status === 'CLOSED') {
                return res.status(400).json({ error: 'Shift not found or already closed' });
            }

            // Recalculate expected cash
            const cashPayments = await prisma.payment.aggregate({
                where: {
                    shiftId: shift.id,
                    paymentMethod: { type: 'CASH' }
                },
                _sum: { amount: true }
            });

            const expectedCash = shift.startCash + (cashPayments._sum.amount || 0);
            const variance = parseFloat(actualCash) - expectedCash;

            const updated = await prisma.shift.update({
                where: { id: shift.id },
                data: {
                    endTime: new Date(),
                    actualCash: parseFloat(actualCash),
                    expectedCash,
                    variance,
                    notes: notes || shift.notes,
                    status: 'CLOSED'
                }
            });

            res.json(updated);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    getHistory: async (req: Request, res: Response) => {
        try {
            const { userId, status } = req.query;
            const where: any = {};

            if (status) where.status = status as string;
            if (userId) where.userId = parseInt(userId as string);

            const shifts = await prisma.shift.findMany({
                where,
                include: { user: { select: { name: true, username: true } } },
                orderBy: { startTime: 'desc' }
            });

            res.json(shifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
