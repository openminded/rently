import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Starting Transaction Data Reset...');
    try {
        // 1. Delete dependent tables first to avoid FK constraints (though Prisma usually handles cascades if set, explicit is safer)
        console.log('Deleting Payments...');
        await prisma.payment.deleteMany({});
        console.log('Deleting Fines...');
        await prisma.fine.deleteMany({});
        console.log('Deleting Transaction Items...');
        await prisma.transactionItem.deleteMany({});
        console.log('Deleting Laundry Logs...');
        await prisma.laundryLog.deleteMany({});
        // 2. Delete Transactions
        console.log('Deleting Transactions...');
        await prisma.transaction.deleteMany({});
        // 3. Reset Item Instance Statuses
        console.log('Resetting Item Instance Statuses to AVAILABLE...');
        await prisma.itemInstance.updateMany({
            data: {
                status: 'AVAILABLE'
            }
        });
        console.log('✅ Successfully cleared all transaction data and reset inventory status.');
    }
    catch (error) {
        console.error('❌ Error clearing data:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=reset-transactions.js.map