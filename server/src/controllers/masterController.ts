
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generic helper for basic CRUD
const createCrud = (modelName: string, orderBy: any = { id: 'asc' }) => ({
    getAll: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const items = await prisma[modelName].findMany({ orderBy });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: `Failed to fetch ${modelName}` });
        }
    },
    create: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const item = await prisma[modelName].create({ data: req.body });
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: `Failed to create ${modelName}` });
        }
    },
    update: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
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
            const items = await prisma.depositVariant.findMany({
                where: { active: true },
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
            const item = await prisma.depositVariant.create({
                data: { name, amount: parseFloat(amount) }
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
};
