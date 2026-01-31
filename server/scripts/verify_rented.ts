import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Rented Item Transaction...');

    // Find the rented item instance
    const rentedInstance = await prisma.itemInstance.findFirst({
        where: {
            sku: 'JHF-L-002',
            status: 'RENTED'
        }
    });

    if (!rentedInstance) {
        console.error('❌ Error: Rented item JHF-L-002 not found or not RENTED');
        return;
    }
    console.log('✅ Found rented item instance.');

    // Check for related transaction item
    const transactionItem = await prisma.transactionItem.findFirst({
        where: {
            itemInstanceSku: 'JHF-L-002'
        },
        include: {
            transaction: true
        }
    });

    if (!transactionItem) {
        console.error('❌ Error: No Transaction Item found for Rented Instance');
        return;
    }

    console.log(`✅ Found Transaction Item linked to Transaction ID: ${transactionItem.transactionId}`);
    console.log(`Transaction Status: ${transactionItem.transaction.status}`);

    if (transactionItem.transaction.status === 'RENTED') {
        console.log('✅ Verification Passed: Item is RENTED and has a valid RENTED transaction.');
    } else {
        console.error(`❌ Error: Transaction status is ${transactionItem.transaction.status}, expected RENTED`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
