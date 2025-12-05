
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up records with bad dates (1970)...');
    // Find policies with startDate < 2000-01-01
    const badPolicies = await prisma.policy.findMany({
        where: {
            startDate: { lt: new Date('2000-01-01') }
        },
        select: { assetId: true }
    });

    const assetIds = badPolicies.map(p => p.assetId);
    if (assetIds.length > 0) {
        const { count } = await prisma.asset.deleteMany({
            where: { id: { in: assetIds } }
        });
        console.log(`Deleted ${count} assets with invalid dates.`);
    } else {
        console.log('No bad records found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
