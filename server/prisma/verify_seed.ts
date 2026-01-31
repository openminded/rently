import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying data...');

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    const customerCount = await prisma.customer.count();
    console.log(`Customers: ${customerCount}`);

    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount}`);

    const brandCount = await prisma.brand.count();
    console.log(`Brands: ${brandCount}`);

    const itemCount = await prisma.item.count();
    console.log(`Items: ${itemCount}`);

    const variantCount = await prisma.itemVariant.count();
    console.log(`ItemVariants: ${variantCount}`);

    const instanceCount = await prisma.itemInstance.count();
    console.log(`ItemInstances: ${instanceCount}`);

    const partnerCount = await prisma.laundryPartner.count();
    console.log(`LaundryPartners: ${partnerCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
