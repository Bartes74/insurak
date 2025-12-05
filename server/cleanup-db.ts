
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up bad import data...');
    const { count } = await prisma.asset.deleteMany({
        where: {
            name: 'Nieznany',
            identifier: { startsWith: 'ROW-' }
        }
    });
    console.log(`Deleted ${count} bad assets.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
