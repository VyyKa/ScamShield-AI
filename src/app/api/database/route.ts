import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  checkSafeBrowsing,
  checkUrlhaus,
  checkUrlscan,
  extractDomain,
  resolveDomainDns,
} from '@/lib/onlineApis';
import { formatLastReported, isValidCategory, normalizeTargetValue } from '@/lib/normalize';
import {
  computeConfidenceScore,
  riskLevelFromConfidence,
  suggestStatus,
} from '@/lib/scoring';

import { checkRateLimit, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

function mapEntityForClient(row: any) {
  return {
    id: row.id,
    category: row.category,
    targetValue: row.targetValue,
    targetNormalized: row.targetNormalized,
    ownerName: row.ownerName ?? undefined,
    bankName: row.bankName ?? undefined,
    scamType: row.scamType,
    riskLevel: row.riskLevel,
    reportCount: row.reportCount,
    confirmCount: row.confirmCount,
    disputeCount: row.disputeCount,
    confidenceScore: row.confidenceScore,
    lastReported: row.lastReported,
    lastReportedAt: row.lastReportedAt,
    description: row.description,
    status: row.status,
    // legacy UI alias
    statusLegacy:
      row.status === 'VERIFIED'
        ? 'VERIFIED_SCAM'
        : row.status === 'UNDER_REVIEW'
          ? 'UNDER_INVESTIGATION'
          : row.status,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const whereClause: any = {};

    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (query) {
      const normalizedGuess = normalizeTargetValue(
        category && category !== 'all' ? category : 'bank_account',
        query
      );
      whereClause.OR = [
        { targetValue: { contains: query, mode: 'insensitive' } },
        { targetNormalized: { contains: normalizedGuess } },
        { ownerName: { contains: query, mode: 'insensitive' } },
        { bankName: { contains: query, mode: 'insensitive' } },
        { scamType: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const results = await prisma.scamRecord.findMany({
      where: whereClause,
      orderBy: [{ confidenceScore: 'desc' }, { lastReportedAt: 'desc' }],
      take: 100,
    });

    const totalRecords = await prisma.scamRecord.count();

    let onlineIntel: any = null;
    if (query && (query.includes('.') || query.startsWith('http'))) {
      try {
        const domain = extractDomain(query) || query;
        const url = query.startsWith('http') ? query : `http://${domain}`;
        const [urlhaus, dns, urlscan, safeBrowsing] = await Promise.all([
          checkUrlhaus(url),
          resolveDomainDns(domain),
          checkUrlscan(domain),
          checkSafeBrowsing(url),
        ]);
        onlineIntel = {
          query,
          domain,
          urlhaus,
          dns,
          urlscan,
          safeBrowsing,
          sources: ['urlhaus.abuse.ch', 'dns.google', 'urlscan.io', 'safebrowsing.googleapis.com'],
        };
      } catch (e) {
        console.warn('Online intel for database query failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      totalRecords,
      results: results.map(mapEntityForClient),
      onlineIntel,
      storageEngine: 'PostgreSQL + Prisma',
    });
  } catch (error: any) {
    console.error('API /api/database GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, { limit: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Tần suất gửi báo cáo quá nhanh! Vui lòng đợi 1 phút.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const targetValue = sanitizeText(body.targetValue, 250);
    const scamType = sanitizeText(body.scamType, 200);
    const ownerName = sanitizeText(body.ownerName, 100);
    const bankName = sanitizeText(body.bankName, 100);
    const description = sanitizeText(body.description, 2000);
    const category = body.category;
    const reporterId = body.reporterId;

    if (!targetValue || !scamType) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp số tài khoản/SĐT/tên miền và loại lừa đảo.' },
        { status: 400 }
      );
    }

    const cat = isValidCategory(category) ? category : 'bank_account';
    const targetNormalized = normalizeTargetValue(cat, targetValue);
    if (!targetNormalized) {
      return NextResponse.json({ success: false, error: 'Giá trị đối tượng không hợp lệ.' }, { status: 400 });
    }

    // External intel for websites
    let hasExternalThreatHit = false;
    let extraDesc = description?.trim() || 'Báo cáo từ cộng đồng ScamShield AI.';
    if (cat === 'phishing_website') {
      try {
        const url = String(targetValue).startsWith('http')
          ? String(targetValue)
          : `http://${targetNormalized}`;
        const [uh, sb] = await Promise.all([checkUrlhaus(url), checkSafeBrowsing(url)]);
        if (uh.listed || sb.listed) {
          hasExternalThreatHit = true;
          extraDesc += `\n[Intel] ${uh.listed ? uh.detail : ''} ${sb.listed ? sb.detail : ''}`.trim();
        }
      } catch {
        /* ignore */
      }
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    let existing = await prisma.scamRecord.findUnique({
      where: {
        category_targetNormalized: {
          category: cat,
          targetNormalized,
        },
      },
    });

    if (!existing) {
      // fallback soft match on raw value
      existing = await prisma.scamRecord.findFirst({
        where: { targetValue: targetValue.trim() },
      });
    }

    if (existing) {
      const reportCount = existing.reportCount + 1;
      const scoreInput = {
        reportCount,
        confirmCount: existing.confirmCount,
        disputeCount: existing.disputeCount,
        status: existing.status,
        hasExternalThreatHit,
      };
      const confidenceScore = computeConfidenceScore(scoreInput);
      const status = suggestStatus({ ...scoreInput, status: existing.status });
      const riskLevel = riskLevelFromConfidence(confidenceScore, status);
      const now = new Date();

      const updated = await prisma.scamRecord.update({
        where: { id: existing.id },
        data: {
          reportCount,
          confidenceScore,
          status,
          riskLevel,
          lastReported: formatLastReported(now),
          lastReportedAt: now,
          description: `${existing.description}\n[Cập nhật]: ${extraDesc}`,
          ownerName: ownerName?.trim() || existing.ownerName,
          bankName: bankName?.trim() || existing.bankName,
        },
      });

      await prisma.report.create({
        data: {
          entityId: updated.id,
          reporterId: reporterId || null,
          scamType: scamType.trim(),
          description: extraDesc,
          status: 'PENDING',
          reporterIpHash: clientIp ? Buffer.from(clientIp).toString('base64').slice(0, 32) : null,
          userAgent: req.headers.get('user-agent')?.slice(0, 300) || null,
        },
      });

      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          module: 'DATABASE',
          message: `Report++ entity=${updated.id} reports=${reportCount} confidence=${confidenceScore}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật lượt tố giác và ghi Report mới.',
        record: mapEntityForClient(updated),
      });
    }

    // Create new entity + first report
    const reportCount = 1;
    const scoreInput = {
      reportCount,
      confirmCount: 0,
      disputeCount: 0,
      status: 'UNDER_REVIEW',
      hasExternalThreatHit,
    };
    const confidenceScore = computeConfidenceScore(scoreInput);
    const status = suggestStatus(scoreInput);
    const riskLevel = riskLevelFromConfidence(confidenceScore, status);
    const now = new Date();

    const newRecord = await prisma.scamRecord.create({
      data: {
        category: cat,
        targetValue: targetValue.trim(),
        targetNormalized,
        ownerName: ownerName?.trim() || 'CHƯA RÕ TÊN',
        bankName: bankName?.trim() || 'N/A',
        scamType: scamType.trim(),
        riskLevel,
        reportCount,
        confidenceScore,
        lastReported: formatLastReported(now),
        lastReportedAt: now,
        firstReportedAt: now,
        description: extraDesc,
        status,
      },
    });

    await prisma.report.create({
      data: {
        entityId: newRecord.id,
        reporterId: reporterId || null,
        scamType: scamType.trim(),
        description: extraDesc,
        status: 'PENDING',
        reporterIpHash: clientIp ? Buffer.from(clientIp).toString('base64').slice(0, 32) : null,
        userAgent: req.headers.get('user-agent')?.slice(0, 300) || null,
      },
    });

    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'DATABASE',
        message: `New entity ${newRecord.id} ${cat}/${targetNormalized}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gửi báo cáo thành công. Entity UNDER_REVIEW cho đến khi được xác minh.',
      record: mapEntityForClient(newRecord),
    });
  } catch (error: any) {
    console.error('API /api/database POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi ghi dữ liệu.' },
      { status: 500 }
    );
  }
}
