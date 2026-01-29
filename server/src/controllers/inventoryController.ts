import type { Request, Response } from 'express';
import prisma from '../prisma.js';

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

            // Basic update
            const item = await prisma.item.update({
                where: { id: Number(id) },
                data: {
                    name,
                    categoryId: Number(categoryId),
                    brandId: Number(brandId),
                    rentalPrice: Number(rentalPrice),
                    description,
                    // If items are added, we just create new ItemImages. 
                    // Deletion of specific old images should ideally be a separate endpoint or handled via a 'deletedImageIds' list, 
                    // but for now let's just allow ADDING via update, or we can clear and replace if that's the intention (dangerous).
                    // Better approach for now: New images from upload are APPENDED.
                    images: {
                        create: (imageUrls as string[])?.map((url) => ({
                            url,
                            isPrimary: false
                        })) || []
                    }
                },
                include: { images: true }
            });
            res.json(item);
        } catch (error) {
            console.error(error);
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
            const items = await prisma.item.findMany({
                include: {
                    category: true,
                    brand: true,
                    images: true, // Include images
                    variants: {
                        include: {
                            size: true,
                            color: true,
                            _count: {
                                select: {
                                    instances: {
                                        where: { status: 'AVAILABLE' }
                                    }
                                }
                            }
                        },
                    },
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(items);
        } catch (error) {
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
};
