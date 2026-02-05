
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function finishAll() {
    try {
        console.log('Starting Cleanup: Marking all active transactions as RETURNED...');

        // 1. Get all transactions that are not already finished
        const activeTransactions = await prisma.transaction.findMany({
            where: {
                status: {
                    in: ['BOOKED', 'RENTED']
                }
            },
            include: {
                items: true
            }
        });

        console.log(`Found ${activeTransactions.length} active transactions.`);

        for (const tx of activeTransactions) {
            // Transition to RETURNED
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    status: 'RETURNED',
                    actualReturnDate: new Date(),
                    paymentStatus: 'PAID', // Assume paid for cleanup
                    paidAmount: tx.totalAmount
                }
            });

            // Reset Items to AVAILABLE
            for (const item of tx.items) {
                await prisma.itemInstance.update({
                    where: { sku: item.itemInstanceSku },
                    data: { status: 'AVAILABLE' }
                });
            }
        }

        console.log('Cleanup complete. All active transactions are now RETURNED and items are AVAILABLE.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

finishAll();
