
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@insurak.pl';
    const password = 'admin123';

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log(`User ${email} not found`);
        return;
    }

    console.log(`User found: ${user.email}`);
    console.log(`Stored hash: ${user.passwordHash}`);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password '${password}' is valid: ${isValid}`);

    // Test hash generation
    const newHash = await bcrypt.hash(password, 10);
    console.log(`New hash for '${password}': ${newHash}`);
    const isNewValid = await bcrypt.compare(password, newHash);
    console.log(`New hash verification: ${isNewValid}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
