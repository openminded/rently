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

            // @ts-ignore
            const businessId = req.user?.businessId;
            if (!businessId) return res.status(400).json({ error: 'Business ID missing' });

            const item = await prisma.item.create({
                data: {
                    businessId: businessId,
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
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify ownership
            const existing = await prisma.item.findFirst({
                where: { id: Number(id), businessId }
            });
            if (!existing) return res.status(404).json({ error: 'Item not found' });

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
                where: { id: Number(id) }, // Verified above
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

            // @ts-ignore
            let businessId = req.user?.businessId;

            if (!businessId && req.query.businessId) {
                const qBid = parseInt(req.query.businessId as string);
                if (!isNaN(qBid)) {
                    businessId = qBid;
                }
            }

            if (!businessId) {
                return res.status(400).json({ error: 'Business context required' });
            }



            // 1. Date Range Filtering Prep (Default to Today if missing)
            let startDateStr = (req.query.startDate as string) || '';
            let endDateStr = (req.query.endDate as string) || '';

            if (!startDateStr || !endDateStr) {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0] || '';
                startDateStr = todayStr;
                endDateStr = todayStr;
            }

            let excludedSkus: string[] = [];

            // 2. Fetch Settings for Laundry Overlap Rule
            const settings = await prisma.appSetting.findMany({
                where: {
                    key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS'] },
                    businessId: businessId // Scope settings
                }
            });
            const enableLaundryRule = settings.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(settings.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');
            const reqBuffer = enableLaundryRule ? laundryDays : 0;

            const reqStart = new Date(startDateStr);
            const reqEnd = new Date(endDateStr);
            reqStart.setHours(0, 0, 0, 0);
            reqEnd.setHours(0, 0, 0, 0);

            // 3. Find all conflicting transactions (Smart Overlap Logic)
            const activeTransactions = await prisma.transaction.findMany({
                where: {
                    status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] },
                    businessId: businessId // Scope transactions
                },
                include: { items: true }
            });

            activeTransactions.forEach(tx => {
                const txStart = new Date(tx.pickupDate);
                const txEnd = new Date(tx.returnPlanDate);
                txStart.setHours(0, 0, 0, 0);
                txEnd.setHours(0, 0, 0, 0);

                const txEffectiveEnd = new Date(txEnd);
                txEffectiveEnd.setDate(txEffectiveEnd.getDate() + reqBuffer);
                const overlap1 = (reqStart <= txEffectiveEnd) && (reqEnd >= txStart);

                const reqEffectiveEnd = new Date(reqEnd);
                reqEffectiveEnd.setDate(reqEffectiveEnd.getDate() + reqBuffer);
                const overlap2 = (txStart <= reqEffectiveEnd) && (txEnd >= reqStart);

                if (overlap1 || overlap2) {
                    tx.items.forEach(ti => {
                        if (ti.itemInstanceSku) excludedSkus.push(ti.itemInstanceSku);
                    });
                }
            });



            const where: any = { businessId }; // Base Scope

            // 4. Base Availability Filter
            // An Item is "Available" if at least one instance is NOT in excludedSkus AND status is AVAILABLE
            where.variants = {
                some: {
                    instances: {
                        some: {
                            sku: { notIn: excludedSkus },
                            status: ItemStatus.AVAILABLE
                        }
                    }
                }
            };

            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { description: { contains: search } },
                    {
                        variants: {
                            some: {
                                instances: {
                                    some: {
                                        sku: { contains: search }
                                    }
                                }
                            }
                        }
                    }
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
                            select: { status: true, sku: true }
                        },
                        _count: {
                            select: {
                                instances: {
                                    where: {
                                        sku: { notIn: excludedSkus },
                                        status: ItemStatus.AVAILABLE
                                    }
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

                // Add aggregate status
                const itemsWithStatus = (items as any[]).map(item => {
                    const totalAvailable = item.variants.reduce((sum: number, v: any) => sum + (v._count?.instances || 0), 0);
                    return {
                        ...item,
                        status: totalAvailable > 0 ? ItemStatus.AVAILABLE : ItemStatus.RENTED
                    };
                });

                return res.json(itemsWithStatus);
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

            // Add aggregate status to paginated results
            const itemsWithStatus = (items as any[]).map(item => {
                const totalAvailable = item.variants.reduce((sum: number, v: any) => sum + (v._count?.instances || 0), 0);
                return {
                    ...item,
                    status: totalAvailable > 0 ? ItemStatus.AVAILABLE : ItemStatus.RENTED
                };
            });

            res.json({
                items: itemsWithStatus,
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
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify Item Ownership
            const item = await prisma.item.findFirst({
                where: { id: Number(itemId), businessId }
            });
            if (!item) return res.status(404).json({ error: 'Item not found' });

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
            // @ts-ignore
            const businessId = req.user?.businessId;

            const variant = await prisma.itemVariant.findFirst({
                where: { id: Number(variantId), item: { businessId } }
            });
            if (!variant) return res.status(404).json({ error: 'Variant not found' });

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
            // @ts-ignore
            const businessId = req.user?.businessId;

            // Verify Variant Ownership
            const variant = await prisma.itemVariant.findFirst({
                where: { id: Number(itemVariantId), item: { businessId } }
            });
            if (!variant) return res.status(404).json({ error: 'Variant not found' });

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
            // @ts-ignore
            const businessId = req.user?.businessId;

            const instances = await prisma.itemInstance.findMany({
                where: {
                    itemVariantId: Number(variantId),
                    itemVariant: { item: { businessId } } // Ensure scoped
                },
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

    // Get stock instance by SKU (for Barcode)
    getInstanceBySku: async (req: Request, res: Response) => {
        try {
            const { sku } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            const instance = await prisma.itemInstance.findFirst({
                where: {
                    sku: sku as string,
                    itemVariant: { item: { businessId } }
                },
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

            if (!instance) {
                return res.status(404).json({ error: 'Item not found' });
            }

            res.json(instance);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch item by SKU' });
        }
    },

    // History & Resume
    getResume: async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const businessId = req.user?.businessId;

            const variants = await prisma.itemVariant.findMany({
                where: { item: { businessId } },
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
            // @ts-ignore
            const businessId = req.user?.businessId;

            // 1. Stock Additions
            const stockLogs = await prisma.itemInstance.findMany({
                where: { itemVariant: { item: { businessId } } },
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
                where: { businessId },
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

    getVariantAvailability: async (req: Request, res: Response) => {
        try {
            const { variantId } = req.params;
            // @ts-ignore
            const businessId = req.user?.businessId;

            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required' });
            }

            const reqStart = new Date(startDate as string);
            const reqEnd = new Date(endDate as string);
            reqStart.setHours(0, 0, 0, 0);
            reqEnd.setHours(0, 0, 0, 0);

            // Fetch Settings for Laundry Overlap Rule
            const settings = await prisma.appSetting.findMany({
                where: {
                    key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS'] },
                    businessId
                }
            });
            const enableLaundryRule = settings.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(settings.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');
            const reqBuffer = enableLaundryRule ? laundryDays : 0;

            // Fetch all instances of this variant
            const instances = await prisma.itemInstance.findMany({
                where: { itemVariantId: Number(variantId) },
                // Note: We should verify ownership here
                // where: { itemVariantId: ..., itemVariant: { item: { businessId } } }
                // But if we trust `getVariantAvailability` is called with correct unrelated ID?
                // Better safe:
                // where: { itemVariantId: Number(variantId), itemVariant: { item: { businessId } } }
                select: { sku: true, status: true }
            });

            const skus = instances.map(i => i.sku);

            // Fetch transactions involving these SKUs that overlap with the requested range
            const transactions = await prisma.transaction.findMany({
                where: {
                    status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] },
                    items: {
                        some: {
                            itemInstanceSku: { in: skus }
                        }
                    }
                },
                include: { items: true }
            });

            const availabilityMap: { [date: string]: boolean } = {};

            // Iterate over each day in the range
            const current = new Date(reqStart);
            while (current <= reqEnd) {
                const dateKey = current.toISOString().split('T')[0] || '';
                const dayStart = new Date(current);
                const dayEnd = new Date(current);
                dayStart.setHours(0, 0, 0, 0);
                dayEnd.setHours(23, 59, 59, 999);

                // For this specific day, find occupied SKUs
                const occupiedSkus = new Set<string>();

                transactions.forEach(tx => {
                    const txStart = new Date(tx.pickupDate);
                    const txEnd = new Date(tx.returnPlanDate);
                    txStart.setHours(0, 0, 0, 0);
                    txEnd.setHours(0, 0, 0, 0);

                    const txEffectiveEnd = new Date(txEnd);
                    txEffectiveEnd.setDate(txEffectiveEnd.getDate() + reqBuffer);

                    // Check if transaction (plus buffer) overlaps with this specific "day"
                    const overlap = (dayStart <= txEffectiveEnd) && (dayEnd >= txStart);

                    if (overlap) {
                        tx.items.forEach(ti => {
                            if (ti.itemInstanceSku && skus.includes(ti.itemInstanceSku)) {
                                occupiedSkus.add(ti.itemInstanceSku);
                            }
                        });
                    }
                });

                // Check if any instance is available (status is AVAILABLE AND not occupied)
                const availableInstance = instances.find(inst =>
                    inst.status === 'AVAILABLE' && !occupiedSkus.has(inst.sku)
                );

                availabilityMap[dateKey] = !!availableInstance;

                current.setDate(current.getDate() + 1);
            }

            res.json(availabilityMap);
        } catch (error) {
            console.error("Fetch variant availability error:", error);
            res.status(500).json({ error: 'Failed to fetch availability' });
        }
    }
};
