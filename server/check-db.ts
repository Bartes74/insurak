
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database content...');
    const assets = await prisma.asset.findMany({
        include: { policies: true }
    });
    console.log(`Found ${assets.length} assets.`);
    if (assets.length > 0) {
        console.log('First 3 assets:', JSON.stringify(assets.slice(0, 3), null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
