import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    const password = await bcrypt.hash('zzzz', 10);
    const users = [
        { username: 'superadmin', name: 'Super Admin', role: Role.SUPERADMIN },
        { username: 'owner', name: 'Business Owner', role: Role.OWNER },
        { username: 'supervisor', name: 'Store Supervisor', role: Role.SUPERVISOR },
        { username: 'kasir', name: 'Kasir Staff', role: Role.KASIR },
    ];
    console.log('Seeding users...');
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {
                password: password,
                role: u.role,
                name: u.name
            },
            create: {
                username: u.username,
                password: password,
                role: u.role,
                name: u.name
            }
        });
        console.log(`User ${user.username} created/updated with role ${user.role}`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedUsers.js.map