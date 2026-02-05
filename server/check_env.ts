import dotenv from 'dotenv';
dotenv.config();

console.log('MERCHANT_CODE:', process.env.DUITKU_MERCHANT_CODE);
console.log('API_KEY:', process.env.DUITKU_API_KEY ? 'Present (Hidden)' : 'Missing');
console.log('ENV:', process.env.DUITKU_ENV);
