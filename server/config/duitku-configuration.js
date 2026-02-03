const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const duitkuConfig = {
    merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
    apiKey: process.env.DUITKU_API_KEY || '',
    passport: process.env.DUITKU_ENV === 'production',
    callbackUrl: process.env.DUITKU_CALLBACK_URL || '',
    returnUrl: process.env.DUITKU_RETURN_URL || '',
    expiryPeriod: parseInt(process.env.DUITKU_EXPIRY_PERIOD || '1440')
};

module.exports = duitkuConfig;
