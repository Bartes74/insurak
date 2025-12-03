import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insurak.pl' },
    update: {},
    create: {
      email: 'admin@insurak.pl',
      passwordHash,
      role: 'ADMIN',
      canEdit: true,
    },
  });
  console.log(`Created user: ${admin.email}`);

  // 2. Assets & Policies (Mock Data mirroring frontend)
  
  // Asset 1: KIA Sorento
  const kia = await prisma.asset.create({
    data: {
      name: 'KIA Sorento',
      type: 'VEHICLE',
      identifier: 'KR 55522',
      responsiblePerson: 'Jan Kowalski',
      notes: 'Pamiętać o przeglądzie technicznym w marcu.',
      policies: {
        create: {
          policyNumber: 'POL-2025-1',
          insurer: 'PZU',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-05-01'), // +120 days
          premiumAmount: 1200,
          sumInsured: 150000,
          status: 'ACTIVE',
          leasingRef: 'L-998877',
          insured: 'Insurak Sp. z o.o.',
          comments: 'Samochód w ciągłej eksploatacji.',
        }
      }
    },
  });

  // Asset 2: Caterpillar 320
  const cat = await prisma.asset.create({
    data: {
      name: 'Caterpillar 320',
      type: 'MACHINE',
      identifier: 'CAT-320-X99',
      responsiblePerson: 'Budowa A4',
      notes: 'Weryfikacja stawek przed odnowieniem.',
      policies: {
        create: {
          policyNumber: 'POL-2025-2',
          insurer: 'Warta',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2023-12-15'), // Expired
          premiumAmount: 4500,
          sumInsured: 450000,
          status: 'EXPIRING', // Logic might override this but good for seed
        }
      }
    },
  });

  console.log(`Created assets: ${kia.name}, ${cat.name}`);
  
  // 3. Default Settings
  const defaultSettings = [
      { key: 'firstAlertDays', value: '30' },
      { key: 'followUpDays', value: '7' },
      { key: 'globalRecipients', value: 'biuro@insurak.pl' }
  ];

  for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {},
          create: setting
      });
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