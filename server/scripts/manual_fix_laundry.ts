import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSchema() {
    console.log("Checking Schema Consistency...");
    try {
        // Check if createdAt column exists by running a raw query
        // If this fails, we know we need to alter table
        await prisma.$queryRaw`SELECT createdAt FROM LaundryLog LIMIT 1`;
        console.log("Schema is valid (createdAt exists).");
    } catch (e: any) {
        console.log("Column 'createdAt' missing or other error. Attempting fix...");
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE LaundryLog 
                ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
            `);
            console.log("SUCCESS: Added 'createdAt' column to LaundryLog.");
        } catch (alterError) {
            console.warn("Alter table failed (might already exist):", alterError);
        }
    }
}

async function main() {
    try {
        console.log("--- DIAGNOSTIC SCRIPT START ---");
        console.log('DB:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));

        // 0. Ensure Schema
        await fixSchema();

        // 1. Check Transaction 33 first, or latest returned
        let tx = await prisma.transaction.findUnique({
            where: { id: 33 },
            include: { items: true }
        });

        if (!tx) {
            console.log("Transaction 33 not found, checking latest RETURNED transaction...");
            tx = await prisma.transaction.findFirst({
                where: { status: 'RETURNED' },
                orderBy: { id: 'desc' },
                include: { items: true }
            });
        }

        if (!tx) {
            console.error("NO RETURNED TRANSACTION FOUND.");
            return;
        }

        console.log(`Checking Transaction ID: ${tx.id}`);
        console.log(`Status: ${tx.status}`);
        console.log(`Items Count: ${tx.items.length}`);

        if (tx.items.length === 0) {
            console.warn("WARNING: This transaction has NO items attached!");
        }

        // 2. Check Items and Fix
        for (const txItem of tx.items) {
            const sku = txItem.itemInstanceSku;
            console.log(`Checking Item SKU: ${sku}`);

            // Check Instance
            const instance = await prisma.itemInstance.findUnique({
                where: { sku }
            });
            console.log(`  - Current Instance Status: ${instance?.status}`);

            // Fix Instance Status if needed
            if (instance && instance.status !== 'IN_LAUNDRY') {
                console.log(`  -> FIXING Item Status to 'IN_LAUNDRY'...`);
                await prisma.itemInstance.update({
                    where: { sku },
                    data: { status: 'IN_LAUNDRY' }
                });
                console.log(`  -> FIXED Item Status.`);
            }

            // Check LaundryLog
            const logs = await prisma.laundryLog.findMany({
                where: { itemInstanceSku: sku }
            });
            console.log(`  - Laundry Logs Found: ${logs.length}`);

            // Check for active log
            const activeLog = logs.find(l => ['WAITING', 'IN_PROGRESS'].includes(l.status));

            if (!activeLog) {
                console.log(`  -> MISSING Active LaundryLog. Creating 'WAITING' log...`);
                try {
                    const newLog = await prisma.laundryLog.create({
                        data: {
                            itemInstanceSku: sku,
                            status: 'WAITING'
                        }
                    });
                    console.log(`  -> CREATED LaundryLog ID: ${newLog.id}`);
                } catch (e) {
                    console.error(`  -> FAILED to create log:`, e);
                }
            } else {
                console.log(`  -> Active Log Exists: ID ${activeLog.id} (${activeLog.status})`);
            }
        }
        console.log("--- DIAGNOSTIC SCRIPT FINISHED ---");
    } catch (e) {
        console.error("Script Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
