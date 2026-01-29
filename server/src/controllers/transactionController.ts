import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const transactionController = {
    // Create a new rental transaction
    createConfig: async (req: Request, res: Response) => {
        // Updated logic for Booking vs Immediate
        try {
            const { type, customerId, pickupDate, returnPlanDate, items, payment } = req.body;

            // 1. Gather all instance SKUs to be rented/reserved
            const assignedSkus: string[] = [];

            // Process Quantity-based requests (Auto-assign)
            // Note: For Booking, we still reserve specific instances to ensure stock availability. 
            // In a more complex system, we might just reserve "count", but for now, we lock instances.
            const quantityRequests = items.filter((i: any) => i.variantId && i.quantity > 0);

            for (const req of quantityRequests) {
                // Find N available instances
                const availableInstances = await prisma.itemInstance.findMany({
                    where: {
                        itemVariantId: req.variantId,
                        status: 'AVAILABLE'
                    },
                    take: req.quantity
                });

                if (availableInstances.length < req.quantity) {
                    res.status(400).json({ error: `Not enough stock for variant ${req.variantId}` });
                    return;
                }

                assignedSkus.push(...availableInstances.map(i => i.sku));
            }

            // 2. Wrap in transaction
            const result = await prisma.$transaction(async (tx) => {
                let totalAmount = 0;
                const transactionItemsData = [];

                for (const sku of assignedSkus) {
                    const instance = await tx.itemInstance.findUnique({
                        where: { sku },
                        include: { itemVariant: { include: { item: true } } }
                    });

                    if (!instance) throw new Error(`Instance ${sku} not found`);

                    // Allow RENTED if it's a re-rental check?? No, for new transaction must be AVAILABLE
                    if (instance.status !== 'AVAILABLE') throw new Error(`Instance ${sku} is ${instance.status}`);

                    const price = instance.itemVariant.item.rentalPrice;
                    totalAmount += price;

                    // Update Status
                    // Even if BOOKING, we mark as RENTED (or similar) to reserve it from being taken by others.
                    // Ideally we should have a 'BOOKED' status on ItemInstance, but 'RENTED' works to block it for now.
                    await tx.itemInstance.update({
                        where: { sku },
                        data: { status: 'RENTED' }
                    });

                    transactionItemsData.push({
                        itemInstanceSku: sku,
                        priceAtRental: price
                    });
                }

                // Payment Status Logic
                const paid = payment ? parseFloat(payment.amount) : 0;
                let payStatus = 'UNPAID';
                if (paid >= totalAmount) payStatus = 'PAID';
                else if (paid > 0) payStatus = 'PARTIAL';

                // Transaction Status Logic
                // If IMMEDIATE -> RENTED (Active)
                // If BOOKING -> BOOKED (Pending Pickup)
                const txStatus = type === 'IMMEDIATE' ? 'RENTED' : 'BOOKED';

                // Create Header
                const transaction = await tx.transaction.create({
                    data: {
                        type: type || 'BOOKING',
                        customerId,
                        pickupDate: new Date(pickupDate),
                        returnPlanDate: new Date(returnPlanDate),
                        status: txStatus as any, // Cast to any to avoid Enum TS issues with provisional types
                        totalAmount: totalAmount,
                        paidAmount: paid,
                        paymentStatus: payStatus as any,
                        items: {
                            create: transactionItemsData
                        },
                        payments: payment ? {
                            create: {
                                amount: paid,
                                paymentMethodId: payment.methodId,
                                note: payment.note
                            }
                        } : undefined
                    },
                    include: {
                        items: true,
                        payments: true
                    }
                });

                return transaction;
            });

            res.status(201).json(result);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message || 'Transaction failed' });
        }
    },

    getAll: async (req: Request, res: Response) => {
        try {
            const txs = await prisma.transaction.findMany({
                include: { customer: true, items: { include: { itemInstance: { include: { itemVariant: { include: { item: true, color: true, size: true } } } } } }, payments: { include: { paymentMethod: true } } },
                orderBy: { createdAt: 'desc' }
            });
            res.json(txs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    },

    // Add Payment (Booking -> Waiting Pickup OR just adding payment)
    addPayment: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { payment } = req.body;

            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id) }
            });

            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            if (transaction.status !== 'BOOKED') return res.status(400).json({ error: 'Transaction Status must be BOOKED to add payment here.' });

            await prisma.$transaction(async (tx) => {
                await tx.payment.create({
                    data: {
                        transactionId: transaction.id,
                        amount: parseFloat(payment.amount),
                        paymentMethodId: payment.methodId,
                        note: payment.note || 'Manual Payment'
                    }
                });

                const newPaidAmount = transaction.paidAmount + parseFloat(payment.amount);
                let newPaymentStatus = 'PARTIAL';
                if (newPaidAmount >= transaction.totalAmount) newPaymentStatus = 'PAID';

                // If paid something (even Partial), we consider it "Confirmed" -> WAITING_PICKUP?
                // Or user logic "unpaid tidak bisa di mark waitin pickup" implies if we pay, it CAN be marked.
                // Let's set status to BOOKED still? OR WAITING_PICKUP?
                // User said: "jika sudah lunas dia akan otomatis ada di waiting pickup". 
                // Implicitly, Paying DP *confirms* it. I will keep it as BOOKED but filter logic will move it.
                // Wait, if I keep it BOOKED, I need to adjust filter.
                // Let's keep status BOOKED. Filter will handle appearance.

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paidAmount: newPaidAmount,
                        paymentStatus: newPaymentStatus as any
                    }
                });
            });

            res.json({ message: 'Payment added' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add payment' });
        }
    },

    // Pickup Transaction (Booking -> Rented)
    pickup: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { payment } = req.body; // Optional additional payment

            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id) },
                include: { payments: true, items: { include: { itemInstance: true } } }
            });

            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            if (transaction.status !== 'BOOKED') return res.status(400).json({ error: 'Transaction is not in BOOKED state' });

            // Calculate current paid
            let currentPaid = transaction.paidAmount;
            if (payment) {
                currentPaid += parseFloat(payment.amount);
            }

            // Validate Full Payment
            if (currentPaid < transaction.totalAmount) {
                return res.status(400).json({
                    error: 'Full payment required for pickup',
                    required: transaction.totalAmount,
                    current: currentPaid
                });
            }

            await prisma.$transaction(async (tx) => {
                // 1. Record Payment if any
                if (payment) {
                    await tx.payment.create({
                        data: {
                            transactionId: transaction.id,
                            amount: parseFloat(payment.amount),
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Pickup Payment'
                        }
                    });
                }

                // 2. Update Transaction
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'RENTED',
                        paidAmount: currentPaid,
                        paymentStatus: 'PAID',
                        pickupDate: new Date() // Actual pickup time
                    }
                });

                // 3. Update Items to RENTED (if not already, though booking should create reserved instances)
                for (const item of transaction.items) {
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'RENTED' }
                    });
                }
            });

            res.json({ message: 'Pickup successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Pickup failed' });
        }
    },

    // Return Items (Rented -> Returned/Laundry)
    returnItems: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { returnDate, fines, damageNotes } = req.body;

            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id) },
                include: { items: true }
            });

            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            if (transaction.status !== 'RENTED') return res.status(400).json({ error: 'Transaction is not RENTED' });

            await prisma.$transaction(async (tx) => {
                // 1. Record Fines if any
                if (fines && fines.length > 0) {
                    for (const fine of fines) {
                        await tx.fine.create({
                            data: {
                                transactionId: transaction.id,
                                violationTypeId: fine.violationTypeId,
                                amount: fine.amount,
                                note: fine.note
                            }
                        });
                    }
                }

                // 2. Update Transaction
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'RETURNED', // Or COMPLETED if fully paid including fines? Let's say RETURNED for now.
                        actualReturnDate: new Date(returnDate || new Date())
                    }
                });

                // 3. Move Items to Laundry Queue (Default flow)
                for (const item of transaction.items) {
                    // Update Instance
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'IN_LAUNDRY' }
                    });

                    // Create Laundry Log
                    await tx.laundryLog.create({
                        data: {
                            itemInstanceSku: item.itemInstanceSku,
                            status: 'IN_LAUNDRY'
                        }
                    });
                }
            });

            res.json({ message: 'Return processed successfully' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Return failed' });
        }
    },

    getById: async (req: Request, res: Response) => {
        console.log(`[DEBUG] getById called with ID: ${req.params.id}`);
        try {
            const { id } = req.params;
            const tx = await prisma.transaction.findUnique({
                where: { id: parseInt(id) },
                include: {
                    customer: true,
                    items: {
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
                    },
                    payments: {
                        include: {
                            paymentMethod: true
                        }
                    }
                }
            });

            if (!tx) {
                res.status(404).json({ error: 'Transaction not found' });
                return;
            }

            res.json(tx);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transaction' });
        }
    }
};
