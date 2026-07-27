/**
 * Seed Postgres with demo users + verified scam entities + sample reports.
 * Requires: DATABASE_URL pointing at Postgres, schema pushed.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeTarget(category, raw) {
  const v = String(raw || '').trim();
  if (category === 'bank_account') return v.replace(/\D/g, '');
  if (category === 'phone_number' || category === 'zalo_account') {
    let d = v.replace(/\D/g, '');
    if (d.startsWith('0') && d.length >= 9) d = `84${d.slice(1)}`;
    return d;
  }
  if (category === 'phishing_website') {
    try {
      const u = /^https?:\/\//i.test(v) ? v : `http://${v}`;
      return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return v.toLowerCase();
    }
  }
  return v.toLowerCase();
}

const ENTITIES = [
  {
    id: 'scam-001',
    category: 'bank_account',
    targetValue: '19038888999901',
    ownerName: 'NGUYEN VAN GAMING',
    bankName: 'Techcombank',
    scamType: 'Bẫy Shipper COD Giả Mạo & Đơn 0đ',
    riskLevel: 'CRITICAL',
    status: 'VERIFIED',
    reportCount: 3,
    confirmCount: 2,
    confidenceScore: 88,
    description:
      'Tài khoản thường xuyên nhận tiền cọc shipper đơn Shopee COD 0đ. Nạn nhân chuyển 300k–500k rồi bị chặn.',
  },
  {
    id: 'scam-002',
    category: 'bank_account',
    targetValue: '0071000999888',
    ownerName: 'TRAN THI NHIEM VU',
    bankName: 'Vietcombank',
    scamType: 'Tuyển CTV xem video TikTok / Shopee',
    riskLevel: 'CRITICAL',
    status: 'VERIFIED',
    reportCount: 5,
    confirmCount: 4,
    confidenceScore: 92,
    description:
      'Dụ nạp tiền làm nhiệm vụ VIP. Cho rút nhỏ rồi khóa tài khoản.',
  },
  {
    id: 'scam-003',
    category: 'phone_number',
    targetValue: '0987123456',
    ownerName: 'Giả danh VKS',
    bankName: null,
    scamType: 'Giả danh công an / khấu trừ rửa tiền',
    riskLevel: 'HIGH',
    status: 'VERIFIED',
    reportCount: 2,
    confirmCount: 1,
    confidenceScore: 72,
    description: 'Gọi đe dọa rửa tiền, ép đọc OTP ngân hàng.',
  },
  {
    id: 'scam-004',
    category: 'phishing_website',
    targetValue: 'vietcombank-xacminh-khancap.online',
    ownerName: null,
    bankName: null,
    scamType: 'Website phishing OTP ngân hàng',
    riskLevel: 'CRITICAL',
    status: 'VERIFIED',
    reportCount: 4,
    confirmCount: 3,
    confidenceScore: 95,
    description: 'Giả giao diện iB@nking Vietcombank, đánh cắp OTP.',
  },
  {
    id: 'scam-005',
    category: 'zalo_account',
    targetValue: '0912345678',
    ownerName: 'Zalo Shop KM',
    bankName: null,
    scamType: 'Bán vé máy bay / KS giảm 70%',
    riskLevel: 'HIGH',
    status: 'UNDER_REVIEW',
    reportCount: 1,
    confirmCount: 0,
    confidenceScore: 35,
    description: 'Vé siêu rẻ, đòi cọc 100% rồi thu hồi tin nhắn.',
  },
];

async function main() {
  console.log('Seeding ScamShield Postgres…');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scamshield.local' },
    update: { role: 'ADMIN', displayName: 'System Admin', reputation: 100 },
    create: {
      email: 'admin@scamshield.local',
      displayName: 'System Admin',
      role: 'ADMIN',
      reputation: 100,
    },
  });

  const mod = await prisma.user.upsert({
    where: { email: 'mod@scamshield.local' },
    update: { role: 'MODERATOR', displayName: 'Moderator', reputation: 50 },
    create: {
      email: 'mod@scamshield.local',
      displayName: 'Moderator',
      role: 'MODERATOR',
      reputation: 50,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@scamshield.local' },
    update: { displayName: 'Demo User', reputation: 10 },
    create: {
      email: 'user@scamshield.local',
      displayName: 'Demo User',
      role: 'USER',
      reputation: 10,
    },
  });

  for (const item of ENTITIES) {
    const targetNormalized = normalizeTarget(item.category, item.targetValue);
    const entity = await prisma.scamRecord.upsert({
      where: { id: item.id },
      update: {
        category: item.category,
        targetValue: item.targetValue,
        targetNormalized,
        ownerName: item.ownerName,
        bankName: item.bankName,
        scamType: item.scamType,
        riskLevel: item.riskLevel,
        status: item.status,
        reportCount: item.reportCount,
        confirmCount: item.confirmCount,
        confidenceScore: item.confidenceScore,
        description: item.description,
        lastReported: 'Seed',
        lastReportedAt: new Date(),
      },
      create: {
        id: item.id,
        category: item.category,
        targetValue: item.targetValue,
        targetNormalized,
        ownerName: item.ownerName,
        bankName: item.bankName,
        scamType: item.scamType,
        riskLevel: item.riskLevel,
        status: item.status,
        reportCount: item.reportCount,
        confirmCount: item.confirmCount,
        confidenceScore: item.confidenceScore,
        description: item.description,
        lastReported: 'Seed',
      },
    });

    // Sample report if none
    const existingReports = await prisma.report.count({ where: { entityId: entity.id } });
    if (existingReports === 0) {
      await prisma.report.create({
        data: {
          entityId: entity.id,
          reporterId: demoUser.id,
          scamType: item.scamType,
          description: item.description,
          status: item.status === 'VERIFIED' ? 'ACCEPTED' : 'PENDING',
        },
      });
    }

    if (item.status === 'VERIFIED') {
      const modCount = await prisma.moderationEvent.count({
        where: { entityId: entity.id, action: 'VERIFY' },
      });
      if (modCount === 0) {
        await prisma.moderationEvent.create({
          data: {
            entityId: entity.id,
            moderatorId: mod.id,
            action: 'VERIFY',
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'VERIFIED',
            note: 'Seed verification',
          },
        });
      }
    }
  }

  // Demo confirm vote
  await prisma.vote.upsert({
    where: {
      entityId_userId_type: {
        entityId: 'scam-001',
        userId: demoUser.id,
        type: 'CONFIRM',
      },
    },
    update: {},
    create: {
      entityId: 'scam-001',
      userId: demoUser.id,
      type: 'CONFIRM',
      note: 'Đã gặp chiêu này',
    },
  });

  console.log('✅ Seed OK');
  console.log(`   Admin: ${admin.email} | Mod: ${mod.email} | User: ${demoUser.email}`);
  console.log(`   Entities: ${ENTITIES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
