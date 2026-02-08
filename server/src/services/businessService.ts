
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const businessService = {
    /**
     * Register a new business and its owner
     */
    registerBusiness: async (data: any) => {
        const { businessName, address, phone, ownerName, username, password } = data;

        // 1. Transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            // Check if username exists globally
            const existingUser = await tx.user.findUnique({ where: { username } });
            if (existingUser) {
                throw new Error('Username already taken');
            }

            // Create Business
            // Slug generation (simple version)
            const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

            const business = await tx.business.create({
                data: {
                    name: businessName,
                    slug,
                    address,
                    phone,
                    ownerId: 0 // Placeholder, update later
                }
            });

            // Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create Owner User
            const user = await tx.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    name: ownerName,
                    role: 'OWNER',
                    businessId: business.id
                }
            });

            // Update Business with Owner ID
            await tx.business.update({
                where: { id: business.id },
                data: { ownerId: user.id }
            });

            // Seed Defaults (Pass tx to ensure atomicity)
            await businessService.seedDefaults(business.id, tx);

            return { business, user };
        });
    },

    /**
     * Seed default data for a new business
     */
    seedDefaults: async (businessId: number, tx: any) => {
        // Use provided transaction client or fallback to global prisma
        const db = tx || prisma;

        // 1. Payment Methods
        const paymentMethods = [
            { name: 'Cash', type: 'CASH', account: '-' },
            { name: 'Transfer BCA', type: 'TRANSFER', account: 'Rekening BCA' },
            { name: 'Transfer Mandiri', type: 'TRANSFER', account: 'Rekening Mandiri' },
            { name: 'QRIS', type: 'GATEWAY', account: 'Duitku' }
        ];

        for (const pm of paymentMethods) {
            await db.paymentMethod.create({
                data: { ...pm, businessId }
            });
        }

        // 2. Violation Types
        const violationTypes = [
            { name: 'Terlambat', defaultFine: 50000 },
            { name: 'Noda', defaultFine: 25000 },
            { name: 'Rusak Ringan', defaultFine: 100000 },
            { name: 'Rusak Berat', defaultFine: 500000 },
            { name: 'Hilang', defaultFine: 1000000 }
        ];

        for (const vt of violationTypes) {
            await db.violationType.create({
                data: { ...vt, businessId }
            });
        }

        // 3. Expense Categories
        const expenseCategories = [
            { name: 'Gaji Karyawan', description: 'Pembayaran gaji bulanan/harian' },
            { name: 'Operasional', description: 'Listrik, Air, Internet' },
            { name: 'Perawatan', description: 'Maintenance barang/aset' },
            { name: 'Pemasaran', description: 'Iklan dan promosi' }
        ];

        for (const ec of expenseCategories) {
            await db.expenseCategory.create({
                data: { ...ec, businessId }
            });
        }

        // 4. Broadcast Templates
        const templates = [
            {
                name: 'Reminder Pickup',
                content: 'Halo {{name}}, \n\nPesanan Anda sudah siap diambil. \nSilakan datang ke store kami.\n\nTerima kasih!'
            },
            {
                name: 'Reminder Return',
                content: 'Halo {{name}}, \n\nHari ini adalah jadwal pengembalian sewa Anda. \nMohon kembalikan tepat waktu.\n\nTerima kasih!'
            }
        ];

        for (const t of templates) {
            await db.broadcastTemplate.create({
                data: { ...t, businessId }
            });
        }

        // 5. Default Settings
        await db.appSetting.create({
            data: {
                key: 'site_name',
                value: 'Werently',
                type: 'STRING',
                group: 'GENERAL',
                businessId
            }
        });

        console.log(`Seeded defaults for Business ID ${businessId}`);
    }
};
