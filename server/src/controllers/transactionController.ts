import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import { duitkuService } from '../services/duitkuService.js';

export const transactionController = {
    // Online Booking from Landing Page
    publicBook: async (req: Request, res: Response) => {
        try {
            const { name, phone, email, pickupDate, returnPlanDate, items, referralCode } = req.body;

            // 1. Validation
            if (!name || !phone || !email || !pickupDate || !returnPlanDate || !items || items.length === 0) {
                return res.status(400).json({ error: 'Missing required fields (name, phone, email, etc.)' });
            }

            // 2. Customer Handling (Find or Create)
            let customer = await prisma.customer.findUnique({ where: { phone } });
            if (!customer) {
                customer = await prisma.customer.create({
                    data: { name, phone, email }
                });
            } else if (!customer.email) {
                // Update email if previously empty
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: { email }
                });
            }

            // 3. Logic to check and assign items (similar to createConfig but for online)
            const assignedSkus: string[] = [];
            const quantityRequests = items.filter((i: any) => i.variantId && i.quantity > 0);

            // Fetch Settings
            const setRes = await prisma.appSetting.findMany({
                where: { key: { in: ['ENABLE_MAX_LAUNDRY_DAY', 'MAX_LAUNDRY_DAYS'] } }
            });
            const enableLaundryRule = setRes.find(s => s.key === 'ENABLE_MAX_LAUNDRY_DAY')?.value === 'true';
            const laundryDays = parseInt(setRes.find(s => s.key === 'MAX_LAUNDRY_DAYS')?.value || '0');

            const reqStart = new Date(pickupDate);
            const reqEnd = new Date(returnPlanDate);
            reqStart.setHours(0, 0, 0, 0);
            reqEnd.setHours(0, 0, 0, 0);
            const reqBuffer = enableLaundryRule ? laundryDays : 0;

            for (const reqItem of quantityRequests) {
                const availableInstances = await prisma.itemInstance.findMany({
                    where: { itemVariantId: reqItem.variantId },
                    include: {
                        transactionItems: {
                            where: { transaction: { status: { in: ['BOOKED', 'WAITING_PICKUP', 'RENTED'] } } },
                            include: { transaction: true }
                        }
                    }
                });

                const validInstances = availableInstances.filter(instance => {
                    return !instance.transactionItems.some(ti => {
                        const tx = ti.transaction;
                        const txStart = new Date(tx.pickupDate);
                        const txEnd = new Date(tx.returnPlanDate);
                        txStart.setHours(0, 0, 0, 0);
                        txEnd.setHours(0, 0, 0, 0);
                        const txEffEnd = new Date(txEnd); txEffEnd.setDate(txEffEnd.getDate() + reqBuffer);
                        const overlap1 = (reqStart <= txEffEnd) && (reqEnd >= txStart);
                        const reqEffEnd = new Date(reqEnd); reqEffEnd.setDate(reqEffEnd.getDate() + reqBuffer);
                        const overlap2 = (txStart <= reqEffEnd) && (txEnd >= reqStart);
                        return overlap1 || overlap2;
                    });
                });

                if (validInstances.length < reqItem.quantity) {
                    return res.status(400).json({ error: `Not enough availability for one or more items.` });
                }
                assignedSkus.push(...validInstances.slice(0, reqItem.quantity).map(i => i.sku));
            }

            // 4. Create Transaction
            const result = await prisma.$transaction(async (tx) => {
                let totalAmount = 0;
                const txItems = [];

                // Referral Handling
                let referralId: number | undefined;
                let discountAmount = 0;
                let commissionRate = 0;

                if (referralCode && typeof referralCode === 'string') {
                    const ref = await tx.referralCode.findUnique({
                        where: { code: referralCode.toUpperCase(), isActive: true }
                    });
                    if (ref) {
                        referralId = ref.id;
                        commissionRate = ref.commissionRate;
                        // We calculate discount later after we have total base amount
                        discountAmount = ref.discountType === 'PERCENTAGE' ? -1 : ref.discountValue;
                        // -1 is flag for percentage
                    }
                }

                for (const sku of assignedSkus) {
                    const inst = await tx.itemInstance.findUnique({
                        where: { sku },
                        include: { itemVariant: { include: { item: true } } }
                    });
                    if (!inst) throw new Error(`SKU ${sku} not found`);
                    totalAmount += inst.itemVariant.item.rentalPrice;
                    txItems.push({ itemInstanceSku: sku, priceAtRental: inst.itemVariant.item.rentalPrice });
                }

                // Finalize Discount
                if (referralId) {
                    const ref = await tx.referralCode.findUnique({ where: { id: referralId } });
                    if (ref) {
                        const calculatedDiscount = ref.discountType === 'PERCENTAGE'
                            ? (ref.discountValue / 100) * totalAmount
                            : ref.discountValue;
                        totalAmount = Math.max(0, totalAmount - calculatedDiscount);
                    }
                }

                const transaction = await tx.transaction.create({
                    data: {
                        customerId: customer.id,
                        pickupDate: reqStart,
                        returnPlanDate: reqEnd,
                        totalAmount,
                        status: 'BOOKED',
                        paymentStatus: 'UNPAID',
                        source: 'ONLINE',
                        items: { create: txItems },
                        referralCodeId: referralId ?? null
                    }
                });

                // Record Commission (Pending)
                if (referralId) {
                    const commissionAmount = (commissionRate / 100) * totalAmount;
                    await tx.commissionLog.create({
                        data: {
                            referralCode: { connect: { id: referralId } },
                            transaction: { connect: { id: transaction.id } },
                            amount: commissionAmount,
                            status: 'PENDING'
                        }
                    });
                }

                return transaction;
            });

            // 5. Generate Duitku QRIS (Mandatory for Online)
            const duitkuResp = await (duitkuService as any).createQRIS(
                result.id.toString() + '-BOOKING',
                result.totalAmount,
                `Online Booking #${result.id} - ${customer.name}`,
                {
                    name: customer.name,
                    phone: customer.phone,
                    email: email
                }
            );

            res.json({
                success: true,
                transactionId: result.id,
                qrString: duitkuResp.qrString,
                paymentUrl: duitkuResp.paymentUrl,
                amount: result.totalAmount
            });

        } catch (error: any) {
            console.error('Online Booking Error:', error);
            res.status(500).json({ error: error.message || 'Failed to process online booking' });
        }
    },

    // Create a new rental transaction
    createConfig: async (req: Request, res: Response) => {
        // Updated logic for Booking vs Immediate
        try {
            const { type, customerId, pickupDate, returnPlanDate, items, payment, adminFee = 0, taxRate = 0, taxAmount = 0, referralCode } = req.body;

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

                // --- Referral Discount Calculation ---
                let referralId: number | undefined;
                let commissionRate = 0;
                if (referralCode && typeof referralCode === 'string') {
                    const ref = await tx.referralCode.findUnique({
                        where: { code: referralCode.toUpperCase(), isActive: true }
                    });
                    if (ref) {
                        referralId = ref.id;
                        commissionRate = ref.commissionRate;
                        const calculatedDiscount = ref.discountType === 'PERCENTAGE'
                            ? (ref.discountValue / 100) * totalAmount
                            : ref.discountValue;
                        totalAmount = Math.max(0, totalAmount - calculatedDiscount);
                    }
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
                        customerId,
                        userId: req.user?.id ?? null,
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
                        referralCodeId: referralId ?? null
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

                // --- Log Commission ---
                if (referralId && commissionRate > 0) {
                    const commissionAmount = (commissionRate / 100) * totalAmount;
                    await tx.commissionLog.create({
                        data: {
                            referralCode: { connect: { id: referralId } },
                            transaction: { connect: { id: newTransaction.id } },
                            amount: commissionAmount,
                            status: 'PENDING'
                        }
                    });
                }

                // Payment Handling
                if (payment) {
                    const paymentMethod = await tx.paymentMethod.findUnique({
                        where: { id: payment.methodId }
                    });

                    // If it is GATEWAY (Duitku), we generate Duitku Invoice but do NOT mark as paid yet.
                    if (paymentMethod?.type === 'GATEWAY') {
                        const customer = await tx.customer.findUnique({ where: { id: customerId } });
                        const productDetails = `Rental Transaction #${newTransaction.id}`;

                        try {
                            const duitkuResp = await duitkuService.createQRIS(
                                newTransaction.id.toString() + '-BOOKING',
                                payment.amount,
                                productDetails,
                                {
                                    name: customer?.name || 'Customer',
                                    email: 'customer@rently.com', // Default if not available
                                    phone: customer?.phone || ''
                                }
                            );

                            // We attach the payment URL to the response so frontend can show it
                            (newTransaction as any).paymentUrl = duitkuResp.paymentUrl;
                            (newTransaction as any).qrString = duitkuResp.qrString;
                        } catch (err: any) {
                            console.error('Duitku QRIS Generation Failed:', err);
                            // We still return the transaction but without payment info
                            (newTransaction as any).paymentError = 'Failed to generate QRIS';
                        }
                    } else {
                        // Regular Manual Payment (Cash/Transfer)
                        const activeShift = await tx.shift.findFirst({
                            where: { userId: (req as any).user?.id, status: 'OPEN' }
                        });

                        // Cap payment at total amount (Change logic)
                        const recordedPaymentAmount = Math.min(payment.amount, newTransaction.totalAmount);

                        await tx.payment.create({
                            data: {
                                transactionId: newTransaction.id,
                                amount: recordedPaymentAmount,
                                paymentMethodId: payment.methodId,
                                createdById: req.user?.id ?? null,
                                shiftId: activeShift?.id ?? null
                            }
                        });

                        // Update Paid Amount (use recorded amount)
                        await tx.transaction.update({
                            where: { id: newTransaction.id },
                            data: {
                                paidAmount: recordedPaymentAmount,
                                paymentStatus: recordedPaymentAmount >= newTransaction.totalAmount ? 'PAID' : 'PARTIAL'
                            }
                        });
                    }
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

            const result = await prisma.$transaction(async (tx) => {
                const paymentMethod = await tx.paymentMethod.findUnique({
                    where: { id: payment.methodId }
                });

                // If GATEWAY (Duitku)
                if (paymentMethod?.type === 'GATEWAY') {
                    const customer = await tx.customer.findUnique({ where: { id: transaction.customerId } });
                    const productDetails = `Payment for Transaction #${transaction.id}`;

                    try {
                        const amount = parseFloat(payment.amount);
                        const duitkuResp = await duitkuService.createQRIS(
                            transaction.id.toString() + '-PAY',
                            amount,
                            productDetails,
                            {
                                name: customer?.name || 'Customer',
                                email: 'customer@rently.com',
                                phone: customer?.phone || ''
                            }
                        );

                        return {
                            success: true,
                            paymentUrl: duitkuResp.paymentUrl,
                            qrString: duitkuResp.qrString,
                            transactionId: transaction.id
                        };
                    } catch (err) {
                        console.error('Duitku payment failed:', err);
                        throw new Error('Failed to generate Duitku QRIS');
                    }
                }

                // Regular manual payment
                const activeShift = await tx.shift.findFirst({
                    where: { userId: (req as any).user?.id, status: 'OPEN' }
                });

                // Cap payment amount to remaining balance
                const remaining = transaction.totalAmount - transaction.paidAmount;
                const inputAmount = parseFloat(payment.amount);
                const recordedAmount = Math.min(inputAmount, remaining);

                await tx.payment.create({
                    data: {
                        transactionId: transaction.id,
                        amount: recordedAmount,
                        paymentMethodId: payment.methodId,
                        note: payment.note || 'Manual Payment',
                        createdById: req.user?.id ?? null,
                        shiftId: activeShift?.id ?? null
                    }
                });

                const newPaidAmount = transaction.paidAmount + recordedAmount;
                let newPaymentStatus = 'PARTIAL';
                if (newPaidAmount >= transaction.totalAmount - 1) newPaymentStatus = 'PAID'; // tolerance

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paidAmount: newPaidAmount,
                        paymentStatus: newPaymentStatus as any
                    }
                });

                return { success: true, message: 'Payment added' };
            });

            res.json(result);
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

            const result = await prisma.$transaction(async (tx) => {
                // 1. Record Payment if any
                if (payment) {
                    const paymentMethod = await tx.paymentMethod.findUnique({
                        where: { id: payment.methodId }
                    });

                    // If it is GATEWAY (Duitku), we generate QRIS but don't finalize transaction yet
                    if (paymentMethod?.type === 'GATEWAY') {
                        const customer = await tx.customer.findUnique({ where: { id: transaction.customerId } });
                        const productDetails = `Pickup Payment for Transaction #${transaction.id}`;

                        try {
                            const amount = parseFloat(payment.amount);
                            const duitkuResp = await duitkuService.createQRIS(
                                transaction.id.toString() + '-PICKUP',
                                amount,
                                productDetails,
                                {
                                    name: customer?.name || 'Customer',
                                    email: 'customer@rently.com',
                                    phone: customer?.phone || ''
                                }
                            );

                            return {
                                success: true,
                                paymentUrl: duitkuResp.paymentUrl,
                                qrString: duitkuResp.qrString,
                                transactionId: transaction.id,
                                suffix: 'PICKUP'
                            };
                        } catch (err) {
                            console.error('Duitku pickup payment failed:', err);
                            throw new Error('Failed to generate Duitku QRIS for pickup');
                        }
                    }

                    // Regular manual payment
                    const activeShift = await tx.shift.findFirst({
                        where: { userId: (req as any).user?.id, status: 'OPEN' }
                    });

                    const remaining = transaction.totalAmount - transaction.paidAmount;
                    const inputAmount = parseFloat(payment.amount);
                    const recordedAmount = Math.min(inputAmount, remaining);

                    await tx.payment.create({
                        data: {
                            transactionId: transaction.id,
                            amount: recordedAmount,
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Pickup Payment',
                            createdById: req.user?.id ?? null,
                            shiftId: activeShift?.id ?? null
                        }
                    });

                    // Update local variable for next step
                    currentPaid += recordedAmount;
                }

                // 2. Update Transaction (Standard logic for manual payment or no payment)
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'RENTED',
                        paidAmount: currentPaid,
                        paymentStatus: 'PAID',
                        pickupDate: new Date(),
                        pickedUpById: req.user?.id ?? null
                    }
                });

                // 3. Update Instances
                for (const item of transaction.items) {
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'RENTED' }
                    });
                }

                return { success: true, message: 'Pickup successful' };
            });

            res.json(result);
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

            // 1. Check for Payment Method early if it is GATEWAY
            const { payment } = req.body;
            if (payment && payment.amount > 0) {
                const paymentMethod = await prisma.paymentMethod.findUnique({
                    where: { id: payment.methodId }
                });

                if (paymentMethod?.type === 'GATEWAY') {
                    console.log('[Return] Gateway payment detected. Handling separate from main transaction.');

                    // Create Fines First (so they are recorded regardless of payment success)
                    if (fines && fines.length > 0) {
                        await prisma.$transaction(async (tx) => {
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
                        });
                    }

                    const customer = await prisma.customer.findUnique({ where: { id: transaction.customerId } });
                    const productDetails = `Return Payment for Transaction #${transaction.id}`;

                    try {
                        const amount = parseFloat(payment.amount);
                        const duitkuResp = await duitkuService.createQRIS(
                            transaction.id.toString() + '-RETURN',
                            amount,
                            productDetails,
                            {
                                name: customer?.name || 'Customer',
                                email: 'customer@rently.com',
                                phone: customer?.phone || ''
                            }
                        );

                        return res.json({
                            success: true,
                            qrString: duitkuResp.qrString,
                            paymentUrl: duitkuResp.paymentUrl,
                            transactionId: transaction.id,
                            suffix: 'RETURN'
                        });
                    } catch (err: any) {
                        console.error('[Return] Duitku QRIS generation failed:', err);
                        return res.status(500).json({ error: `Duitku Error: ${err.message || 'Unknown'}` });
                    }
                }
            }

            // 2. Regular Flow (Manual Payment or No Payment)
            await prisma.$transaction(async (tx) => {
                // a. Record Fines if any
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

                // b. Process Payment if any (Regular Manual)
                let addedPayment = 0;
                if (payment && payment.amount > 0) {
                    const activeShift = await tx.shift.findFirst({
                        where: { userId: (req as any).user?.id, status: 'OPEN' }
                    });

                    await tx.payment.create({
                        data: {
                            transactionId: transaction.id,
                            amount: parseFloat(payment.amount),
                            paymentMethodId: payment.methodId,
                            note: payment.note || 'Fine Payment',
                            createdById: req.user?.id ?? null,
                            shiftId: activeShift?.id ?? null
                        }
                    });
                    addedPayment = parseFloat(payment.amount);
                }

                // c. Update Transaction (Status, Dates, Amounts)
                const depositAmount = transaction.depositAmount || 0;
                let usedDeposit = 0;
                let newDepositStatus = transaction.depositStatus;

                if (depositAmount > 0 && totalFineAmount > 0) {
                    usedDeposit = Math.min(depositAmount, totalFineAmount);
                    if (usedDeposit === depositAmount) newDepositStatus = 'DEDUCTED';
                    else newDepositStatus = 'PARTIAL';
                } else if (depositAmount > 0 && totalFineAmount === 0) {
                    newDepositStatus = 'REFUNDED';
                }

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'RETURNED',
                        actualReturnDate: new Date(returnDate || new Date()),
                        totalAmount: { increment: totalFineAmount },
                        paidAmount: { increment: addedPayment + usedDeposit },
                        depositStatus: newDepositStatus,
                        returnedById: req.user?.id ?? null
                    }
                });

                // d. Move Items to Laundry Queue
                for (const item of transaction.items) {
                    await tx.itemInstance.update({
                        where: { sku: item.itemInstanceSku },
                        data: { status: 'IN_LAUNDRY' }
                    });
                    laundrySkus.push(item.itemInstanceSku);
                }
            });

            // 3. Create Laundry Logs AFTER transaction success (non-blocking)
            if (laundrySkus.length > 0) {
                for (const sku of laundrySkus) {
                    try {
                        await prisma.laundryLog.create({
                            data: {
                                itemInstanceSku: sku,
                                status: 'WAITING'
                            }
                        });
                    } catch (laundryError: any) {
                        console.error(`FAILED to create LaundryLog for ${sku}:`, laundryError.message);
                    }
                }
            }

            console.log('[Return] Processed successfully (Manual/No Payment)');
            res.json({ success: true, message: 'Return processed successfully' });

        } catch (error: any) {
            console.error('[Return] Global Error:', error);
            res.status(400).json({ error: error.message || 'Return failed' });
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
                    returnedBy: { select: { name: true, username: true } },
                    referralCode: { include: { partner: true } }
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
    },

    // Public Status Check for Online Polling
    getTransactionStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(id as string) },
                select: { status: true, paymentStatus: true }
            });
            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            res.json(transaction);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};

