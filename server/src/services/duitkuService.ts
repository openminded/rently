import dotenv from 'dotenv';
dotenv.config();

// @ts-ignore
import duitku from 'duitku';
const { requestTransaction, checkTransaction, Transaction, ItemDetail } = duitku;
import crypto from 'crypto';

const merchantCode = process.env.DUITKU_MERCHANT_CODE || '';
const apiKey = process.env.DUITKU_API_KEY || '';
const callbackUrl = process.env.DUITKU_CALLBACK_URL || '';
const returnUrl = process.env.DUITKU_RETURN_URL || '';

console.log('[Duitku Service] Initialized with Merchant:', merchantCode);
console.log('[Duitku Service] API Key present:', !!apiKey);
console.log('[Duitku Service] Env:', process.env.DUITKU_ENV);

/**
 * Service to handle Duitku payment gateway integration
 * Using the official 'duitku' npm package structure
 */
export const duitkuService = {
    /**
     * Create a new payment request (QRIS)
     */
    createQRIS: async (
        orderId: string,
        amount: number,
        productDetails: string,
        customerInfo: { name: string; email: string; phone: string },
        expiryPeriod?: number
    ): Promise<any> => {
        return new Promise((resolve, reject) => {
            try {
                // Using "SP" (ShopeePay QRIS) as it is more stable in sandbox than "NQ"
                const transaction = new Transaction(amount, 'SP', orderId, productDetails);

                transaction.setEmail(customerInfo.email);
                transaction.setPhoneNumber(customerInfo.phone);
                transaction.setCustomerVaName(customerInfo.name);
                transaction.setCallbackUrl(callbackUrl);
                transaction.setReturnUrl(returnUrl);

                if (expiryPeriod) {
                    transaction.setExpiryPeriod(expiryPeriod);
                }

                // Add Item Details (required by some flows)
                const item = new ItemDetail(productDetails, 0, amount);
                transaction.addItemDetails(item.get());

                // Create the request
                requestTransaction(transaction.get(), (resp: any, error: any) => {
                    console.log('[Duitku Create] Full Response:', resp);
                    if (error) {
                        console.error('[Duitku Create] Error Received:', error);
                        return reject(error);
                    }

                    // Standardize the response fields
                    const normalizedResp = {
                        ...resp,
                        paymentUrl: resp.paymentUrl || resp.payment_url || null,
                        qrString: resp.qrString || resp.qrCode || resp.qrContent || resp.qrisContent || resp.qrisData || null
                    };

                    console.log('[Duitku Create] Normalized:', normalizedResp);
                    resolve(normalizedResp);
                });
            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Check transaction status
     */
    checkStatus: async (orderId: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            try {
                checkTransaction(orderId, (resp: any, error: any) => {
                    console.log(`[Duitku Status] Check for Order ${orderId}:`, resp || error);
                    if (error) {
                        return reject(error);
                    }
                    resolve(resp);
                });
            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Verify callback signature
     * Formula: md5(merchantCode + amount + merchantOrderId + apiKey)
     */
    verifySignature: (payload: { merchantCode: string; amount: string; merchantOrderId: string; signature: string }) => {
        const { amount, merchantOrderId, signature } = payload;

        const data = merchantCode + amount + merchantOrderId + apiKey;
        const calculatedSignature = crypto.createHash('md5').update(data).digest('hex');

        return calculatedSignature === signature;
    }
};
