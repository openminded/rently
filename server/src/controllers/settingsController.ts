
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSettings = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const businessId = req.user?.businessId;
        const settings = await prisma.appSetting.findMany({
            where: { businessId }
        });
        // Convert to object for easier consumption { KEY: VALUE }
        const settingsMap: { [key: string]: string } = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Public settings fetcher (subset of settings)
export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        const businessId = parseInt(req.query.businessId as string) || 1;

        const settings = await prisma.appSetting.findMany({
            where: {
                businessId, // Filter by Business
                OR: [
                    { key: { in: ['BRAND_NAME', 'BRAND_LOGO', 'BRAND_TAGLINE'] } },
                    { key: { startsWith: 'LANDING_' } }
                ]
            }
        });
        const settingsMap: { [key: string]: string } = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch public settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body; // Expecting { KEY: VALUE, KEY2: VALUE2 }

        // @ts-ignore
        const businessId = req.user?.businessId;

        const promises = Object.keys(updates).map(async (key) => {
            const existing = await prisma.appSetting.findFirst({
                where: { key, businessId }
            });

            if (existing) {
                return prisma.appSetting.update({
                    where: { id: existing.id },
                    data: { value: updates[key] }
                });
            } else {
                return prisma.appSetting.create({
                    data: { key, value: updates[key], businessId }
                });
            }
        });

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
