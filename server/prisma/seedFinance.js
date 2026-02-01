import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding Finance Data...');
    // 1. Get a valid user (Superadmin)
    const superadmin = await prisma.user.findFirst({
        where: {
            OR: [
                { username: 'superadmin' },
                { role: 'SUPERADMIN' }
            ]
        }
    });
    if (!superadmin) {
        console.error("Superadmin user not found. Please run main seed first.");
        return;
    }
    const userId = superadmin.id;
    console.log(`- Using User ID: ${userId} (${superadmin.username})`);
    // 2. Create Categories
    const categoriesData = [
        'Listrik',
        'Air',
        'Gaji Pegawai',
        'Maintenance Sewa',
        'Beli Stok Plastik',
        'Operasional Harian',
        'Marketing',
        'Internet & Wifi',
        'Transportasi',
        'Pajak & Perizinan',
        'Renovasi Kecil'
    ];
    const categories = {};
    for (const name of [...categoriesData, 'Laundry']) {
        const cat = await prisma.expenseCategory.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        categories[name] = cat.id;
        console.log(`- Category ensured: ${name}`);
    }
    // 3. Create Dummy Expenses (Current Month & Last Month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    // Helper to random date in a specific month
    const randomDate = (year, month) => {
        const date = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        date.setDate(Math.floor(Math.random() * daysInMonth) + 1);
        return date;
    };
    const dummyExpenses = [
        { cat: 'Listrik', desc: 'Token Listrik Utama', amount: 550000 },
        { cat: 'Listrik', desc: 'Token Listrik Ruko Belakang', amount: 200000 },
        { cat: 'Air', desc: 'Tagihan PDAM', amount: 145000 },
        { cat: 'Gaji Pegawai', desc: 'Gaji Admin (Siti)', amount: 2500000 },
        { cat: 'Gaji Pegawai', desc: 'Gaji Staff Operasional (Budi)', amount: 2200000 },
        { cat: 'Operasional Harian', desc: 'Beli ATK (Kertas, Pulpen)', amount: 85000 },
        { cat: 'Operasional Harian', desc: 'Konsumsi Rapat Mingguan', amount: 150000 },
        { cat: 'Operasional Harian', desc: 'Beli Galon & Kopi', amount: 120000 },
        { cat: 'Maintenance Sewa', desc: 'Laundry Gorden (Vendor Luar)', amount: 250000 },
        { cat: 'Maintenance Sewa', desc: 'Service AC 3 Unit', amount: 450000 },
        { cat: 'Marketing', desc: 'Iklan Instagram Ads Campaign A', amount: 300000 },
        { cat: 'Marketing', desc: 'Cetak Brosur Promo', amount: 150000 },
        { cat: 'Beli Stok Plastik', desc: 'Restock Plastik Laundry Large', amount: 350000 },
        { cat: 'Internet & Wifi', desc: 'Tagihan Indihome', amount: 420000 },
        { cat: 'Transportasi', desc: 'Bensin Operasional Motor', amount: 50000 },
        { cat: 'Renovasi Kecil', desc: 'Ganti Lampu Teras', amount: 95000 },
    ];
    // Generate for This Month
    for (const item of dummyExpenses) {
        // Add random variance to amount
        const variance = 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
        const finalAmount = Math.round((item.amount * variance) / 1000) * 1000;
        await prisma.expense.create({
            data: {
                type: 'MANUAL',
                amount: finalAmount,
                description: `${item.desc} (Bulan Ini)`,
                date: randomDate(currentYear, currentMonth),
                categoryId: categories[item.cat] ?? null,
                createdById: userId
            }
        });
    }
    // Generate for Last Month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    for (const item of dummyExpenses) {
        // Reduce amount slightly for last month to show growth
        const amount = item.amount * (0.9 + Math.random() * 0.2);
        await prisma.expense.create({
            data: {
                type: 'MANUAL',
                amount: Math.round(amount / 1000) * 1000,
                description: `${item.desc} (Bulan Lalu)`,
                date: randomDate(lastMonthYear, lastMonth),
                categoryId: categories[item.cat] ?? null,
                createdById: userId
            }
        });
    }
    console.log('Finance Data seeded successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedFinance.js.map