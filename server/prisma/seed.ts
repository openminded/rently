import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // --- Master Data ---

    // Categories
    const categories = ['Tenda', 'Tas Carrier', 'Jaket Outdoor', 'Sepatu Trekking', 'Peralatan Masak', 'Lampu & Senter'];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // Brands
    const brands = ['Eiger', 'Consina', 'Rei', 'The North Face', 'Deuter', 'Osprey', 'Great Outdoor'];
    for (const name of brands) {
        await prisma.brand.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // Colors
    const colors = [
        { name: 'Merah', hexCode: '#FF0000' },
        { name: 'Biru', hexCode: '#0000FF' },
        { name: 'Hitam', hexCode: '#000000' },
        { name: 'Hijau Army', hexCode: '#4B5320' },
        { name: 'Orange', hexCode: '#FFA500' },
        { name: 'Abu-abu', hexCode: '#808080' },
    ];
    for (const c of colors) {
        await prisma.color.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        });
    }

    // Sizes
    const sizes = ['S', 'M', 'L', 'XL', 'All Size', '40L', '60L', '80L'];
    for (const name of sizes) {
        await prisma.size.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // Payment Methods
    const payments = [
        { name: 'Cash', account: '-' },
        { name: 'Transfer BCA', account: '1234567890' },
        { name: 'Transfer Mandiri', account: '0987654321' },
        { name: 'QRIS', account: '-' },
    ];
    for (const p of payments) {
        await prisma.paymentMethod.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
    }

    // Violation Types
    const violations = [
        { name: 'Terlambat (Per Hari)', defaultFine: 20000 },
        { name: 'Barang Rusak Ringan', defaultFine: 50000 },
        { name: 'Barang Rusak Berat', defaultFine: 150000 },
        { name: 'Barang Hilang', defaultFine: 500000 },
        { name: 'Barang Kotor', defaultFine: 15000 },
    ];
    for (const v of violations) {
        await prisma.violationType.upsert({
            where: { name: v.name },
            update: {},
            create: v,
        });
    }

    // App Settings
    const settings = [
        { key: 'laundry_duration', value: '2', description: 'Default laundry duration in days' },
    ];
    for (const s of settings) {
        await prisma.appSetting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }

    console.log('Master Data seeded.');

    // --- Customers ---
    const customers = [
        { name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 1, Jakarta', identityCardNumber: '3171010101010001' },
        { name: 'Siti Aminah', phone: '081298765432', address: 'Jl. Sudirman No. 45, Bandung', identityCardNumber: '3273010101010002' },
        { name: 'Rudi Hartono', phone: '081345678901', address: 'Jl. Diponegoro No. 10, Surabaya', identityCardNumber: '3578010101010003' },
        { name: 'Dewi Lestari', phone: '081123456789', address: 'Jl. Malioboro No. 5, Yogyakarta', identityCardNumber: '3471010101010004' },
    ];

    for (const c of customers) {
        await prisma.customer.upsert({
            where: { phone: c.phone },
            update: {},
            create: c,
        });
    }
    console.log('Customers seeded.');

    // --- Inventory ---

    // Helpers to get IDs
    const catTenda = await prisma.category.findUnique({ where: { name: 'Tenda' } });
    const catTas = await prisma.category.findUnique({ where: { name: 'Tas Carrier' } });

    const brandGreat = await prisma.brand.findUnique({ where: { name: 'Great Outdoor' } });
    const brandEiger = await prisma.brand.findUnique({ where: { name: 'Eiger' } });
    const brandDeuter = await prisma.brand.findUnique({ where: { name: 'Deuter' } });

    const colorOrange = await prisma.color.findUnique({ where: { name: 'Orange' } });
    const colorBlue = await prisma.color.findUnique({ where: { name: 'Biru' } });
    const colorGreen = await prisma.color.findUnique({ where: { name: 'Hijau Army' } });

    const size4p = await prisma.size.findUnique({ where: { name: 'All Size' } }); // Assuming tents are all size or specific capacity size not in list
    const size60L = await prisma.size.findUnique({ where: { name: '60L' } });

    // Item 1: Tenda Great Outdoor Java 4 Pro
    if (catTenda && brandGreat && colorOrange && size4p) {
        const item = await prisma.item.create({
            data: {
                name: 'Tenda Great Outdoor Java 4 Pro',
                categoryId: catTenda.id,
                brandId: brandGreat.id,
                rentalPrice: 50000,
                description: 'Tenda kapasitas 4 orang, double layer, waterproof.',
                variants: {
                    create: {
                        sizeId: size4p.id,
                        colorId: colorOrange.id,
                        instances: {
                            createMany: {
                                data: [
                                    { sku: 'TND-JAVA4-001', status: 'AVAILABLE' },
                                    { sku: 'TND-JAVA4-002', status: 'AVAILABLE' },
                                    { sku: 'TND-JAVA4-003', status: 'RENTED' }, // Simulate rented
                                ]
                            }
                        }
                    }
                }
            }
        });
    }

    // Item 2: Carrier Eiger Equator 60L
    if (catTas && brandEiger && colorBlue && size60L) {
        await prisma.item.create({
            data: {
                name: 'Tas Carrier Eiger Equator',
                categoryId: catTas.id,
                brandId: brandEiger.id,
                rentalPrice: 75000,
                description: 'Carrier 60L tangguh untuk ekspedisi panjang.',
                variants: {
                    create: {
                        sizeId: size60L.id,
                        colorId: colorBlue.id,
                        instances: {
                            createMany: {
                                data: [
                                    { sku: 'CAR-EIG60-001', status: 'AVAILABLE' },
                                    { sku: 'CAR-EIG60-002', status: 'AVAILABLE' },
                                ]
                            }
                        }
                    }
                }
            }
        });
    }

    // Item 3: Carrier Deuter Aircontact 60L
    if (catTas && brandDeuter && colorGreen && size60L) {
        await prisma.item.create({
            data: {
                name: 'Carrier Deuter Aircontact',
                categoryId: catTas.id,
                brandId: brandDeuter.id,
                rentalPrice: 90000,
                description: 'Carrier premium dengan sistem backsystem yang nyaman.',
                variants: {
                    create: {
                        sizeId: size60L.id,
                        colorId: colorGreen.id,
                        instances: {
                            createMany: {
                                data: [
                                    { sku: 'CAR-DEU60-001', status: 'AVAILABLE' },
                                ]
                            }
                        }
                    }
                }
            }
        });
    }

    console.log('Inventory seeded.');
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
