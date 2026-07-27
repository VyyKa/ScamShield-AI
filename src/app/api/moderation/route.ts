import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeConfidenceScore, riskLevelFromConfidence } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set(['VERIFY', 'UNVERIFY', 'DISPUTE', 'ARCHIVE', 'REOPEN']);

/**
 * POST /api/moderation
 * body: { entityId, moderatorId, action, note? }
 *
 * Phase 1: kiểm tra role MODERATOR|ADMIN trong DB (chưa gắn session auth).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entityId, moderatorId, action, note } = body;

    if (!entityId || !moderatorId || !action || !ACTIONS.has(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cần entityId, moderatorId, action ∈ VERIFY|UNVERIFY|DISPUTE|ARCHIVE|REOPEN',
        },
        { status: 400 }
      );
    }

    const mod = await prisma.user.findUnique({ where: { id: moderatorId } });
    if (!mod || !['MODERATOR', 'ADMIN'].includes(mod.role) || mod.isBanned) {
      return NextResponse.json({ success: false, error: 'Không có quyền moderation' }, { status: 403 });
    }

    const entity = await prisma.scamRecord.findUnique({ where: { id: entityId } });
    if (!entity) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy entity' }, { status: 404 });
    }

    const fromStatus = entity.status;
    let toStatus = fromStatus;

    switch (action) {
      case 'VERIFY':
        toStatus = 'VERIFIED';
        break;
      case 'UNVERIFY':
      case 'REOPEN':
        toStatus = 'UNDER_REVIEW';
        break;
      case 'DISPUTE':
        toStatus = 'DISPUTED';
        break;
      case 'ARCHIVE':
        toStatus = 'ARCHIVED';
        break;
    }

    const confidenceScore = computeConfidenceScore({
      reportCount: entity.reportCount,
      confirmCount: entity.confirmCount,
      disputeCount: entity.disputeCount,
      status: toStatus,
    });
    const riskLevel = riskLevelFromConfidence(confidenceScore, toStatus);

    const updated = await prisma.scamRecord.update({
      where: { id: entityId },
      data: {
        status: toStatus,
        confidenceScore,
        riskLevel,
      },
    });

    await prisma.moderationEvent.create({
      data: {
        entityId,
        moderatorId,
        action,
        fromStatus,
        toStatus,
        note: note || '',
      },
    });

    await prisma.systemLog.create({
      data: {
        level: 'WARN',
        module: 'MODERATION',
        message: `${action} entity=${entityId} by=${mod.email || moderatorId} ${fromStatus}→${toStatus}`,
      },
    });

    return NextResponse.json({
      success: true,
      record: updated,
      message: `${action}: ${fromStatus} → ${toStatus}`,
    });
  } catch (error: any) {
    console.error('POST /api/moderation', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** GET /api/moderation?entityId= — lịch sử duyệt */
export async function GET(req: NextRequest) {
  try {
    const entityId = new URL(req.url).searchParams.get('entityId');
    if (!entityId) {
      return NextResponse.json({ success: false, error: 'Cần entityId' }, { status: 400 });
    }

    const events = await prisma.moderationEvent.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        moderator: { select: { id: true, email: true, displayName: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
