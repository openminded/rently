import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('123456', 10);

    const users = [
        { username: 'superadmin', role: Role.SUPERADMIN, name: 'Super Admin' },
        { username: 'owner', role: Role.OWNER, name: 'Business Owner' },
        { username: 'supervisor', role: Role.SUPERVISOR, name: 'Supervisor' },
        { username: 'kasir', role: Role.KASIR, name: 'Cashier 1' },
        { username: 'kasir2', role: Role.KASIR, name: 'Cashier 2' },
    ];

    for (const u of users) {
        const upsertUser = await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                password,
                role: u.role,
                name: u.name,
            },
        });
        console.log({ upsertUser });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
