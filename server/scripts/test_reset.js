import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// The fixed order from backupController.ts
const models = [
    'Fine', 'Payment', 'TransactionItem', 'Transaction',
    'Expense',
    'LaundryLog',
    'LaundryBatch',
    'LaundryPartner',
    'ItemInstance', 'ItemVariant', 'ItemImage', 'Item',
    'Customer', 'Category', 'Brand', 'Color', 'Size', 'PaymentMethod', 'ViolationType', 'AppSetting', 'User'
];
async function main() {
    console.log('Testing Reset Logic...');
    // 1. Create a User and an Expense to simulate the blocking condition
    console.log('Seeding prerequisite data (User + Expense)...');
    const user = await prisma.user.upsert({
        where: { username: 'test_reset_user' },
        update: {},
        create: {
            username: 'test_reset_user',
            password: 'password',
            name: 'Test Reset User',
            role: 'OWNER'
        }
    });
    await prisma.expense.create({
        data: {
            type: 'OTHER',
            amount: 1000,
            description: 'Test Expense Blocking User Deletion',
            createdById: user.id
        }
    });
    console.log('Created User and Expense.');
    // 2. Run Reset Logic
    console.log('Executing Reset Transaction...');
    try {
        await prisma.$transaction(async (tx) => {
            for (const modelName of models) {
                const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                // @ts-ignore
                if (tx[modelKey]) {
                    // @ts-ignore
                    const result = await tx[modelKey].deleteMany();
                    console.log(`Deleted ${modelName}: ${result.count}`);
                }
                else {
                    console.warn(`Model ${modelName} not found on prisma client!`);
                }
            }
        });
        console.log('✅ Reset Transaction Completed Successfully.');
    }
    catch (error) {
        console.error('❌ Reset Transaction FAILED:', error);
        process.exit(1);
    }
    // 3. Verify Empty
    const userCount = await prisma.user.count();
    const expenseCount = await prisma.expense.count();
    if (userCount === 0 && expenseCount === 0) {
        console.log('✅ Verification Passed: Tables are empty.');
    }
    else {
        console.error(`❌ Verification Failed: Users: ${userCount}, Expenses: ${expenseCount}`);
        process.exit(1);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test_reset.js.map