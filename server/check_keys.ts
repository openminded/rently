import dotenv from 'dotenv';
dotenv.config();

console.log('MERCHANT_CODE:', JSON.stringify(process.env.DUITKU_MERCHANT_CODE));
console.log('API_KEY (Start):', process.env.DUITKU_API_KEY ? process.env.DUITKU_API_KEY.substring(0, 5) + '...' : 'Missing');
console.log('API_KEY (Full for debugging):', process.env.DUITKU_API_KEY);
console.log('ENV:', process.env.DUITKU_ENV);
