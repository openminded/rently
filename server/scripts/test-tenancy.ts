
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Multi-Tenant Isolation Test...");

    try {
        // 1. Create Business A
        const businessA = await prisma.business.create({
            data: {
                name: "Business A",
                slug: "business-a-" + Date.now(),
                ownerId: 1 // Assuming user 1 exists, or we need to create users too
            }
        });
        console.log(`Created Business A: ${businessA.id}`);

        // 2. Create Business B
        const businessB = await prisma.business.create({
            data: {
                name: "Business B",
                slug: "business-b-" + Date.now(),
                ownerId: 1 // Same owner for simplicity, but different business context
            }
        });
        console.log(`Created Business B: ${businessB.id}`);

        // 3. Create Item for Business A
        const categoryA = await prisma.category.create({
            data: { name: "Cat A", businessId: businessA.id }
        });
        const brandA = await prisma.brand.create({
            data: { name: "Brand A", businessId: businessA.id }
        });
        const itemA = await prisma.item.create({
            data: {
                name: "Item A",
                businessId: businessA.id,
                categoryId: categoryA.id,
                brandId: brandA.id,
                rentalPrice: 10000
            }
        });
        console.log(`Created Item A (${itemA.id}) for Business A`);

        // 4. Verify Business B cannot see Item A
        // Simulating controller logic: findMany({ where: { businessId: businessB.id } })
        const itemsForB = await prisma.item.findMany({
            where: { businessId: businessB.id }
        });

        if (itemsForB.length === 0) {
            console.log("PASS: Business B sees 0 items.");
        } else {
            console.error("FAIL: Business B saw items:", itemsForB);
        }

        // 5. Verify Business A sees Item A
        const itemsForA = await prisma.item.findMany({
            where: { businessId: businessA.id }
        });

        if (itemsForA.length === 1 && itemsForA[0].id === itemA.id) {
            console.log("PASS: Business A sees its item.");
        } else {
            console.error("FAIL: Business A failed to see its item.");
        }

        // Clean up
        await prisma.item.delete({ where: { id: itemA.id } });
        await prisma.category.delete({ where: { id: categoryA.id } });
        await prisma.brand.delete({ where: { id: brandA.id } });
        await prisma.business.delete({ where: { id: businessA.id } });
        await prisma.business.delete({ where: { id: businessB.id } });

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
