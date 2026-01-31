import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ItemStatus } from '@prisma/client';

export const inventoryController = {
    // Items (The product definition)
    createItem: async (req: Request, res: Response) => {
        try {
            const { name, categoryId, brandId, rentalPrice, description, imageUrls, variants } = req.body;

            // Variants might come as a JSON string if using FormData
            let parsedVariants = [];
            if (variants) {
                try {
                    parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
                } catch (e) {
                    // ignore parse error
                }
            }

            const item = await prisma.item.create({
                data: {
                    name,
                    categoryId: Number(categoryId), // Ensure numbers
                    brandId: Number(brandId),
                    rentalPrice: Number(rentalPrice),
                    description,
                    images: {
                        create: (imageUrls as string[])?.map((url, idx) => ({
                            url,
                            isPrimary: idx === 0
                        })) || []
                    },
                    variants: {
                        create: parsedVariants.map((v: any) => ({
                            sizeId: Number(v.sizeId),
                            colorId: Number(v.colorId),
                            // Note: We are creating 'ItemVariant' definitions here.
                            // If user also wants to add 'stock' (ItemInstance) immediately, 
                            // we would need nested create for instances, but for now 
                            // let's assume they configure definitions first.
                            // Extending to stock:
                            instances: v.quantity ? {
                                createMany: {
                                    data: Array(Number(v.quantity)).fill({ status: 'AVAILABLE', sku: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })
                                }
                            } : undefined
                        }))
                    }
                },
                include: { images: true, variants: true }
            });
            res.status(201).json(item);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create item' });
        }
    },

    updateItem: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, categoryId, brandId, rentalPrice, description, imageUrls } = req.body;

            console.log(`[UpdateItem] ID: ${id}, Body keys: ${Object.keys(req.body)}, ImageUrls: ${imageUrls?.length}`);

            const updateData: any = {};
            if (name) updateData.name = name;
            if (categoryId) updateData.categoryId = Number(categoryId);
            if (brandId) updateData.brandId = Number(brandId);
            if (rentalPrice) updateData.rentalPrice = Number(rentalPrice);
            if (description !== undefined) updateData.description = description;

            // Handle Images
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                updateData.images = {
                    create: imageUrls.map((url: string) => ({
                        url,
                        isPrimary: false
                    }))
                };
            }

            // Basic update
            const item = await prisma.item.update({
                where: { id: Number(id) },
                data: updateData,
                include: { images: true }
            });
            res.json(item);
        } catch (error) {
            console.error("[UpdateItem] Error:", error);
            res.status(500).json({ error: 'Failed to update item' });
        }
    },

    deleteItemImage: async (req: Request, res: Response) => {
        try {
            const { imageId } = req.params;
            await prisma.itemImage.delete({ where: { id: Number(imageId) } });
            res.json({ message: 'Image deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete image' });
        }
    },

    getItems: async (req: Request, res: Response) => {
        try {
            const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = (req.query.search as string) || '';
            const skip = (page - 1) * limit;

            const where: any = {};
            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { description: { contains: search } }
                ];
            }

            const include = {
                category: true,
                brand: true,
                images: true,
                variants: {
                    include: {
                        size: true,
                        color: true,
                        instances: {
                            select: { status: true }
                        },
                        _count: {
                            select: {
                                instances: {
                                    where: { status: ItemStatus.AVAILABLE }
                                }
                            }
                        }
                    },
                },
            };

            // Filters
            if (req.query.categoryId) {
                // @ts-ignore
                const catId = parseInt(req.query.categoryId);
                if (!isNaN(catId) && catId > 0) {
                    where.categoryId = catId;
                }
            }

            if (req.query.onlyWithImages === 'true') {
                where.images = {
                    some: {} // At least one image
                };
            }

            if (!hasPagination && !search && !req.query.categoryId && !req.query.onlyWithImages) {
                // Return simple array for backward compatibility (e.g., Showcase, Catalog)
                const items = await prisma.item.findMany({
                    include,
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(items);
            }

            const [items, total] = await Promise.all([
                prisma.item.findMany({
                    where,
                    include,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.item.count({ where })
            ]);

            res.json({
                items,
                total,
                page,
                limit,
                hasMore: total > skip + items.length
            });
        } catch (error) {
            console.error("Fetch items error:", error);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    },

    // Item Variants (Grouped by size/color)
    createVariant: async (req: Request, res: Response) => {
        try {
            const { itemId, sizeId, colorId } = req.body;

            // Check if exists
            const existing = await prisma.itemVariant.findFirst({
                where: { itemId: Number(itemId), sizeId: Number(sizeId), colorId: Number(colorId) }
            });

            if (existing) {
                return res.status(400).json({ error: 'Variant already exists' });
            }

            const variant = await prisma.itemVariant.create({
                data: {
                    itemId: Number(itemId),
                    sizeId: Number(sizeId),
                    colorId: Number(colorId),
                },
                include: { size: true, color: true }
            });
            res.status(201).json(variant);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create variant' });
        }
    },

    deleteVariant: async (req: Request, res: Response) => {
        try {
            const { variantId } = req.params;
            // Check if used in transactions or has stock? 
            // For now, simple delete. Prisma might block if FK constraints exist (ItemInstance).
            await prisma.itemVariant.delete({ where: { id: Number(variantId) } });
            res.json({ message: 'Variant deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete variant' });
        }
    },

    // Item Instances (Physical Stock / SKU)
    // Item Instances (Physical Stock / SKU)
    addStock: async (req: Request, res: Response) => {
        try {
            const { itemVariantId, sku, quantity = 1 } = req.body;

            const results = [];
            for (let i = 0; i < Number(quantity); i++) {
                const generatedSku = sku
                    ? (Number(quantity) > 1 ? `${sku}-${i + 1}` : sku)
                    : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const instance = await prisma.itemInstance.create({
                    data: {
                        itemVariantId: Number(itemVariantId),
                        sku: generatedSku,
                        status: 'AVAILABLE',
                    },
                });
                results.push(instance);
            }
            res.status(201).json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add stock' });
        }
    },

    // Get stock for a variant
    getVariantStock: async (req: Request, res: Response) => {
        try {
            const { variantId } = req.params;
            const instances = await prisma.itemInstance.findMany({
                where: { itemVariantId: Number(variantId) },
                include: {
                    itemVariant: {
                        include: {
                            item: true,
                            size: true,
                            color: true
                        }
                    }
                }
            });
            res.json(instances);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch stock' });
        }
    },
    // History & Resume
    getResume: async (req: Request, res: Response) => {
        try {
            const variants = await prisma.itemVariant.findMany({
                include: {
                    item: true,
                    size: true,
                    color: true,
                    instances: true
                }
            });

            const resume = variants.map(v => ({
                id: v.id,
                itemName: v.item.name,
                size: v.size.name,
                color: v.color.name,
                total: v.instances.length,
                available: v.instances.filter((i: any) => i.status === 'AVAILABLE').length,
                rented: v.instances.filter((i: any) => i.status === 'RENTED').length,
                laundry: v.instances.filter((i: any) => i.status === 'IN_LAUNDRY').length,
                notReady: v.instances.filter((i: any) => i.status === 'NOT_READY').length,
            }));

            res.json(resume);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch resume' });
        }
    },

    getHistory: async (req: Request, res: Response) => {
        try {
            // 1. Stock Additions
            const stockLogs = await prisma.itemInstance.findMany({
                // @ts-ignore
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    itemVariant: {
                        include: { item: true, size: true, color: true }
                    }
                }
            });

            const formattedStockLogs = stockLogs.map(l => ({
                type: 'STOCK_ADDED',
                // @ts-ignore
                date: l.createdAt,
                // @ts-ignore
                description: `New Stock Added: ${l.itemVariant.item.name} (${l.itemVariant.size.name}, ${l.itemVariant.color.name}) - SKU ${l.sku}`,
                relatedId: l.sku
            }));

            // 2. Transactions
            const transactions = await prisma.transaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    customer: true,
                    items: { include: { itemInstance: { include: { itemVariant: { include: { item: true } } } } } }
                }
            });

            const formattedTransactions = transactions.map(t => ({
                type: 'ORDER',
                date: t.createdAt,
                description: `Order #${t.id} by ${t.customer.name} - ${t.items.length} items`,
                status: t.status,
                relatedId: t.id
            }));

            // Combine and Sort
            const history = [...formattedStockLogs, ...formattedTransactions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            res.json(history);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    },
};
