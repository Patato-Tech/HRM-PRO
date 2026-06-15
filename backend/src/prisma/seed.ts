import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.platformAdmin.upsert({
        where: { email: 'admin@hrmpro.com' },
        update: {},
        create: {
            name: 'Platform Admin',
            email: 'admin@hrmpro.com',
            passwordHash: hashedPassword,
            role: 'PLATFORM_ADMIN',
        },
    });

    console.log('✅ Platform Admin created:', admin.email);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
