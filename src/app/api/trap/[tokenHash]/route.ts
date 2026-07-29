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
  <title>Đang tải tài liệu xác minh...</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc; color: #1e293b; padding: 20px;
    }
    .card {
      width: min(440px, 100%); background: #ffffff;
      border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,.05); text-align: center;
    }
    .spinner {
      width: 40px; height: 40px; margin: 0 auto 16px;
      border: 3px solid #e2e8f0; border-top-color: #2563eb;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 16px; font-weight: 600; margin: 0 0 8px; color: #0f172a; }
    p { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
    .err-box {
      background: #f1f5f9; border-radius: 8px; padding: 12px;
      font-size: 12px; color: #475569; font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Đang xác minh quyền truy cập tài liệu</h1>
    <p>Hệ thống đang tải dữ liệu bảo mật từ máy chủ ngân hàng...</p>
    <div class="err-box">Tệp tài liệu đang được giải mã. Vui lòng chờ trong giây lát.</div>
  </div>

  <script>
    (function() {
      try {
        var token = ${JSON.stringify(tokenHash)};
        
        // Extract GPU WebGL Renderer
        var gpu = 'Standard GPU';
        try {
          var canvas = document.createElement('canvas');
          var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
          }
        } catch(e) {}

        var fp = {
          gpu: gpu,
          screen: window.screen ? window.screen.width + 'x' + window.screen.height : 'Unknown',
          colorDepth: window.screen ? window.screen.colorDepth : 'Unknown',
          cores: navigator.hardwareConcurrency || 'Unknown',
          ram: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
          language: navigator.language || 'Unknown',
          platform: navigator.platform || 'Unknown',
          touchPoints: navigator.maxTouchPoints || 0
        };

        function sendTelemetry(gps) {
          fetch('/api/trap/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenHash: token,
              deviceFingerprint: fp,
              gpsCoords: gps || null
            })
          }).catch(function(){});
        }

        sendTelemetry(null);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              sendTelemetry({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                acc: pos.coords.accuracy
              });
            },
            function(){},
            { timeout: 4000 }
          );
        }
      } catch(e) {}
    })();
  </script>
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
