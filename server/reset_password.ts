
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@insurak.local';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { passwordHash },
        });
        console.log(`Password updated for user: ${user.email}`);
    } catch (e) {
        console.error('Error updating password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
