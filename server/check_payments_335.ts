import prisma from './src/prisma.js';

async function check() {
    const payments = await prisma.payment.findMany({
        where: { transactionId: 335 }
    });
    console.log('Payments for 335:', JSON.stringify(payments, null, 2));
}

check();
