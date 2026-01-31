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
                    },
                    returnedBy: { select: { name: true, username: true } }, // Include user who returned
                    user: { select: { name: true, username: true } } // Include user who booked
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

            console.log('Processing return for transaction:', id);
            console.log('Return data:', { returnDate, fines, itemsStatus, payment });

            // 0. Validation: Enforce Full Payment
            const existingTx = await prisma.transaction.findUnique({ where: { id: Number(id) } });
            if (!existingTx) return res.status(404).json({ error: 'Transaction not found' });

            const remainingDebt = existingTx.totalAmount - existingTx.paidAmount;
            const totalFines = (fines || []).reduce((sum: number, f: any) => sum + f.amount, 0);
            const totalRequired = remainingDebt + totalFines;

            if (totalRequired > 0) {
                const payAmount = payment?.amount || 0;
                // Allow small tolerance for floating point? No, standard strict check.
                if (payAmount < totalRequired) {
                    return res.status(400).json({
                        error: `Return requires full payment. Required: ${totalRequired}, Provided: ${payAmount}`
                    });
                }
            }

            const result = await prisma.$transaction(async (tx) => {
                // 1. Update Transaction
                const transaction = await tx.transaction.update({
                    where: { id: Number(id) },
                    data: {
                        actualReturnDate: new Date(returnDate),
                        status: 'RETURNED' as any, // Changed from COMPLETED to RETURNED
                        returnedById: req.user?.id // Track who processed the return
                    }
                });

                console.log('Transaction updated:', transaction.id);

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
                    console.log('Fines added:', fines.length);
                }

                // 3. Update Item Instances (Stock)
                const laundrySkus: string[] = []; // Collect SKUs for laundry processing after transaction
                if (itemsStatus) {
                    for (const [sku, status] of Object.entries(itemsStatus)) {
                        await tx.itemInstance.update({
                            where: { sku },
                            data: {
                                status: status as any
                            }
                        });

                        console.log(`Item ${sku} status updated to ${status}`);

                        // Collect SKUs that need laundry log
                        if (status === 'IN_LAUNDRY') {
                            laundrySkus.push(sku);
                        }
                    }
                }

                // 4. Process Payment (if any)
                if (payment && payment.amount > 0) {
                    await tx.payment.create({
                        data: {
                            transactionId: Number(id),
                            amount: payment.amount,
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Fine/Late Payment',
                            createdById: req.user?.id // Track who took the payment
                        }
                    });

                    // Update transaction paid amount
                    await tx.transaction.update({
                        where: { id: Number(id) },
                        data: {
                            paidAmount: { increment: payment.amount },
                            paymentStatus: 'PAID' as any // Simplified logic
                        }
                    });
                    console.log('Payment processed:', payment.amount);
                }

                return { transaction, laundrySkus };
            });

            // Create laundry logs AFTER successful transaction (non-blocking)
            if (result.laundrySkus && result.laundrySkus.length > 0) {
                try {
                    for (const sku of result.laundrySkus) {
                        await prisma.laundryLog.create({
                            data: {
                                itemInstanceSku: sku,
                                status: 'WAITING'
                            }
                        });
                        console.log(`Laundry log created for ${sku}`);
                    }
                } catch (laundryError) {
                    console.warn('Warning: Could not create laundry logs:', laundryError);
                    // Don't fail the return - laundry log is optional
                }
            }

            // Fetch complete transaction data with relations for response
            const completeTransaction = await prisma.transaction.findUnique({
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
                    payments: {
                        include: {
                            paymentMethod: true
                        }
                    },
                    fines: {
                        include: {
                            violationType: true
                        }
                    }
                }
            });

            console.log('Return processed successfully');
            res.json({
                success: true,
                message: 'Return processed successfully',
                transaction: completeTransaction
            });

        } catch (error: any) {
            console.error('Return processing error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ error: error.message || 'Failed to process return' });
        }
    }
};
