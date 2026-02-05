import axios from 'axios';
import crypto from 'crypto';

const merchantCode = 'DS27878';
const apiKey = 'd10b6ff2020b8c294691b0af14535975';
const amount = 10000;
const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

const signature = crypto.createHash('sha256').update(merchantCode + amount + datetime + apiKey).digest('hex');

const payload = {
    merchantCode,
    datetime,
    amount,
    signature
};

async function testMethods() {
    console.log('--- FETCHING METHODS (SANDBOX) ---');
    try {
        const resp = await axios.post('https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod', payload);
        console.log('SANDBOX METHODS:', JSON.stringify(resp.data, null, 2));
    } catch (err: any) {
        console.log('SANDBOX FAILED:', err.response?.data || err.message);
    }
}

testMethods();
