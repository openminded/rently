import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const tx = await prisma.transaction.findUnique({
            where: { id: 6 },
            include: { customer: true, items: true }
        });
        console.log("Transaction 6:", tx);
        const all = await prisma.transaction.findMany({
            take: 5,
            orderBy: { id: 'desc' }
        });
        console.log("Recent Transactions:", all.map(t => ({ id: t.id, status: t.status, payment: t.paymentStatus })));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-db.js.map