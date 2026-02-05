import prisma from './src/prisma.js';

async function check() {
    const tx = await prisma.transaction.findUnique({
        where: { id: 335 }
    });
    console.log('Transaction 335:', JSON.stringify(tx, null, 2));
}

check();
