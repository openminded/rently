import { PrismaClient, TransactionStatus, TransactionType, TransactionSource, ReferralDiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding commissions & Transactions History with Multiple Partners ---');

    // 1. Create Multiple Partners
    const partnersData = [
        { name: 'Mitra Bandung Raya', phone: '08123456701', email: 'bandung@mitra.com', code: 'BDG10', rate: 10 },
        { name: 'Mitra Jakarta Pusat', phone: '08123456702', email: 'jakarta@mitra.com', code: 'JKT05', rate: 5 },
        { name: 'Mitra Surabaya Juanda', phone: '08123456703', email: 'surabaya@mitra.com', code: 'SRB07', rate: 7.5 },
        { name: 'Mitra Bali Kuta', phone: '08123456704', email: 'bali@mitra.com', code: 'BALI15', rate: 15 },
        { name: 'Mitra Medan Deli', phone: '08123456705', email: 'medan@mitra.com', code: 'MDN08', rate: 8 }
    ];

    const partners = [];
    const codes = [];

    for (const data of partnersData) {
        let p = await prisma.referralPartner.findFirst({ where: { email: data.email } });
        if (!p) {
            p = await prisma.referralPartner.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    bankInfo: `BCA - 1234567890 - ${data.name}`
                }
            });
        }
        partners.push(p);

        let c = await prisma.referralCode.findFirst({ where: { code: data.code } });
        if (!c) {
            c = await prisma.referralCode.create({
                data: {
                    code: data.code,
                    partnerId: p.id,
                    discountType: ReferralDiscountType.PERCENTAGE,
                    discountValue: 10,
                    commissionRate: data.rate,
                    isActive: true
                }
            });
        }
        codes.push(c);
    }
    console.log(`Initialized ${partners.length} partners and codes.`);

    // 2. Ensure we have a Customer
    let customer = await prisma.customer.findFirst();
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                name: 'Budi Pembeli',
                phone: '0899999999',
                email: 'budi@pembeli.com'
            }
        });
    }

    // 3. Generate History for the last 6 months
    const now = new Date();

    for (let i = 0; i < 6; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

        // Total transactions this month across all partners
        const totalCount = Math.floor(Math.random() * 20) + 30;
        console.log(`Generating ${totalCount} transactions for ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}...`);

        for (let j = 0; j < totalCount; j++) {
            const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
            const txDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay);

            // Randomly pick a partner/code
            const activeCode = codes[Math.floor(Math.random() * codes.length)];
            if (!activeCode) continue;

            const totalAmount = (Math.floor(Math.random() * 50) + 10) * 10000; // 100k to 600k
            const commissionAmount = totalAmount * (activeCode.commissionRate / 100);

            const status = Math.random() > 0.4 ? 'PAID' : 'PENDING';
            const paidAt = status === 'PAID' ? txDate : null;

            // Create Transaction
            const tx = await prisma.transaction.create({
                data: {
                    type: TransactionType.IMMEDIATE,
                    source: TransactionSource.ONLINE,
                    customerId: customer.id,
                    bookingDate: txDate,
                    pickupDate: txDate,
                    returnPlanDate: new Date(txDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                    status: TransactionStatus.COMPLETED,
                    totalAmount: totalAmount,
                    paidAmount: totalAmount,
                    paymentStatus: 'PAID',
                    referralCodeId: activeCode.id,
                    createdAt: txDate
                }
            });

            // Create Commission Log
            await prisma.commissionLog.create({
                data: {
                    referralCodeId: activeCode.id,
                    transactionId: tx.id,
                    amount: commissionAmount,
                    status: status,
                    paidAt: paidAt,
                    createdAt: txDate
                }
            });
        }
    }

    console.log('--- Seeding Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
