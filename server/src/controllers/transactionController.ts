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

            // Fetch Settings (Laundry & SaaS)
            const settings = await prisma.appSetting.findMany({
                where: { key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS', 'SAAS_FEE_TYPE', 'SAAS_FEE_AMOUNT', 'SAAS_FEE_CHARGED_TO'] } }
            });
            const enableLaundryRule = settings.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(settings.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');

            // SaaS Settings
            const saasFeeType = settings.find(s => s.key === 'SAAS_FEE_TYPE')?.value || 'PER_ITEM';
            const saasFeeAmount = parseFloat(settings.find(s => s.key === 'SAAS_FEE_AMOUNT')?.value || '0');
            const saasChargedTo = settings.find(s => s.key === 'SAAS_FEE_CHARGED_TO')?.value || 'NONE';

            // Normalize Requested Dates
            const reqStart = new Date(pickupDate);
            const reqEnd = new Date(returnPlanDate);
            reqStart.setHours(0, 0, 0, 0);
            reqEnd.setHours(0, 0, 0, 0);
            const reqBuffer = enableLaundryRule ? laundryDays : 0;

            for (const reqItem of quantityRequests) {
                // Find N available instances
                const availableInstances = await prisma.itemInstance.findMany({
                    where: {
                        itemVariantId: reqItem.variantId,
                        status: { in: ['AVAILABLE', 'RENTED', 'IN_LAUNDRY'] } // Allow all valid physical states
                    },
                    include: {
                        transactionItems: {
                            where: { transaction: { status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] } } },
                            include: { transaction: true }
                        }
                    }
                });

                // Filter valid instances
                const validInstances = availableInstances.filter(instance => {
                    const hasConflict = instance.transactionItems.some(ti => {
                        const tx = ti.transaction;
                        const txStart = new Date(tx.pickupDate);
                        const txEnd = new Date(tx.returnPlanDate);
                        txStart.setHours(0, 0, 0, 0);
                        txEnd.setHours(0, 0, 0, 0);

                        // Check 1: New Req overlaps Existing [Start, End + Buffer]
                        const txEffectiveEnd = new Date(txEnd);
                        txEffectiveEnd.setDate(txEffectiveEnd.getDate() + reqBuffer);
                        const overlap1 = (reqStart <= txEffectiveEnd) && (reqEnd >= txStart);

                        // Check 2: Existing overlaps New Req [Start, End + Buffer]
                        const reqEffectiveEnd = new Date(reqEnd);
                        reqEffectiveEnd.setDate(reqEffectiveEnd.getDate() + reqBuffer);
                        const overlap2 = (txStart <= reqEffectiveEnd) && (txEnd >= reqStart);

                        return overlap1 || overlap2;
                    });
                    return !hasConflict;
                });

                if (validInstances.length < reqItem.quantity) {
                    res.status(400).json({ error: `Not enough availability for variant ${reqItem.variantId} on selected dates.` });
                    return;
                }

                assignedSkus.push(...validInstances.slice(0, reqItem.quantity).map(i => i.sku));
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

                    const price = instance.itemVariant.item.rentalPrice;
                    totalAmount += price;

                    if (type === 'IMMEDIATE') {
                        await tx.itemInstance.update({
                            where: { sku },
                            data: { status: 'RENTED' }
                        });
                    }

                    transactionItemsData.push({
                        itemInstanceSku: sku,
                        priceAtRental: price
                    });
                }

                // --- SaaS Fee Calculation ---
                let calculatedSaasFee = 0;
                let feeDetails = '';

                if (saasChargedTo !== 'NONE') {
                    if (saasFeeType === 'PER_ITEM') {
                        calculatedSaasFee = saasFeeAmount * transactionItemsData.length;
                        feeDetails = `Rp ${saasFeeAmount.toLocaleString()} x ${transactionItemsData.length} Items`;
                    } else if (saasFeeType === 'PER_TRANSACTION') {
                        calculatedSaasFee = saasFeeAmount;
                        feeDetails = `Fixed Per Transaction`;
                    } else if (saasFeeType === 'PERCENTAGE') {
                        calculatedSaasFee = (saasFeeAmount / 100) * totalAmount;
                        feeDetails = `${saasFeeAmount}% of Rp ${totalAmount.toLocaleString()}`;
                    }
                }

                // If Charged to CUSTOMER, add to adminFee
                const finalAdminFee = (adminFee || 0) + (saasChargedTo === 'CUSTOMER' ? calculatedSaasFee : 0);

                const newTransaction = await tx.transaction.create({
                    data: {
                        type,
                        customer: { connect: { id: customerId } },
                        ...(req.user?.id ? { user: { connect: { id: req.user.id } } } : {}),
                        pickupDate: new Date(pickupDate),
                        returnPlanDate: new Date(returnPlanDate),
                        status: type === 'IMMEDIATE' ? 'RENTED' : 'BOOKED',
                        totalAmount: totalAmount + finalAdminFee + taxAmount, // Total includes SaaS fee if customer pays
                        adminFee: finalAdminFee,
                        taxRate,
                        taxAmount,
                        items: {
                            create: transactionItemsData
                        },
                    }
                });

                // --- Log SaaS Fee ---
                if (saasChargedTo !== 'NONE' && calculatedSaasFee > 0) {
                    await tx.saaSFeeLog.create({
                        data: {
                            transactionId: newTransaction.id,
                            amount: calculatedSaasFee,
                            chargedTo: saasChargedTo,
                            calculationDetails: feeDetails
                        }
                    });
                }

                // Payment Handling
                if (payment) {
                    await tx.payment.create({
                        data: {
                            transactionId: newTransaction.id,
                            amount: payment.amount,
                            paymentMethodId: payment.methodId,
                            createdById: req.user?.id ?? null
                        }
                    });

                    // Update Paid Amount
                    await tx.transaction.update({
                        where: { id: newTransaction.id },
                        data: {
                            paidAmount: payment.amount,
                            paymentStatus: payment.amount >= (totalAmount + finalAdminFee + taxAmount) ? 'PAID' : 'PARTIAL' // Update logic as needed
                        }
                    });
                }

                return newTransaction;
            });

            res.json(result);

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
                        createdById: req.user?.id ?? null // Track who took the payment
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
                        pickedUpById: req.user?.id ?? null // Track who processed the pickup
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
                where: { id: parseInt((id as string) ?? '0') },
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
    },

    // Find Active Transaction by Item SKU (for Barcode Return)
    getByItemSku: async (req: Request, res: Response) => {
        try {
            const { sku } = req.params;
            if (!sku) return res.status(400).json({ error: 'SKU is required' });

            // Find transaction that has this item and is currently active (RENTED or BOOKED)
            // Ideally RENTED for returns.
            // If checking for "Waiting Pickup", check BOOKED.
            // Let's return the most relevant one.

            const transaction = await prisma.transaction.findFirst({
                where: {
                    items: {
                        some: {
                            itemInstanceSku: String(sku)
                        }
                    },
                    status: {
                        in: ['RENTED', 'BOOKED']
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
                    payments: { include: { paymentMethod: true } },
                    fines: { include: { violationType: true } }
                }
            });

            if (!transaction) {
                return res.status(404).json({ error: 'No active transaction found for this item' });
            }

            res.json(transaction);
        } catch (error) {
            console.error("getByItemSku error:", error);
            res.status(500).json({ error: 'Failed to find transaction' });
        }
    },

    // Check Availability for POS Feedback
    checkAvailability: async (req: Request, res: Response) => {
        try {
            const { items, pickupDate, returnPlanDate } = req.body;
            // items: [{ variantId, quantity }]

            // Fetch Settings
            const settings = await prisma.appSetting.findMany({
                where: { key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS'] } }
            });
            const enableLaundryRule = settings.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(settings.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');

            // Normalize Requested Dates
            const reqStart = new Date(pickupDate);
            const reqEnd = new Date(returnPlanDate);
            reqStart.setHours(0, 0, 0, 0);
            reqEnd.setHours(0, 0, 0, 0);
            const reqBuffer = enableLaundryRule ? laundryDays : 0;

            const results = [];

            for (const item of items) {
                // Find potential instances
                const availableInstances = await prisma.itemInstance.findMany({
                    where: {
                        itemVariantId: item.variantId,
                        status: { in: ['AVAILABLE', 'RENTED', 'IN_LAUNDRY'] }
                    },
                    include: {
                        transactionItems: {
                            where: { transaction: { status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] } } },
                            include: { transaction: true }
                        }
                    }
                });

                // Filter valid
                const validInstances = availableInstances.filter(instance => {
                    const hasConflict = instance.transactionItems.some(ti => {
                        const tx = ti.transaction;
                        const txStart = new Date(tx.pickupDate);
                        const txEnd = new Date(tx.returnPlanDate);
                        txStart.setHours(0, 0, 0, 0);
                        txEnd.setHours(0, 0, 0, 0);

                        // Check 1: New Req overlaps Existing [Start, End + Buffer]
                        const txEffectiveEnd = new Date(txEnd);
                        txEffectiveEnd.setDate(txEffectiveEnd.getDate() + reqBuffer);
                        const overlap1 = (reqStart <= txEffectiveEnd) && (reqEnd >= txStart);

                        // Check 2: Existing overlaps New Req [Start, End + Buffer]
                        const reqEffectiveEnd = new Date(reqEnd);
                        reqEffectiveEnd.setDate(reqEffectiveEnd.getDate() + reqBuffer);
                        const overlap2 = (txStart <= reqEffectiveEnd) && (txEnd >= reqStart);

                        return overlap1 || overlap2;
                    });
                    return !hasConflict;
                });

                results.push({
                    variantId: item.variantId,
                    available: validInstances.length >= item.quantity,
                    availableCount: validInstances.length,
                    requestedParams: { reqStart, reqEnd, reqBuffer } // Debug info
                });
            }

            res.json({ results });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message || 'Check failed' });
        }
    },

    // Get Variant Schedule for POS
    getVariantSchedule: async (req: Request, res: Response) => {
        try {
            const { variantId } = req.params;
            if (!variantId) return res.status(400).json({ error: 'Variant ID is required' });

            // Fetch Settings for Laundry Rule
            const settings = await prisma.appSetting.findMany({
                where: { key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS'] } }
            });
            const enableLaundryRule = settings.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(settings.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');
            const buffer = enableLaundryRule ? laundryDays : 0;

            // 1. Get all instances for this variant
            const instances = await prisma.itemInstance.findMany({
                where: { itemVariantId: parseInt(variantId as string) },
                select: { sku: true }
            });
            const skus = instances.map(i => i.sku);

            if (skus.length === 0) {
                return res.json([]);
            }

            // 2. Find all active transactions for these SKUs
            // We look for transactions that are BOOKED, WAITING_PICKUP, or RENTED
            const transactions = await prisma.transaction.findMany({
                where: {
                    status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] },
                    items: {
                        some: {
                            itemInstanceSku: { in: skus }
                        }
                    }
                },
                include: {
                    customer: { select: { name: true } },
                    items: {
                        where: { itemInstanceSku: { in: skus } },
                        select: { itemInstanceSku: true }
                    }
                },
                orderBy: { pickupDate: 'asc' }
            });

            // 3. Map to simple schedule events
            const schedule = transactions.map(tx => {
                const start = new Date(tx.pickupDate);
                const end = new Date(tx.returnPlanDate);

                // Add buffer to end date for "Busy" visualization
                const busyUntil = new Date(end);
                busyUntil.setDate(busyUntil.getDate() + buffer);

                // Which instance is this for? (Just grabbing the first match if multiple same variant in one tx?? Rare but possible)
                const sku = tx.items[0]?.itemInstanceSku || 'Unknown';

                return {
                    id: tx.id,
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0],
                    busyUntil: busyUntil.toISOString().split('T')[0],
                    customer: tx.customer.name,
                    status: tx.status,
                    sku: sku
                };
            });

            res.json(schedule);

        } catch (error: any) {
            console.error("Get Schedule Error", error);
            res.status(500).json({ error: error.message });
        }
    }
};

