import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    try {
        const settings = [
            // HERO SECTION
            { key: 'LANDING_HERO_TITLE_1', value: 'Temukan' },
            { key: 'LANDING_HERO_TITLE_ACCENT', value: 'Pesona' },
            { key: 'LANDING_HERO_TITLE_2', value: 'Nusantara' },
            { key: 'LANDING_HERO_BADGE', value: 'Koleksi Baru 2026' },
            { key: 'LANDING_HERO_DESC', value: 'Busana premium untuk momen istimewa Anda. Sewa dengan mudah, tampil memukau tanpa harus membeli.' },
            { key: 'LANDING_HERO_CTA_PRIMARY', value: 'Jelajahi Sekarang' },
            { key: 'LANDING_HERO_IMAGE', value: '/hero_indo.png' },
            { key: 'LANDING_HERO_FLOAT_PRICE_LABEL', value: 'Set Premium' },
            { key: 'LANDING_HERO_FLOAT_PRICE_VALUE', value: 'Rp 1.500k' },
            { key: 'LANDING_HERO_FLOAT_USER_COUNT', value: '1.2k+' },
            { key: 'LANDING_HERO_FLOAT_USER_LABEL', value: 'Pelanggan Puas' },

            // FEATURE SECTION
            { key: 'LANDING_FEATURE_TITLE', value: 'Pilihan Editor' },
            { key: 'LANDING_FEATURE_SUBTITLE', value: 'Koleksi Lebaran' },
            { key: 'LANDING_FEATURE_HEAD_1', value: 'Tampil Anggun' },
            { key: 'LANDING_FEATURE_HEAD_2', value: 'Di Hari Fitri' },
            { key: 'LANDING_FEATURE_DESC', value: 'Temukan koleksi kaftan dan gamis eksklusif dengan bahan premium yang nyaman. Sempurna untuk silaturahmi bersama keluarga tercinta.' },
            { key: 'LANDING_FEATURE_CTA', value: 'Lihat Koleksi' },
            { key: 'LANDING_FEATURE_IMG_1', value: '/feature_sq.png' },
            { key: 'LANDING_FEATURE_IMG_2', value: '/feature_wide.png' },

            // PROMO SECTION
            { key: 'LANDING_PROMO_TITLE_1', value: 'Nikmati diskon 50%' },
            { key: 'LANDING_PROMO_TITLE_2', value: 'untuk sewa pertama' },
            { key: 'LANDING_PROMO_DESC', value: 'Penawaran spesial untuk pelanggan baru. Rasakan kemewahan tanpa menguras dompet. Berlaku hingga akhir bulan.' },
            { key: 'LANDING_PROMO_BADGE', value: 'Rekomendasi Minggu Ini' },
            { key: 'LANDING_PROMO_DISCOUNT', value: 'Hemat 15%' },
            { key: 'LANDING_PROMO_CTA', value: 'Sewa Sekarang' },
            { key: 'LANDING_PROMO_IMG_1', value: '/promo_1.png' },
            { key: 'LANDING_PROMO_IMG_2', value: '/promo_2.png' },

            // HOW TO RENT
            { key: 'LANDING_HOWTO_TITLE', value: 'Cara Sewa Mudah' },
            { key: 'LANDING_HOWTO_STEP_1_TITLE', value: 'Pilih Busana' },
            { key: 'LANDING_HOWTO_STEP_1_DESC', value: 'Jelajahi koleksi kami dan temukan yang cocok untuk acaramu.' },
            { key: 'LANDING_HOWTO_STEP_2_TITLE', value: 'Booking Tanggal' },
            { key: 'LANDING_HOWTO_STEP_2_DESC', value: 'Tentukan tanggal sewa dan lakukan pembayaran Booking Fee.' },
            { key: 'LANDING_HOWTO_STEP_3_TITLE', value: 'Ambil & Tampil' },
            { key: 'LANDING_HOWTO_STEP_3_DESC', value: 'Ambil busana di butik H-1 atau H-2 dan tampil memukau.' },
            { key: 'LANDING_HOWTO_STEP_4_TITLE', value: 'Kembalikan' },
            { key: 'LANDING_HOWTO_STEP_4_DESC', value: 'Kembalikan H+1. Tidak perlu dicuci, kami yang urus laundry.' },

            // ABOUT US
            { key: 'LANDING_ABOUT_TITLE', value: 'Tentang Rumah Dinar' },
            { key: 'LANDING_ABOUT_DESC', value: 'Rumah Dinar hadir untuk menjawab kebutuhan fashion premium tanpa harus membeli. Kami percaya bahwa setiap orang berhak tampil istimewa di momen spesial mereka dengan busana berkualitas tinggi, bersih, dan wangi.' },
            { key: 'LANDING_ABOUT_IMAGE', value: '/feature_sq.png' },

            // CONTACT
            { key: 'LANDING_CONTACT_TITLE', value: 'Hubungi Kami' },
            { key: 'LANDING_CONTACT_ADDRESS', value: 'Jl. Ahmad Yani No. 123, Surabaya, Jawa Timur' },
            { key: 'LANDING_CONTACT_EMAIL', value: 'hello@rumahdinar.com' },
            { key: 'LANDING_CONTACT_PHONE', value: '+62 812-3456-7890' },
            { key: 'LANDING_CONTACT_MAP', value: 'https://www.google.com/maps/embed?pb=...' },

            // CONTACT & FOOTER
            { key: 'LANDING_WA_NUMBER', value: '6281234567890' },
            { key: 'LANDING_FOOTER_ABOUT', value: 'Dari busana wisuda hingga gaun pernikahan, kami menyediakan ribuan pilihan untuk menyempurnakan hari istimewa Anda.' },

            // TOGGLES (DEFAULT ENABLED)
            { key: 'LANDING_ENABLE_GLOBAL', value: 'true' },
            { key: 'LANDING_ENABLE_HERO', value: 'true' },
            { key: 'LANDING_ENABLE_FEATURE', value: 'true' },
            { key: 'LANDING_ENABLE_PROMO', value: 'true' },
            { key: 'LANDING_ENABLE_HOWTO', value: 'true' },
            { key: 'LANDING_ENABLE_ABOUT', value: 'true' },
            { key: 'LANDING_ENABLE_CONTACT', value: 'true' },
            { key: 'LANDING_ENABLE_SOCIAL', value: 'true' }
        ];

        for (const setting of settings) {
            await prisma.appSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: { key: setting.key, value: setting.value },
            });
        }
        res.json({ message: 'Seeding success' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seeding failed' });
    }
});

export default router;
