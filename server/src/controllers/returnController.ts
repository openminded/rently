import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const returnController = {
    // Get Active Rentals (Transactions that are BOOKED or PICKED_UP)
    // This answers "Where is the list of transactions?"
    getActiveRentals: async (req: Request, res: Response) => {
        console.log("Hit getActiveRentals endpoint");
        try {
            const rentals = await prisma.transaction.findMany({
                where: {
                    status: {
                        in: ['BOOKED', 'PICKED_UP', 'RETURNED'] // Include RETURNED for history/audit before completion? Or just active.
                        // Let's stick to active for the "Returns" workspace, maybe a toggle for history later.
                    }
                },
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
                    fines: {
                        include: { violationType: true }
                    }
                },
                orderBy: { pickupDate: 'asc' }
            });
            res.json(rentals);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch rentals' });
        }
    },

    // Get specific transaction details for return
    getRentalById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const rental = await prisma.transaction.findUnique({
                where: { id: Number(id) },
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
                    fines: {
                        include: { violationType: true }
                    },
                    payments: {
                        include: { paymentMethod: true }
                    }
                }
            });
            if (!rental) return res.status(404).json({ error: 'Rental not found' });
            res.json(rental);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch rental' });
        }
    },

    // Process Return
    processReturn: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { returnDate, fines, itemsStatus, payment } = req.body;
            // itemsStatus: { [sku]: 'AVAILABLE' | 'IN_LAUNDRY' | 'DAMAGED' }

            const result = await prisma.$transaction(async (tx) => {
                // 1. Update Transaction
                const transaction = await tx.transaction.update({
                    where: { id: Number(id) },
                    data: {
                        actualReturnDate: new Date(returnDate),
                        status: 'COMPLETED', // Or RETURNED if payment pending? Let's assume COMPLETED if paid.
                        // For simplicity in this iteration, marking as COMPLETED or RETURNED.
                        // If there are fines unpaid, maybe RETURNED.
                        // Let's calculate total due.
                    }
                });

                // 2. Add Fines
                if (fines && fines.length > 0) {
                    await tx.fine.createMany({
                        data: fines.map((f: any) => ({
                            transactionId: Number(id),
                            violationTypeId: f.violationTypeId,
                            amount: f.amount,
                            note: f.note
                        }))
                    });
                }

                // 3. Update Item Instances (Stock)
                if (itemsStatus) {
                    for (const [sku, status] of Object.entries(itemsStatus)) {
                        // If IN_LAUNDRY, create log? For now just update status.
                        await tx.itemInstance.update({
                            where: { sku },
                            data: {
                                status: status as any
                            }
                        });
                    }
                }

                // 4. Process Payment (if any)
                if (payment && payment.amount > 0) {
                    await tx.payment.create({
                        data: {
                            transactionId: Number(id),
                            amount: payment.amount,
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Fine/Late Payment'
                        }
                    });

                    // Update transaction paid amount
                    await tx.transaction.update({
                        where: { id: Number(id) },
                        data: {
                            paidAmount: { increment: payment.amount },
                            paymentStatus: 'PAID' // Simplified logic
                        }
                    });
                }

                return transaction;
            });

            res.json(result);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message || 'Failed to process return' });
        }
    }
};
