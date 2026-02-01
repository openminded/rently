import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const getAllSettings = async (req, res) => {
    try {
        const settings = await prisma.appSetting.findMany();
        // Convert to object for easier consumption { KEY: VALUE }
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};
// Public settings fetcher (subset of settings)
export const getPublicSettings = async (req, res) => {
    try {
        const settings = await prisma.appSetting.findMany({
            where: {
                OR: [
                    { key: { in: ['BRAND_NAME', 'BRAND_LOGO', 'BRAND_TAGLINE'] } },
                    { key: { startsWith: 'LANDING_' } }
                ]
            }
        });
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch public settings' });
    }
};
export const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { KEY: VALUE, KEY2: VALUE2 }
        const promises = Object.keys(updates).map(key => {
            return prisma.appSetting.upsert({
                where: { key },
                update: { value: updates[key] },
                create: { key, value: updates[key] }
            });
        });
        await Promise.all(promises);
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
//# sourceMappingURL=settingsController.js.map