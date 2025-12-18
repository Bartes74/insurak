import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting full insurance data cleanup...');

    // Due to onDelete: Cascade in schema.prisma:
    // Deleting Assets will cascade to:
    // - Policies (which cascade to NotificationLog)
    // - NotificationRecipient (where assetId is set)

    const assetsCountStart = await prisma.asset.count();
    const policiesCountStart = await prisma.policy.count();
    console.log(`Current state: ${assetsCountStart} assets, ${policiesCountStart} policies.`);

    if (assetsCountStart === 0 && policiesCountStart === 0) {
        console.log('Database is already empty.');
        return;
    }

    // Delete all assets
    const { count: currentAssets } = await prisma.asset.deleteMany({});

    console.log(`Deleted ${currentAssets} assets.`);

    // Verify
    const assetsCountEnd = await prisma.asset.count();
    const policiesCountEnd = await prisma.policy.count();

    console.log(`Final state: ${assetsCountEnd} assets, ${policiesCountEnd} policies.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
