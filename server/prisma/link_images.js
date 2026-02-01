import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Linking images to items...");
    const items = await prisma.item.findMany({
        include: { category: true }
    });
    const mapping = {
        'Jas': '/uploads/jas_1.png',
        'Kebaya': '/uploads/kebaya_1.png',
        'Gaun': '/uploads/gaun_1.png',
        'Batik': '/uploads/batik_1.png',
        'Seragam': '/uploads/seragam_1.png',
        'Kostum': '/uploads/adat_1.png',
        'Pakaian Adat': '/uploads/adat_1.png',
        'Rok': '/uploads/rok_1.png',
        'Kemeja': '/uploads/kemeja_1.png',
        'Aksesoris': '/uploads/aksesoris_1.png',
        'Celana': '/uploads/celana_1.png'
    };
    let count = 0;
    for (const item of items) {
        const catName = item.category.name;
        const imageUrl = mapping[catName];
        if (imageUrl) {
            const existing = await prisma.itemImage.findFirst({
                where: { itemId: item.id }
            });
            if (!existing) {
                await prisma.itemImage.create({
                    data: {
                        itemId: item.id,
                        url: imageUrl,
                        isPrimary: true
                    }
                });
                count++;
            }
            else {
                await prisma.itemImage.update({
                    where: { id: existing.id },
                    data: { url: imageUrl }
                });
                count++;
            }
        }
    }
    console.log(`Success! Linked/Updated ${count} images.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=link_images.js.map