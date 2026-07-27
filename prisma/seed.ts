import { PrismaClient } from '@prisma/client';
import { INITIAL_SCAM_DATABASE } from '../src/lib/mockDatabase';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database with initial scam records...');

  for (const item of INITIAL_SCAM_DATABASE) {
    await prisma.scamRecord.upsert({
      where: { id: item.id },
      update: {
        category: item.category,
        targetValue: item.targetValue,
        targetNormalized: item.targetValue.replace(/\s+/g, '').toLowerCase(),
        ownerName: item.ownerName || null,
        bankName: item.bankName || null,
        scamType: item.scamType,
        riskLevel: item.riskLevel,
        reportCount: item.reportCount,
        lastReported: item.lastReported,
        description: item.description,
        status: item.status,
      },
      create: {
        id: item.id,
        category: item.category,
        targetValue: item.targetValue,
        targetNormalized: item.targetValue.replace(/\s+/g, '').toLowerCase(),
        ownerName: item.ownerName || null,
        bankName: item.bankName || null,
        scamType: item.scamType,
        riskLevel: item.riskLevel,
        reportCount: item.reportCount,
        lastReported: item.lastReported,
        description: item.description,
        status: item.status,
      },
    });
  }

  console.log('✅ SQLite database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
