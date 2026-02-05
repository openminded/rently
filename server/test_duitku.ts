import { duitkuService } from './src/services/duitkuService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing Duitku QRIS Generation...');
    try {
        const resp = await duitkuService.createQRIS(
            'TEST' + Date.now(),
            10000,
            'Test QRIS',
            {
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '08123456789'
            }
        );
        console.log('FULL RESPONSE:', JSON.stringify(resp, null, 2));
    } catch (err) {
        console.error('TEST FAILED:', err);
    }
}

test();
