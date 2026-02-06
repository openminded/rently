import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const referralController = {
    // Partner Management
    createPartner: async (req: Request, res: Response) => {
        try {
            const { name, phone, email, bankInfo } = req.body;
            const partner = await prisma.referralPartner.create({
                data: { name, phone, email, bankInfo }
            });
            res.status(201).json(partner);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to create partner' });
        }
    },

    getAllPartners: async (req: Request, res: Response) => {
        try {
            const partners = await prisma.referralPartner.findMany({
                include: { codes: true }
            });
            res.json(partners);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch partners' });
        }
    },

    getPartnerById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const partner = await prisma.referralPartner.findUnique({
                where: { id: parseInt(id as string) },
                include: { codes: true }
            });
            if (!partner) return res.status(404).json({ error: 'Partner not found' });
            res.json(partner);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch partner' });
        }
    },

    // Code Management
    createCode: async (req: Request, res: Response) => {
        try {
            const { partnerId, code, discountType, discountValue, commissionRate } = req.body;
            const newCode = await prisma.referralCode.create({
                data: {
                    partnerId: parseInt(partnerId),
                    code: code.toUpperCase(),
                    discountType,
                    discountValue,
                    commissionRate
                }
            });
            res.status(201).json(newCode);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to create referral code' });
        }
    },

    validateCode: async (req: Request, res: Response) => {
        try {
            const { code } = req.body;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ valid: false, message: 'Referral code is required' });
            }

            const referral = await prisma.referralCode.findUnique({
                where: { code: code.toUpperCase() },
                include: { partner: { select: { name: true } } }
            });

            if (!referral || !referral.isActive) {
                return res.status(404).json({ valid: false, message: 'Invalid or inactive Referral Code' });
            }

            res.json({
                valid: true,
                id: referral.id,
                discountType: referral.discountType,
                discountValue: referral.discountValue,
                partnerName: referral.partner.name
            });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to validate code' });
        }
    },

    updatePartner: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            const { name, phone, email, bankInfo } = req.body;
            const partner = await prisma.referralPartner.update({
                where: { id: parseInt(id as string) },
                data: { name, phone, email, bankInfo }
            });
            res.json(partner);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to update partner' });
        }
    },

    deletePartner: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            await prisma.referralPartner.delete({
                where: { id: parseInt(id as string) }
            });
            res.json({ message: 'Partner deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to delete partner' });
        }
    },

    // Commission Logs
    getCommissionLogs: async (req: Request, res: Response) => {
        try {
            const { partnerId, ids } = req.query;
            const pidString = typeof partnerId === 'string' ? partnerId : undefined;
            const pid = pidString ? parseInt(pidString) : undefined;

            let whereClause: any = pid ? { referralCode: { partnerId: pid } } : {};

            if (ids && typeof ids === 'string') {
                const idList = ids.split(',').map(id => parseInt(id));
                whereClause = { ...whereClause, id: { in: idList } };
            }

            const logs = await prisma.commissionLog.findMany({
                where: whereClause,
                include: {
                    referralCode: { include: { partner: true } },
                    transaction: { select: { id: true, totalAmount: true, status: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(logs);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch commission logs' });
        }
    },

    payCommission: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: 'ID is required' });
            const log = await prisma.commissionLog.update({
                where: { id: parseInt(id as string) },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            });
            res.json(log);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to update commission status' });
        }
    },

    bulkPayCommissions: async (req: Request, res: Response) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array is required' });

            const result = await prisma.commissionLog.updateMany({
                where: {
                    id: { in: ids.map(id => parseInt(id)) },
                    status: 'PENDING'
                },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            });

            res.json({ message: 'Commissions updated successfully', count: result.count });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to process bulk payout' });
        }
    },

    getPayoutHistory: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate, partnerId } = req.query;

            const where: any = { status: 'PAID' };

            if (startDate && endDate) {
                where.paidAt = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string + 'T23:59:59.999Z')
                };
            }

            if (partnerId) {
                where.referralCode = {
                    partnerId: parseInt(partnerId as string)
                };
            }

            const logs = await prisma.commissionLog.findMany({
                where,
                include: {
                    referralCode: { include: { partner: true } },
                    transaction: { select: { id: true, totalAmount: true, status: true } }
                },
                orderBy: { paidAt: 'desc' }
            });

            // Group by partner and a rough timestamp (same minute usually means same bulk action)
            const grouped = logs.reduce((acc: any[], curr) => {
                if (!curr.paidAt) return acc;

                const timeKey = curr.paidAt.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
                const partnerId = curr.referralCode.partner.id;

                const group = acc.find(g => g.timeKey === timeKey && g.partnerId === partnerId);

                if (group) {
                    group.items.push(curr);
                    group.totalAmount += curr.amount;
                } else {
                    acc.push({
                        id: `${timeKey}-${partnerId}`,
                        timeKey,
                        paidAt: curr.paidAt,
                        partnerId,
                        partner: curr.referralCode.partner,
                        totalAmount: curr.amount,
                        items: [curr]
                    });
                }
                return acc;
            }, []);

            res.json(grouped);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch payout history' });
        }
    }
};
