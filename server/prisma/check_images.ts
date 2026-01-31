import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking items without images...");

    const itemsWithoutImages = await prisma.item.findMany({
        where: {
            images: {
                none: {}
            }
        },
        include: {
            category: true
        }
    });

    console.log(`Total items: ${await prisma.item.count()}`);
    console.log(`Items without images: ${itemsWithoutImages.length}`);

    if (itemsWithoutImages.length > 0) {
        const categoriesMap: Record<string, number> = {};
        itemsWithoutImages.forEach(i => {
            const cat = i.category.name;
            categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
        });

        console.log("Categories missing images (count):");
        console.log(JSON.stringify(categoriesMap, null, 2));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
