import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import { whatsappService } from '../services/whatsappService.js';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.broadcastTemplate.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        res.json(templates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, content } = req.body;
        const template = await prisma.broadcastTemplate.create({
            data: { name, content }
        });
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, content } = req.body;
        const template = await prisma.broadcastTemplate.update({
            where: { id: Number(id) },
            data: { name, content }
        });
        res.json(template);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.broadcastTemplate.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createBroadcast = async (req: Request, res: Response) => {
    try {
        const { templateId, name, content, scheduledAt, targets } = req.body;

        const broadcast = await prisma.broadcast.create({
            data: {
                templateId: templateId ? Number(templateId) : null,
                name,
                content,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: 'PENDING',
                targets // Array of { phone, name }
            }
        });

        // If not scheduled, process immediately (or we can just let the job pick it up)
        // For better UX, we could trigger it here if scheduledAt is null

        res.json(broadcast);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getBroadcastHistory = async (req: Request, res: Response) => {
    try {
        const history = await prisma.broadcast.findMany({
            include: { template: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const sendDirectMessage = async (req: Request, res: Response) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone and message are required' });
        }
        await whatsappService.sendMessage(phone, message);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getReminderTargets = async (req: Request, res: Response) => {
    try {
        const { type } = req.query; // 'PICKUP' | 'RETURN'
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        let targets: any[] = [];
        let templateName = '';

        if (type === 'PICKUP') {
            templateName = 'Reminder Pickup';
            const txs = await prisma.transaction.findMany({
                where: {
                    status: { in: ['BOOKED', 'WAITING_PICKUP'] },
                    pickupDate: { gte: startOfDay, lte: endOfDay }
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            itemInstance: {
                                include: {
                                    itemVariant: {
                                        include: { item: true, color: true, size: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            targets = txs.map(tx => {
                const itemNames = tx.items.map(ti => {
                    const variant = ti.itemInstance.itemVariant;
                    return `${variant.item.name} (${variant.size.name})`;
                }).join(', ');
                return {
                    phone: tx.customer.phone,
                    name: tx.customer.name,
                    items: itemNames
                };
            });
        } else if (type === 'RETURN') {
            templateName = 'Reminder Return';
            const txs = await prisma.transaction.findMany({
                where: {
                    status: 'RENTED',
                    returnPlanDate: { gte: startOfDay, lte: endOfDay }
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            itemInstance: {
                                include: {
                                    itemVariant: {
                                        include: { item: true, color: true, size: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            targets = txs.map(tx => {
                const itemNames = tx.items.map(ti => {
                    const variant = ti.itemInstance.itemVariant;
                    return `${variant.item.name} (${variant.color.name}, ${variant.size.name})`;
                }).join(', ');
                return {
                    phone: tx.customer.phone,
                    name: tx.customer.name,
                    items: itemNames
                };
            });
        } else {
            return res.status(400).json({ error: 'Invalid type. Use PICKUP or RETURN' });
        }

        const template = await prisma.broadcastTemplate.findUnique({ where: { name: templateName } });

        res.json({
            targets,
            content: template?.content || '',
            templateId: template?.id
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
