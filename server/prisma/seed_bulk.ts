import { PrismaClient, Role, ItemStatus, TransactionStatus, TransactionType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
    console.log('--- START BULK SEEDING ---');

    // 1. Ensure/Create Users
    const hashedPassword = await bcrypt.hash('zzzz', 10);
    const users = [
        { username: 'superadmin', name: 'Super Admin', role: Role.SUPERADMIN },
        { username: 'owner', name: 'Owner', role: Role.OWNER },
        { username: 'supervisor', name: 'Supervisor', role: Role.SUPERVISOR },
        { username: 'kasir_budi', name: 'Budi Kasir', role: Role.KASIR },
        { username: 'kasir_siti', name: 'Siti Kasir', role: Role.KASIR },
        { username: 'kasir_andi', name: 'Andi Kasir', role: Role.KASIR },
    ];

    const userIds: number[] = [];
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: { password: hashedPassword, role: u.role },
            create: { ...u, password: hashedPassword }
        });
        userIds.push(user.id);
    }
    console.log(`- Ensured ${userIds.length} users.`);

    // 2. Master Data
    const categoryNames = ['Jas', 'Kebaya', 'Gaun', 'Batik', 'Seragam', 'Kostum', 'Celana', 'Rok', 'Kemeja', 'Aksesoris'];
    const categories: any[] = [];
    for (const name of categoryNames) {
        const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
        categories.push(c);
    }

    const brandNames = ['Zara', 'H&M', 'Uniqlo', 'Batik Keris', 'Executive', 'Local Pride', 'Designer A', 'Designer B', 'Rumah Dinar', 'Tailor X'];
    const brands: any[] = [];
    for (const name of brandNames) {
        const b = await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
        brands.push(b);
    }

    const colorData = [
        { name: 'Merah', hexCode: '#FF0000' },
        { name: 'Putih', hexCode: '#FFFFFF' },
        { name: 'Hitam', hexCode: '#000000' },
        { name: 'Biru', hexCode: '#0000FF' },
        { name: 'Hijau', hexCode: '#00FF00' },
        { name: 'Kuning', hexCode: '#FFFF00' },
        { name: 'Pink', hexCode: '#FFC0CB' },
        { name: 'Ungu', hexCode: '#800080' },
        { name: 'Coklat', hexCode: '#A52A2A' },
        { name: 'Abu-abu', hexCode: '#808080' },
        { name: 'Gold', hexCode: '#FFD700' },
        { name: 'Silver', hexCode: '#C0C0C0' }
    ];
    const colors: any[] = [];
    for (const c of colorData) {
        const col = await prisma.color.upsert({ where: { name: c.name }, update: {}, create: c });
        colors.push(col);
    }

    const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'All Size'];
    const sizes: any[] = [];
    for (const name of sizeNames) {
        const s = await prisma.size.upsert({ where: { name }, update: {}, create: { name } });
        sizes.push(s);
    }

    const pmNames = ['Cash', 'Transfer BCA', 'Transfer Mandiri', 'QRIS', 'Debit Card'];
    const paymentMethods: any[] = [];
    for (const name of pmNames) {
        const pm = await prisma.paymentMethod.upsert({ where: { name }, update: {}, create: { name, account: name === 'Cash' ? '-' : '123456789' } });
        paymentMethods.push(pm);
    }

    const violationTypesData = [
        { name: 'Terlambat', defaultFine: 50000 },
        { name: 'Noda', defaultFine: 25000 },
        { name: 'Rusak Ringan', defaultFine: 100000 },
        { name: 'Rusak Berat', defaultFine: 500000 },
        { name: 'Hilang', defaultFine: 1000000 }
    ];
    const vtIds: number[] = [];
    for (const vt of violationTypesData) {
        const v = await prisma.violationType.upsert({ where: { name: vt.name }, update: {}, create: vt });
        vtIds.push(v.id);
    }

    console.log('- Ensured master data.');

    // 3. Customers
    const firstNames = ['Budi', 'Siti', 'Andi', 'Dewi', 'Eko', 'Rina', 'Agus', 'Lani', 'Joko', 'Maya', 'Riko', 'Tina', 'Hery', 'Yuli', 'Asep', 'Ika'];
    const lastNames = ['Santoso', 'Aminah', 'Wijaya', 'Lestari', 'Saputra', 'Putri', 'Hidayat', 'Sari', 'Prabowo', 'Utami', 'Setiawan', 'Kusuma'];
    const customerIds: number[] = [];
    for (let i = 0; i < 60; i++) {
        const name = `${randomElement(firstNames)} ${randomElement(lastNames)} ${i}-${randomInt(10, 99)}`;
        const phone = `08${randomInt(100000000, 999999999)}${i}`;
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: {},
            create: {
                name,
                phone,
                address: `Jl. Contoh No. ${i + 1}`,
                createdAt: randomDate(new Date(new Date().setDate(new Date().getDate() - 120)), new Date())
            }
        });
        customerIds.push(customer.id);
    }
    console.log(`- Created ${customerIds.length} customers.`);

    // 4. Items & Inventory
    const itemBases = [
        'Kebaya Modern', 'Jas Slim Fit', 'Gaun Malam', 'Batik Solo', 'Seragam Sekolah',
        'Pakaian Adat', 'Kemeja Batik', 'Gaun Pengantin', 'Jas Formal', 'Kebaya Encim',
        'Kebaya Wisuda', 'Jas Casual', 'Batik Pria', 'Gaun Cocktail', 'Batik Wanita'
    ];
    const itemIds: number[] = [];
    const instancesSkus: string[] = [];

    for (let i = 0; i < 60; i++) {
        const baseName = randomElement(itemBases);
        const colorName = randomElement(colorData).name;
        const name = `${baseName} ${colorName} Series ${i}`;
        const category = randomElement(categories);
        const brand = randomElement(brands);
        const rentalPrice = randomInt(50, 400) * 1000;

        const item = await prisma.item.create({
            data: {
                name,
                categoryId: category.id,
                brandId: brand.id,
                rentalPrice,
                description: `Deskripsi untuk ${name}`,
                createdAt: randomDate(new Date(new Date().setDate(new Date().getDate() - 120)), new Date())
            }
        });
        itemIds.push(item.id);

        const numVariants = randomInt(1, 4);
        const selectedCombos = new Set<string>();
        for (let v = 0; v < numVariants; v++) {
            const size = randomElement(sizes);
            const color = randomElement(colors);
            const comboKey = `${size.id}-${color.id}`;
            if (selectedCombos.has(comboKey)) continue;
            selectedCombos.add(comboKey);

            const variant = await prisma.itemVariant.create({
                data: { itemId: item.id, sizeId: size.id, colorId: color.id }
            });

            const numInstances = randomInt(1, 6);
            for (let ins = 0; ins < numInstances; ins++) {
                const sku = `SKU-${item.id}-${variant.id}-${ins}-${randomInt(1000, 9999)}`;
                const status = randomElement([ItemStatus.AVAILABLE, ItemStatus.AVAILABLE, ItemStatus.RENTED, ItemStatus.IN_LAUNDRY, ItemStatus.NOT_READY]);
                const instance = await prisma.itemInstance.create({
                    data: { sku, itemVariantId: variant.id, status, createdAt: item.createdAt }
                });
                instancesSkus.push(instance.sku);
            }
        }
    }
    console.log(`- Created ${itemIds.length} items.`);

    // 5. Transactions & Revenue
    console.log('- Generating transactions...');
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    let txCount = 0;
    const dayIterator = new Date(ninetyDaysAgo);
    while (dayIterator <= now) {
        const dailyTxs = randomInt(1, 5);
        for (let t = 0; t < dailyTxs; t++) {
            const customerId = randomElement(customerIds);
            const userId = randomElement(userIds);
            const txDate = new Date(dayIterator);
            txDate.setHours(randomInt(9, 18), randomInt(0, 59), 0);

            const status = randomElement([TransactionStatus.COMPLETED, TransactionStatus.COMPLETED, TransactionStatus.RENTED, TransactionStatus.BOOKED]);
            const pickupDate = new Date(txDate);
            pickupDate.setDate(pickupDate.getDate() + randomInt(1, 7));
            const returnPlanDate = new Date(pickupDate);
            returnPlanDate.setDate(returnPlanDate.getDate() + randomInt(2, 4));

            const itemsToRent = [];
            let totalAmount = 0;
            const numItems = randomInt(1, 2);
            for (let i = 0; i < numItems; i++) {
                const sku = randomElement(instancesSkus);
                totalAmount += 150000;
                itemsToRent.push({ itemInstanceSku: sku, priceAtRental: 150000 });
            }

            const paidAmount = status === TransactionStatus.COMPLETED ? totalAmount : (status === TransactionStatus.RENTED ? totalAmount * 0.5 : 50000);
            const pStatus = paidAmount >= totalAmount ? PaymentStatus.PAID : (paidAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID);

            const tx = await prisma.transaction.create({
                data: {
                    type: TransactionType.IMMEDIATE,
                    customerId,
                    userId,
                    status,
                    createdAt: txDate,
                    pickupDate,
                    returnPlanDate,
                    totalAmount,
                    paidAmount,
                    paymentStatus: pStatus,
                    items: { createMany: { data: itemsToRent } }
                }
            });

            if (paidAmount > 0) {
                await prisma.payment.create({
                    data: { transactionId: tx.id, amount: paidAmount, paymentMethodId: randomElement(paymentMethods).id, date: txDate, createdById: userId }
                });
            }

            if ((status === TransactionStatus.COMPLETED) && Math.random() > 0.8) {
                const fineAmount = randomInt(5, 50) * 1000;
                await prisma.fine.create({
                    data: { transactionId: tx.id, violationTypeId: randomElement(vtIds), amount: fineAmount, createdAt: txDate }
                });
                await prisma.payment.create({
                    data: { transactionId: tx.id, amount: fineAmount, paymentMethodId: randomElement(paymentMethods).id, date: txDate, createdById: userId }
                });
            }
            txCount++;
        }
        dayIterator.setDate(dayIterator.getDate() + 1);
    }
    console.log(`- Generated ${txCount} transactions.`);
    console.log('--- BULK SEEDING FINISHED ---');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
