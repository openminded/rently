import cron from 'node-cron';
import prisma from '../prisma.js';
import { whatsappService } from '../services/whatsappService.js';
export const initBroadcastJob = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        // Find pending broadcasts that are due
        const pendingBroadcasts = await prisma.broadcast.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { scheduledAt: { lte: now } },
                    { scheduledAt: null }
                ]
            }
        });
        if (pendingBroadcasts.length === 0)
            return;
        console.log(`Processing ${pendingBroadcasts.length} broadcasts...`);
        for (const broadcast of pendingBroadcasts) {
            try {
                // Update status to processing
                await prisma.broadcast.update({
                    where: { id: broadcast.id },
                    data: { status: 'PROCESSING' }
                });
                const targets = broadcast.targets;
                const results = [];
                if (whatsappService.connectionStatus !== 'CONNECTED') {
                    throw new Error('WhatsApp not connected');
                }
                for (const target of targets) {
                    try {
                        // Replace placeholders like {{name}} and {{items}}
                        let personalizedContent = broadcast.content
                            .replace(/{{name}}/g, target.name || '')
                            .replace(/{{items}}/g, target.items || '-');
                        await whatsappService.sendMessage(target.phone, personalizedContent);
                        results.push({ phone: target.phone, status: 'SUCCESS' });
                        // Random delay between 2-5 seconds to avoid bans
                        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
                    }
                    catch (err) {
                        results.push({ phone: target.phone, status: 'FAILED', error: err.message });
                    }
                }
                await prisma.broadcast.update({
                    where: { id: broadcast.id },
                    data: {
                        status: 'SENT',
                        results
                    }
                });
            }
            catch (error) {
                console.error(`Error processing broadcast ${broadcast.id}:`, error);
                await prisma.broadcast.update({
                    where: { id: broadcast.id },
                    data: { status: 'FAILED' }
                });
            }
        }
    });
};
//# sourceMappingURL=broadcastJob.js.map