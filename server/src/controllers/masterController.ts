
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generic helper for basic CRUD
const createCrud = (modelName: string, orderBy: any = { id: 'asc' }) => ({
    getAll: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            let businessId = req.user?.businessId;

            if (!businessId && req.query.businessId) {
                const qBid = parseInt(req.query.businessId as string);
                if (!isNaN(qBid)) businessId = qBid;
            }

            if (!businessId) return res.status(400).json({ error: 'Business context required' });

            // @ts-ignore
            const items = await prisma[modelName].findMany({
                where: { businessId },
                orderBy
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: `Failed to fetch ${modelName}` });
        }
    },
    create: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const businessId = req.user?.businessId;
            // @ts-ignore
            const item = await prisma[modelName].create({
                data: { ...req.body, businessId }
            });
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: `Failed to create ${modelName}` });
        }
    },
    update: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            // @ts-ignore
            const existing = await prisma[modelName].findFirst({
                where: { id: parseInt((id as string) || '0'), businessId }
            });
            if (!existing) return res.status(404).json({ error: `${modelName} not found` });

            // @ts-ignore
            const item = await prisma[modelName].update({
                where: { id: parseInt((id as string) || '0') },
                data: req.body
            });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: `Failed to update ${modelName}` });
        }
    },
    delete: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            // @ts-ignore
            const existing = await prisma[modelName].findFirst({
                where: { id: parseInt((id as string) || '0'), businessId }
            });
            if (!existing) return res.status(404).json({ error: `${modelName} not found` });

            // @ts-ignore
            await prisma[modelName].delete({ where: { id: parseInt((id as string) || '0') } });
            res.json({ message: 'Deleted' });
        } catch (error) {
            res.status(500).json({ error: `Failed to delete ${modelName}` });
        }
    }
});

// Specific controllers can override or extend
const depositVariantsController = {
    getAll: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const businessId = req.user?.businessId;
            const items = await prisma.depositVariant.findMany({
                where: { active: true, businessId },
                orderBy: { amount: 'asc' }
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch deposit variants' });
        }
    },
    create: async (req: Request, res: Response) => {
        try {
            const { name, amount } = req.body;
            // @ts-ignore
            const businessId = req.user?.businessId;
            const item = await prisma.depositVariant.create({
                data: { name, amount: parseFloat(amount), businessId }
            });
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create deposit variant' });
        }
    },
    update: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, amount, active } = req.body;
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            const existing = await prisma.depositVariant.findFirst({
                where: { id: parseInt((id as string) || '0'), businessId }
            });
            if (!existing) return res.status(404).json({ error: 'Deposit variant not found' });

            const data: any = { name, active };
            if (amount !== undefined) {
                data.amount = parseFloat(amount);
            }
            const item = await prisma.depositVariant.update({
                where: { id: parseInt((id as string) || '0') },
                data
            });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update deposit variant' });
        }
    },
    delete: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            const existing = await prisma.depositVariant.findFirst({
                where: { id: parseInt((id as string) || '0'), businessId }
            });
            if (!existing) return res.status(404).json({ error: 'Deposit variant not found' });

            await prisma.depositVariant.update({
                where: { id: parseInt((id as string) || '0') },
                data: { active: false }
            });
            res.json({ message: 'Deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete deposit variant' });
        }
    }
}

export const masterController = {
    categories: createCrud('category', { name: 'asc' }),
    brands: createCrud('brand', { name: 'asc' }),
    colors: createCrud('color', { name: 'asc' }),
    sizes: createCrud('size', { id: 'asc' }), // Fixed: Size model doesn't have 'order' field
    paymentMethods: createCrud('paymentMethod', { name: 'asc' }),
    violationTypes: createCrud('violationType', { name: 'asc' }),
    customers: createCrud('customer', { name: 'asc' }),
    laundryPartners: createCrud('laundryPartner', { name: 'asc' }),

    // Deposit Variants (Custom Logic)
    getDepositVariants: depositVariantsController.getAll,
    createDepositVariant: depositVariantsController.create,
    updateDepositVariant: depositVariantsController.update,
    deleteDepositVariant: depositVariantsController.delete
    // Public: Get Business by Slug
    getBusinessBySlug: async (req: Request, res: Response) => {
        try {
            const { slug } = req.params;
            const business = await prisma.business.findUnique({
                where: { slug },
                select: { id: true, name: true, slug: true, address: true, phone: true }
            });
            if (!business) return res.status(404).json({ error: 'Business not found' });
            res.json(business);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed' });
        }
    }
};
