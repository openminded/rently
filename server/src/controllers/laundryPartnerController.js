import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Get all laundry partners
export const getAllPartners = async (req, res) => {
    try {
        const partners = await prisma.laundryPartner.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(partners);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch laundry partners' });
    }
};
// Get single partner
export const getPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await prisma.laundryPartner.findUnique({
            where: { id: parseInt(id || '0') },
            include: {
                batches: {
                    include: {
                        logs: {
                            include: {
                                itemInstance: {
                                    include: {
                                        itemVariant: {
                                            include: {
                                                item: true,
                                                size: true,
                                                color: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!partner)
            return res.status(404).json({ error: 'Partner not found' });
        res.json(partner);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch partner' });
    }
};
// Create partner
export const createPartner = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const partner = await prisma.laundryPartner.create({
            data: { name, phone, address }
        });
        res.status(201).json(partner);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
};
// Update partner
export const updatePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;
        const partner = await prisma.laundryPartner.update({
            where: { id: parseInt(id || '0') },
            data: { name, phone, address }
        });
        res.json(partner);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
};
// Delete partner
export const deletePartner = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.laundryPartner.delete({
            where: { id: parseInt(id || '0') }
        });
        res.json({ message: 'Partner deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
};
//# sourceMappingURL=laundryPartnerController.js.map