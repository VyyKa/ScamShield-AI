import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lookupIpGeo } from '@/lib/onlineApis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { tokenHash: string } }) {
  const tokenHash = params.tokenHash;
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown Browser';
  const referer = req.headers.get('referer') || 'Direct Link / Document Open';

  // Online IP geolocation (ip-api.com)
  const geo = await lookupIpGeo(ipAddress);
  const locationLabel = geo.label || 'Unknown location';

  console.log(`[CANARY TRAP] Token=${tokenHash} IP=${ipAddress} Geo=${locationLabel}`);

  let honeyToken = null;
  try {
    honeyToken = await prisma.honeyToken.findFirst({
      where: { canaryToken: tokenHash },
    });

    if (!honeyToken) {
      honeyToken = await prisma.honeyToken.create({
        data: {
          type: 'CCCD / ID Card (Hình ảnh)',
          targetName: 'CANARY TRAP TARGET',
          canaryToken: tokenHash,
          ipTrapUrl: req.url,
          triggeredCount: 1,
        },
      });
    } else {
      await prisma.honeyToken.update({
        where: { id: honeyToken.id },
        data: { triggeredCount: honeyToken.triggeredCount + 1 },
      });
    }

    await prisma.trapLog.create({
      data: {
        honeyTokenId: honeyToken.id,
        ipAddress,
        location: locationLabel,
        userAgent,
        referer,
      },
    });

    await prisma.systemLog.create({
      data: {
        level: 'WARN',
        module: 'HONEY',
        message: `HONEY-TOKEN TRIGGERED token=${tokenHash} ip=${ipAddress} geo=${locationLabel}`,
      },
    });
  } catch (err) {
    console.error('Failed to log trap hit:', err);
  }

  const payload = {
    status: 'TRAP_TRIGGERED',
    tokenHash,
    loggedData: {
      ipAddress,
      location: locationLabel,
      country: geo.country,
      city: geo.city,
      isp: geo.isp,
      userAgent,
      referer,
      timestamp: new Date().toISOString(),
      geoSource: 'ip-api.com',
    },
    message: 'Cảnh báo: IP & thiết bị đã được ghi nhận khi mở honey-token.',
  };

  const acceptHeader = req.headers.get('accept') || '';
  if (acceptHeader.includes('application/json')) {
    return NextResponse.json(payload);
  }

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Canary Trap · ScamShield</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Inter, system-ui, sans-serif;
      background: radial-gradient(ellipse at top, #1a1020 0%, #070b14 60%);
      color: #f1f5f9; padding: 20px;
    }
    .card {
      width: min(520px, 100%);
      background: rgba(18,26,43,.92);
      border: 1px solid rgba(248,113,113,.35);
      border-radius: 20px; padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,.45);
    }
    .badge {
      display: inline-flex; gap: 8px; align-items: center;
      font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
      color: #fca5a5; background: rgba(248,113,113,.12);
      border: 1px solid rgba(248,113,113,.3); border-radius: 999px; padding: 6px 12px;
    }
    h1 { font-size: 1.25rem; margin: 16px 0 8px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .log {
      margin: 18px 0; padding: 14px 16px; border-radius: 14px;
      background: #05080f; border: 1px solid rgba(255,255,255,.08);
      font-family: ui-monospace, monospace; font-size: 12px; color: #34d399;
    }
    .log div { margin: 4px 0; }
    .ip { color: #f87171; font-weight: 700; }
    .foot { text-align: center; font-size: 11px; color: #64748b; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Honey-token canary trap</span>
    <h1>Bẫy an ninh đã kích hoạt</h1>
    <p>Tài liệu / liên kết bạn vừa mở chứa mã định vị của ScamShield. Địa chỉ IP và dấu vết thiết bị đã được ghi nhận.</p>
    <div class="log">
      <div>IP: <span class="ip">${escapeHtml(ipAddress)}</span></div>
      <div style="color:#94a3b8">Vị trí: ${escapeHtml(locationLabel)}</div>
      <div style="color:#94a3b8">Token: ${escapeHtml(tokenHash)}</div>
      <div style="color:#94a3b8">UA: ${escapeHtml(userAgent.slice(0, 72))}</div>
      <div style="color:#94a3b8">Thời gian: ${new Date().toLocaleString('vi-VN')}</div>
      <div style="color:#64748b">Geo: ip-api.com</div>
    </div>
    <p style="color:#fca5a5;font-size:13px">Nếu bạn không phải chủ sở hữu tài liệu, hãy dừng thao tác và đóng trang này.</p>
    <div class="foot">© ScamShield AI · VietGuard</div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
