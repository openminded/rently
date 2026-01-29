
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Transactions ---');
    const transactions = await prisma.transaction.findMany({
        include: { items: true, customer: true }
    });
    console.log('Transactions found:', transactions.length);
    if (transactions.length > 0) {
        console.log('Last Transaction:', JSON.stringify(transactions[0], null, 2));
    } else {
        console.log('No transactions found.');
    }

    console.log('\n--- Checking Item Instances ---');
    const instances = await prisma.itemInstance.findMany();
    console.log('Instances found:', instances.length);
    const rented = instances.filter(i => i.status !== 'AVAILABLE');
    console.log('Rented Instances:', rented.map(i => `${i.sku} (${i.status})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
