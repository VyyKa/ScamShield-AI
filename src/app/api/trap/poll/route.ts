import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenHash = searchParams.get('token');

    if (!tokenHash) {
      return NextResponse.json({ success: false, error: 'Thiếu token' }, { status: 400 });
    }

    const honeyToken = await prisma.honeyToken.findFirst({
      where: { canaryToken: tokenHash },
      include: {
        trapLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!honeyToken) {
      return NextResponse.json({ success: false, error: 'Token không tồn tại' }, { status: 404 });
    }

    const latestLog = honeyToken.trapLogs[0] || null;

    return NextResponse.json({
      success: true,
      token: honeyToken.canaryToken,
      triggeredCount: honeyToken.triggeredCount,
      latestLog,
      history: honeyToken.trapLogs,
    });
  } catch (err: any) {
    console.error('Trap Poll Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
