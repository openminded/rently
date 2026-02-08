import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import { duitkuService } from '../services/duitkuService.js';

export const paymentController = {
    /**
     * Handle Duitku callback (HTTP POST)
     */
    handleCallback: async (req: Request, res: Response) => {
        try {
            console.log('[Duitku Callback] Start payload:', req.body);
            const {
                merchantCode,
                amount,
                merchantOrderId,
                productDetail,
                additionalParam,
                paymentCode,
                resultCode,
                merchantUserId,
                reference,
                signature
            } = req.body;

            // 1. Verify Signature
            const isValid = duitkuService.verifySignature({
                merchantCode,
                amount,
                merchantOrderId,
                signature
            });

            if (!isValid) {
                console.error('[Duitku Callback] Invalid signature');
                return res.status(400).send('Invalid signature');
            }

            // 2. Process Success Payment
            // resultCode '00' means success in Duitku
            if (resultCode === '00') {
                const orderIdStr = merchantOrderId.toString();
                const transactionId = parseInt(orderIdStr.split('-')[0]);
                const suffix = orderIdStr.includes('-') ? orderIdStr.split('-').pop() : '';

                await prisma.$transaction(async (tx) => {
                    // Find transaction
                    const transaction = await tx.transaction.findUnique({
                        where: { id: transactionId },
                        include: { items: true }
                    });

                    if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

                    // Check if already paid to avoid double processing
                    // (But we might allow partial payments logic if needed, 
                    // for now let's stick to the current logic but add status updates)

                    // Create Payment record
                    let paymentMethod = await tx.paymentMethod.findFirst({
                        where: {
                            type: 'GATEWAY',
                            businessId: transaction.businessId
                        }
                    });

                    await tx.payment.create({
                        data: {
                            transactionId: transaction.id,
                            businessId: transaction.businessId,
                            amount: parseFloat(amount),
                            paymentMethodId: paymentMethod?.id || 0,
                            note: `Duitku QRIS (${suffix || 'General'}): ${reference}`,
                        }
                    });

                    // Update Transaction
                    const newPaidAmount = transaction.paidAmount + parseFloat(amount);
                    const isFullyPaid = newPaidAmount >= transaction.totalAmount;

                    await tx.transaction.update({
                        where: { id: transactionId },
                        data: {
                            paidAmount: newPaidAmount,
                            paymentStatus: isFullyPaid ? 'PAID' : 'PARTIAL',
                            // Status Transitions
                            ...(suffix === 'PICKUP' && {
                                status: 'RENTED',
                                pickupDate: new Date()
                            }),
                            ...(suffix === 'RETURN' && {
                                status: 'RETURNED',
                                actualReturnDate: new Date()
                            })
                        }
                    });

                    // Handle Item Instances
                    if (suffix === 'PICKUP') {
                        for (const item of transaction.items) {
                            await tx.itemInstance.update({
                                where: { sku: item.itemInstanceSku },
                                data: { status: 'RENTED' }
                            });
                        }
                    } else if (suffix === 'RETURN') {
                        for (const item of transaction.items) {
                            await tx.itemInstance.update({
                                where: { sku: item.itemInstanceSku },
                                data: { status: 'IN_LAUNDRY' }
                            });
                            // Create Laundry Log
                            await tx.laundryLog.create({
                                data: {
                                    itemInstanceSku: item.itemInstanceSku,
                                    status: 'WAITING'
                                }
                            });
                        }
                    }
                });

                console.log(`[Duitku Callback] Transaction ${transactionId} [${suffix}] updated successfully.`);
            } else {
                console.log(`[Duitku Callback] Payment failed/cancelled for ${merchantOrderId}. ResultCode: ${resultCode}`);
            }

            // Duitku expects 'OK' response to stop retrying
            res.status(200).send('OK');
        } catch (error) {
            console.error('[Duitku Callback] Error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    /**
     * Manually check status of a transaction
     */
    checkStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const response = await duitkuService.checkStatus(id as string);
            res.json(response);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
