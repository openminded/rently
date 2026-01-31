import type { Request, Response } from 'express';
import prisma from '../prisma.js';

export const transactionController = {
    // Create a new rental transaction
    createConfig: async (req: Request, res: Response) => {
        // Updated logic for Booking vs Immediate
        try {
            const { type, customerId, pickupDate, returnPlanDate, items, payment, adminFee = 0, taxRate = 0, taxAmount = 0 } = req.body;

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
                // Total to Pay = Rental Price + Deposit (if any)
                const depositVal = req.body.depositAmount ? parseFloat(req.body.depositAmount) : 0;
                // If deposit is included in "payment" logic, we need to know if the "Total Bill" includes deposit or not.
                // Usually Deposit is separate. 
                // Let's assume Total Amount = Rental + Deposit.
                // But generally Deposit is refundable, not "Revenue".
                // Allow TotalAmount to be just Rental. Deposit is stored in depositAmount.
                // But user has to PAY (Rental + Deposit).
                // Frontend POS usually sums them up.
                // So checking `paid >= totalAmount` might be tricky if `totalAmount` doesn't include deposit.

                // DECISION: `totalAmount` should ONLY be the Rental/Item Costs (Revenue).
                // `depositAmount` is separate.
                // BUT `paidAmount` comes from user paying the SUM.
                // So `paid >= totalAmount + depositAmount` is the check for "PAID".

                const totalObligation = totalAmount + depositVal + parseFloat(adminFee as string || '0') + parseFloat(taxAmount as string || '0');

                const paid = payment ? parseFloat(payment.amount) : 0;
                let payStatus = 'UNPAID';
                if (paid >= totalObligation) payStatus = 'PAID';
                else if (paid > 0) payStatus = 'PARTIAL';

                // Transaction Status Logic
                const txStatus = type === 'IMMEDIATE' ? 'RENTED' : 'BOOKED';

                // Create Header
                const transaction = await tx.transaction.create({
                    data: {
                        type: type || 'BOOKING',
                        customerId,
                        userId: req.user?.id, // Track who created the booking
                        pickupDate: new Date(pickupDate),
                        returnPlanDate: new Date(returnPlanDate),
                        status: txStatus as any, // Cast to any to avoid Enum TS issues with provisional types
                        totalAmount: totalAmount,
                        depositAmount: depositVal,
                        depositStatus: depositVal > 0 ? 'HELD' : null,
                        paidAmount: paid,
                        adminFee: parseFloat(adminFee as string || '0'),
                        taxRate: parseFloat(taxRate as string || '0'),
                        taxAmount: parseFloat(taxAmount as string || '0'),
                        paymentStatus: payStatus as any,
                        items: {
                            create: transactionItemsData
                        },
                        payments: payment ? {
                            create: {
                                amount: paid,
                                paymentMethodId: payment.methodId,
                                note: payment.note,
                                createdById: req.user?.id // Track payment receiver
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
                where: { id: parseInt((id as string) || '0') }
            });

            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            if (transaction.status !== 'BOOKED') return res.status(400).json({ error: 'Transaction Status must be BOOKED to add payment here.' });

            await prisma.$transaction(async (tx) => {
                await tx.payment.create({
                    data: {
                        transactionId: transaction.id,
                        amount: parseFloat(payment.amount),
                        paymentMethodId: payment.methodId,
                        note: payment.note || 'Manual Payment',
                        createdById: req.user?.id // Track who took the payment
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
                where: { id: parseInt((id as string) || '0') },
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
                        pickupDate: new Date(), // Actual pickup time
                        pickedUpById: req.user?.id // Track who processed the pickup
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
            const { returnDate, fines, damageNotes, itemsStatus } = req.body;

            console.log('Processing return for transaction:', id);
            console.log('Request body:', { returnDate, fines, itemsStatus });

            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id) },
                include: { items: true }
            });

            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            if (transaction.status !== 'RENTED') return res.status(400).json({ error: 'Transaction is not RENTED' });

            // Collect SKUs for laundry log creation (outside transaction)
            const laundrySkus: string[] = [];

            await prisma.$transaction(async (tx) => {
                // 1. Record Fines if any
                let totalFineAmount = 0;
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
                        totalFineAmount += fine.amount;
                    }
                }

                // 2. Process Payment if any (for Fines or Late Fees)
                const { payment } = req.body;
                let addedPayment = 0;
                if (payment && payment.amount > 0) {
                    await tx.payment.create({
                        data: {
                            transactionId: transaction.id,
                            amount: parseFloat(payment.amount),
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Fine Payment'
                        }
                    });
                    addedPayment = parseFloat(payment.amount);
                }

                // 3. Update Transaction (Status, Dates, Amounts)
                // Deposit Logic:
                const depositAmount = transaction.depositAmount || 0;
                let usedDeposit = 0;
                let newDepositStatus = transaction.depositStatus;

                if (depositAmount > 0 && totalFineAmount > 0) {
                    usedDeposit = Math.min(depositAmount, totalFineAmount);
                    // Determine Status
                    if (usedDeposit === depositAmount) newDepositStatus = 'DEDUCTED'; // Fully used
                    else newDepositStatus = 'PARTIAL'; // Partially used, some should be refunded

                    // IF fines covered fully by deposit, we consider that fine AMOUNT as paid?
                    // We increment paidAmount by the usedDeposit effectively transferring it from "Held" to "Paid".
                } else if (depositAmount > 0 && totalFineAmount === 0) {
                    newDepositStatus = 'REFUNDED'; // Mark as refunded ideally, or 'TO_REFUND'
                    // For now, let's assume if no fines, it is REFUNDED logic handled in frontend or cash drawer.
                    // We mark it REFUNDED here to close the loop.
                }

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'RETURNED',
                        actualReturnDate: new Date(returnDate || new Date()),
                        totalAmount: { increment: totalFineAmount }, // Add fines to total obligation
                        paidAmount: { increment: addedPayment + usedDeposit }, // Add payment + used deposit
                        depositStatus: newDepositStatus
                    }
                });

                // 4. Move Items to Laundry Queue (Update status only, log created later)
                for (const item of transaction.items) {
                    // Update Instance to IN_LAUNDRY
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'IN_LAUNDRY' }
                    });
                    laundrySkus.push(item.itemInstanceSku);
                    console.log(`Item ${item.itemInstanceSku} status updated to IN_LAUNDRY`);
                }
            });

            // 5. Create Laundry Logs AFTER transaction success (non-blocking)
            console.log('LaundrySkus to create logs for:', laundrySkus);
            if (laundrySkus.length > 0) {
                for (const sku of laundrySkus) {
                    try {
                        console.log(`Attempting to create LaundryLog for SKU: ${sku}`);
                        const logResult = await prisma.laundryLog.create({
                            data: {
                                itemInstanceSku: sku,
                                status: 'WAITING'
                            }
                        });
                        console.log(`LaundryLog created successfully:`, logResult);
                    } catch (laundryError: any) {
                        console.error(`FAILED to create LaundryLog for ${sku}:`);
                        console.error('Error name:', laundryError.name);
                        console.error('Error message:', laundryError.message);
                        console.error('Error code:', laundryError.code);
                        console.error('Full error:', laundryError);
                        // Continue to next SKU instead of failing entirely
                    }
                }
            } else {
                console.log('No laundrySkus to process - transaction.items might be empty');
            }

            console.log('Return processed successfully');
            res.json({ success: true, message: 'Return processed successfully' });

        } catch (error) {
            console.error('Return error:', error);
            res.status(500).json({ error: 'Return failed' });
        }
    },

    getById: async (req: Request, res: Response) => {
        console.log(`[DEBUG] getById called with ID: ${req.params.id}`);
        try {
            const { id } = req.params;
            const tx = await prisma.transaction.findUnique({
                where: { id: parseInt((id as string) || '0') },
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
                    },
                    user: { select: { name: true, username: true } },
                    pickedUpBy: { select: { name: true, username: true } },
                    returnedBy: { select: { name: true, username: true } }
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
    },

    markInvalid: async (req: Request, res: Response) => {
        const { id } = req.params;
        const { note } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                const transaction = await tx.transaction.findUnique({
                    where: { id: parseInt((id as string) || '0') },
                    include: { items: true }
                });

                if (!transaction) throw new Error("Transaction not found");

                // Update Transaction
                await tx.transaction.update({
                    where: { id: parseInt((id as string) || '0') },
                    data: {
                        status: 'CANCELLED', // @ts-ignore
                        note: note ? `Invalid: ${note}` : 'Marked as Invalid'
                    }
                });

                // Return Items to Available
                for (const item of transaction.items) {
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'AVAILABLE' }
                    });
                }
            });

            res.json({ message: "Transaction marked as Invalid" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to invalidate transaction" });
        }
    }
};
