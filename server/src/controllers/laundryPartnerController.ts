import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all laundry partners
export const getAllPartners = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const businessId = req.user?.businessId;
        const partners = await prisma.laundryPartner.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(partners);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch laundry partners' });
    }
};

// Get single partner
export const getPartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const businessId = req.user?.businessId;
        const partner = await prisma.laundryPartner.findFirst({
            where: { id: parseInt((id as string) || '0'), businessId },
            include: {
                batches: {
                    include: {
                        logs: {
                            include: {
                                itemInstance: {
                                    include: {
                                        itemVariant: {
                                            include: {
                                                item: true,
                                                size: true,
                                                color: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!partner) return res.status(404).json({ error: 'Partner not found' });
        res.json(partner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch partner' });
    }
};

// Create partner
export const createPartner = async (req: Request, res: Response) => {
    try {
        const { name, phone, address } = req.body;
        // @ts-ignore
        const businessId = req.user?.businessId;
        const partner = await prisma.laundryPartner.create({
            data: { name, phone, address, businessId }
        });
        res.status(201).json(partner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
};

// Update partner
export const updatePartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;
        // @ts-ignore
        const businessId = req.user?.businessId;

        const existing = await prisma.laundryPartner.findFirst({
            where: { id: parseInt((id as string) || '0'), businessId }
        });
        if (!existing) return res.status(404).json({ error: 'Partner not found' });

        const partner = await prisma.laundryPartner.update({
            where: { id: parseInt((id as string) || '0') },
            data: { name, phone, address }
        });
        res.json(partner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
};

// Delete partner
export const deletePartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const businessId = req.user?.businessId;

        const existing = await prisma.laundryPartner.findFirst({
            where: { id: parseInt((id as string) || '0'), businessId }
        });
        if (!existing) return res.status(404).json({ error: 'Partner not found' });

        await prisma.laundryPartner.delete({
            where: { id: parseInt((id as string) || '0') }
        });
        res.json({ message: 'Partner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
};
