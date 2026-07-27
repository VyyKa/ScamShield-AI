import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeConfidenceScore, riskLevelFromConfidence, suggestStatus } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const VOTE_TYPES = new Set(['CONFIRM', 'DISPUTE', 'UPVOTE']);

/**
 * POST /api/database/vote
 * body: { entityId, userId, type: CONFIRM|DISPUTE|UPVOTE, note? }
 *
 * Phase 1: userId bắt buộc (tạm demo — gắn auth sau).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entityId, userId, type, note } = body;

    if (!entityId || !userId || !type || !VOTE_TYPES.has(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cần entityId, userId và type ∈ CONFIRM | DISPUTE | UPVOTE',
        },
        { status: 400 }
      );
    }

    const entity = await prisma.scamRecord.findUnique({ where: { id: entityId } });
    if (!entity) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy entity' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBanned) {
      return NextResponse.json({ success: false, error: 'User không hợp lệ' }, { status: 403 });
    }

    await prisma.vote.upsert({
      where: {
        entityId_userId_type: { entityId, userId, type },
      },
      update: { note: note || null },
      create: {
        entityId,
        userId,
        type,
        note: note || null,
      },
    });

    const [confirmCount, disputeCount, upvotes] = await Promise.all([
      prisma.vote.count({ where: { entityId, type: 'CONFIRM' } }),
      prisma.vote.count({ where: { entityId, type: 'DISPUTE' } }),
      prisma.vote.count({ where: { entityId, type: 'UPVOTE' } }),
    ]);

    const scoreInput = {
      reportCount: entity.reportCount,
      confirmCount,
      disputeCount,
      status: entity.status,
    };
    const confidenceScore = computeConfidenceScore(scoreInput);
    const status = suggestStatus({ ...scoreInput, status: entity.status });
    const riskLevel = riskLevelFromConfidence(confidenceScore, status);

    const updated = await prisma.scamRecord.update({
      where: { id: entityId },
      data: {
        confirmCount,
        disputeCount,
        upvotes,
        confidenceScore,
        status,
        riskLevel,
      },
    });

    return NextResponse.json({
      success: true,
      record: updated,
      message: `Đã ghi vote ${type}`,
    });
  } catch (error: any) {
    console.error('POST /api/database/vote', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
