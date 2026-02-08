
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Multi-Tenancy Migration...');

    // 1. Create Default Business
    // Check if any business exists
    const existingBusiness = await prisma.business.findFirst({
        where: { slug: 'default' }
    });

    let defaultBusinessId: number;

    if (existingBusiness) {
        console.log(`ℹ️ Default business already exists with ID: ${existingBusiness.id}`);
        defaultBusinessId = existingBusiness.id;
    } else {
        console.log('✨ Creating Default Business "Rumah Dinar"...');
        // Using explicit ID 1 if possible, or letting autoincrement handle it (usually 1 if empty)
        // We can't force ID in create typically unless enabled in DB, but autoincrement is fine.

        // Using a default owner? We need an owner.
        // Let's find the first user with SUPERADMIN or OWNER role.
        const owner = await prisma.user.findFirst({
            where: { role: { in: ['OWNER', 'SUPERADMIN'] } }
        });

        if (!owner) {
            console.error('❌ No OWNER or SUPERADMIN found to assign as Business Owner. Aborting.');
            process.exit(1);
        }

        const newBusiness = await prisma.business.create({
            data: {
                name: 'Rumah Dinar',
                slug: 'default', // or 'rumah-dinar'
                ownerId: owner.id,
                phone: '08123456789', // Placeholder
                address: 'Default Address'
            }
        });
        console.log(`✅ Default business created with ID: ${newBusiness.id}`);
        defaultBusinessId = newBusiness.id;
    }

    // 2. Assign Existing Data to Default Business
    // Helper to update table
    const updateTable = async (modelName: string, tableName: string) => {
        // @ts-ignore
        const count = await prisma[modelName].count({
            where: { businessId: null }
        });

        if (count > 0) {
            console.log(`Updating ${count} ${tableName} records...`);
            // @ts-ignore
            await prisma[modelName].updateMany({
                where: { businessId: null },
                data: { businessId: defaultBusinessId }
            });
            console.log(`✅ Updated ${tableName}.`);
        } else {
            console.log(`ℹ️ No ${tableName} orphan records found.`);
        }
    };

    await updateTable('user', 'Users');
    await updateTable('customer', 'Customers');
    await updateTable('category', 'Categories');
    await updateTable('brand', 'Brands');
    await updateTable('item', 'Items');
    // ItemImage, ItemVariant, ItemInstance don't have businessId (they inherit from Item)

    await updateTable('transaction', 'Transactions');
    await updateTable('payment', 'Payments');
    await updateTable('shift', 'Shifts');
    await updateTable('expense', 'Expenses');

    await updateTable('laundryPartner', 'LaundryPartners');
    await updateTable('laundryBatch', 'LaundryBatches');
    await updateTable('expenseCategory', 'ExpenseCategories');

    await updateTable('referralPartner', 'ReferralPartners');
    await updateTable('referralCode', 'ReferralCodes');

    await updateTable('broadcastTemplate', 'BroadcastTemplates');
    await updateTable('broadcast', 'Broadcasts');

    await updateTable('appSetting', 'AppSettings');
    await updateTable('violationType', 'ViolationTypes');
    await updateTable('paymentMethod', 'PaymentMethods');
    await updateTable('color', 'Colors');
    await updateTable('size', 'Sizes');

    console.log('🎉 Migration Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
