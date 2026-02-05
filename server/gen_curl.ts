import crypto from 'crypto';

const merchantCode = 'DS27878';
const apiKey = 'd10b6ff2020b8c294691b0af14535975';
const orderId = 'TEST' + Date.now();
const amount = 10000;

const signature = crypto.createHash('md5').update(merchantCode + orderId + amount + apiKey).digest('hex');

const payload = {
    merchantCode,
    paymentAmount: amount,
    paymentMethod: 'NQ',
    merchantOrderId: orderId,
    productDetails: 'Test QRIS',
    email: 'customer@example.com',
    phoneNumber: '08123456789',
    callbackUrl: 'https://werently.telaju.com/api/payments/duitku/callback',
    returnUrl: 'https://werently.telaju.com/transactions',
    signature
};

console.log('--- PAYLOAD ---');
console.log(JSON.stringify(payload, null, 2));
console.log('\n--- CURL COMMAND (PRODUCTION) ---');
console.log(`curl -X POST https://passport.duitku.com/webapi/api/merchant/v2/inquiry -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`);
console.log('\n--- CURL COMMAND (SANDBOX) ---');
console.log(`curl -X POST https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`);
