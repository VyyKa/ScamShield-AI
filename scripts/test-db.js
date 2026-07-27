const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const query = '19038888';
  const results = await p.scamRecord.findMany({
    where: {
      OR: [
        { targetValue: { contains: query } },
        { ownerName: { contains: query } },
        { bankName: { contains: query } },
        { scamType: { contains: query } },
        { description: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('count', results.length);
  console.log(results.map((r) => r.targetValue));
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
