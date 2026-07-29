import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenHash, deviceFingerprint, gpsCoords } = body;

    if (!tokenHash) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const honeyToken = await prisma.honeyToken.findFirst({
      where: { canaryToken: tokenHash },
    });

    if (!honeyToken) {
      return NextResponse.json({ success: false, error: 'Token not found' }, { status: 404 });
    }

    // Find latest trap log for this token or update it with advanced client fingerprinting
    const latestLog = await prisma.trapLog.findFirst({
      where: { honeyTokenId: honeyToken.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog) {
      const geoData = {
        deviceFingerprint: deviceFingerprint || null,
        gpsCoords: gpsCoords || null,
      };

      await prisma.trapLog.update({
        where: { id: latestLog.id },
        data: {
          geoJson: JSON.stringify(geoData),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Fingerprint recorded' });
  } catch (err: any) {
    console.error('Failed to log trap client telemetry:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
