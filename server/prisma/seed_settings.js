import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
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
    // CONTACT & FOOTER
    { key: 'LANDING_WA_NUMBER', value: '6281234567890' },
    { key: 'LANDING_FOOTER_ABOUT', value: 'Dari busana wisuda hingga gaun pernikahan, kami menyediakan ribuan pilihan untuk menyempurnakan hari istimewa Anda.' }
];
async function main() {
    console.log('Start seeding settings...');
    for (const setting of settings) {
        await prisma.appSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: { key: setting.key, value: setting.value },
        });
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_settings.js.map