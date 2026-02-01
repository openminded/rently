import cron from 'node-cron';
import prisma from '../prisma.js';
export const initReminderJob = () => {
    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('Running Daily Reminder Job (Pickup & Return)...');
        const now = new Date();
        // Set range for "Today"
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        try {
            // 1. PICKUP REMINDERS
            // Find transactions with pickupDate = Today AND status = BOOKED (or WAITING_PICKUP if you use that)
            const pickupTx = await prisma.transaction.findMany({
                where: {
                    status: { in: ['BOOKED', 'WAITING_PICKUP'] },
                    pickupDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { customer: true }
            });
            if (pickupTx.length > 0) {
                // Get Template
                const template = await prisma.broadcastTemplate.findUnique({
                    where: { name: 'Reminder Pickup' }
                });
                if (template) {
                    console.log(`Found ${pickupTx.length} pickups today. Creating broadcast...`);
                    // Prepare recipients
                    const targets = pickupTx.map(tx => ({
                        phone: tx.customer.phone,
                        name: tx.customer.name
                    }));
                    // Create Broadcast
                    await prisma.broadcast.create({
                        data: {
                            templateId: template.id,
                            name: `Auto Reminder Pickup - ${startOfDay.toLocaleDateString()}`,
                            content: template.content,
                            status: 'PENDING',
                            scheduledAt: new Date(), // Send now (since it's 8 AM)
                            targets: targets
                        }
                    });
                }
                else {
                    console.warn('Template "Reminder Pickup" not found. Skipping.');
                }
            }
            // 2. RETURN REMINDERS
            // Find transactions with returnPlanDate = Today AND status = RENTED
            const returnTx = await prisma.transaction.findMany({
                where: {
                    status: 'RENTED',
                    returnPlanDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { customer: true }
            });
            if (returnTx.length > 0) {
                const template = await prisma.broadcastTemplate.findUnique({
                    where: { name: 'Reminder Return' }
                });
                if (template) {
                    console.log(`Found ${returnTx.length} returns due today. Creating broadcast...`);
                    const targets = returnTx.map(tx => ({
                        phone: tx.customer.phone,
                        name: tx.customer.name
                    }));
                    await prisma.broadcast.create({
                        data: {
                            templateId: template.id,
                            name: `Auto Reminder Return - ${startOfDay.toLocaleDateString()}`,
                            content: template.content,
                            status: 'PENDING',
                            scheduledAt: new Date(),
                            targets: targets
                        }
                    });
                }
                else {
                    console.warn('Template "Reminder Return" not found. Skipping.');
                }
            }
        }
        catch (error) {
            console.error('Error in Reminder Job:', error);
        }
    });
    console.log('Reminder Job initialized (08:00 AM daily).');
};
//# sourceMappingURL=reminderJob.js.map