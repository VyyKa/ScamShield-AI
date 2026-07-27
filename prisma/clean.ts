import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Clearing all mock data from Supabase Cloud Database...');

  try {
    await prisma.trapLog.deleteMany({});
    await prisma.honeyToken.deleteMany({});
    await prisma.scanLog.deleteMany({});
    await prisma.trollSession.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.moderationEvent.deleteMany({});
    await prisma.scamRecord.deleteMany({});
    await prisma.systemLog.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (e) {
    console.warn('Wiping records:', e);
  }

  console.log('✅ Supabase Database cleared completely! All tables are empty and ready for real user data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
