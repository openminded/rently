import axios from 'axios';

const payload = {
    "merchantCode": "DS27878",
    "paymentAmount": 10000,
    "paymentMethod": "NQ",
    "merchantOrderId": "TEST" + Date.now(),
    "productDetails": "Test QRIS",
    "email": "customer@example.com",
    "phoneNumber": "08123456789",
    "callbackUrl": "https://werently.telaju.com/api/payments/duitku/callback",
    "returnUrl": "https://werently.telaju.com/transactions",
    "signature": "" // Will calculate below
};

const apiKey = 'd10b6ff2020b8c294691b0af14535975';
import crypto from 'crypto';

payload.signature = crypto.createHash('md5').update(payload.merchantCode + payload.merchantOrderId + payload.paymentAmount + apiKey).digest('hex');

async function test() {
    console.log('--- TESTING PRODUCTION ---');
    try {
        const resp = await axios.post('https://passport.duitku.com/webapi/api/merchant/v2/inquiry', payload);
        console.log('PROD SUCCESS:', resp.data);
    } catch (err: any) {
        console.log('PROD FAILED:', err.response?.data || err.message);
    }

    console.log('\n--- TESTING SANDBOX ---');
    try {
        const resp = await axios.post('https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry', payload);
        console.log('SANDBOX SUCCESS:', resp.data);
    } catch (err: any) {
        console.log('SANDBOX FAILED:', err.response?.data || err.message);
    }
}

test();
