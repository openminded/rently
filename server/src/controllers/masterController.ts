import type { Request, Response } from 'express';
import prisma from '../prisma.js';

// Generic handler for fetching all items
export const getAll = (model: any) => async (req: Request, res: Response) => {
    try {
        const items = await model.findMany();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

// Generic handler for creating an item
export const create = (model: any) => async (req: Request, res: Response) => {
    try {
        const item = await model.create({
            data: req.body,
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
};

export const update = (model: any) => async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await model.update({
            where: { id: Number(id) },
            data: req.body,
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const deleteItem = (model: any) => async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await model.delete({
            where: { id: Number(id) },
        });
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

export const masterController = {
    categories: {
        getAll: getAll(prisma.category),
        create: create(prisma.category),
        update: update(prisma.category),
        delete: deleteItem(prisma.category),
    },
    brands: {
        getAll: getAll(prisma.brand),
        create: create(prisma.brand),
        update: update(prisma.brand),
        delete: deleteItem(prisma.brand),
    },
    colors: {
        getAll: getAll(prisma.color),
        create: create(prisma.color),
        update: update(prisma.color),
        delete: deleteItem(prisma.color),
    },
    sizes: {
        getAll: getAll(prisma.size),
        create: create(prisma.size),
        update: update(prisma.size),
        delete: deleteItem(prisma.size),
    },
    paymentMethods: {
        getAll: getAll(prisma.paymentMethod),
        create: create(prisma.paymentMethod),
        update: update(prisma.paymentMethod),
        delete: deleteItem(prisma.paymentMethod),
    },
    violationTypes: {
        getAll: getAll(prisma.violationType),
        create: create(prisma.violationType),
        update: update(prisma.violationType),
        delete: deleteItem(prisma.violationType),
    },
    customers: {
        getAll: getAll(prisma.customer),
        create: create(prisma.customer),
        update: update(prisma.customer),
        delete: deleteItem(prisma.customer),
    },
};
