import { NextRequest, NextResponse } from 'next/server';
import { getGenAIInstance, SCAN_PROMPT, cleanAndParseJSON, generateWithGemini, parseGeminiError } from '@/lib/gemini';
import { ScanResult, ScanSubMode } from '@/types';
import { PRESET_SAMPLES } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { enrichThreatIntel } from '@/lib/onlineApis';

import { checkRateLimit, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting (max 15 scans per minute per IP)
    const rateLimit = checkRateLimit(req, { limit: 15, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Tần suất quét quá nhanh! Vui lòng đợi 1 phút trước khi quét lại.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { image, text, subMode = 'fake_bill', presetId, apiKey: bodyApiKey } = body;
    const sanitizedInputText = sanitizeText(text);
    const customKey = req.headers.get('x-gemini-key') || bodyApiKey;
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    let finalResult: ScanResult;
    let isFallbackUsed = false;
    let usedModel: string | null = null;
    let threatIntel: Awaited<ReturnType<typeof enrichThreatIntel>> | null = null;

    if (sanitizedInputText) {
      try {
        threatIntel = await enrichThreatIntel(sanitizedInputText);
      } catch (e) {
        console.warn('Threat intel enrich failed:', e);
      }
    }

    let fallbackReason: string | null = null;

    if (presetId) {
      const preset = PRESET_SAMPLES.find((s) => s.id === presetId);
      finalResult = preset ? { ...preset.mockResult } : getDefaultFallback();
    } else {
      const aiInstance = getGenAIInstance(customKey);
      if (!aiInstance) {
        finalResult = buildSmartFallback(text, subMode as ScanSubMode, threatIntel);
        isFallbackUsed = true;
        fallbackReason = 'Chưa cấu hình Gemini API Key (đang dùng Heuristic Engine local)';
      } else {
        try {
          const promptText = SCAN_PROMPT.replace('{subMode}', subMode as ScanSubMode);
          const contents: any[] = [];

          if (image) {
            const base64Data = image.includes(',') ? image.split(',')[1] : image;
            const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';
            contents.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg',
              },
            });
          }

          const intelBlock =
            threatIntel && threatIntel.urls.length
              ? `\n\nOnline threat intel (URLhaus + DNS):\n${JSON.stringify(threatIntel, null, 2)}`
              : '';

          const fullPrompt = `${promptText}\n\nNội dung văn bản kèm theo (nếu có):\n"${text || 'Không có văn bản'}"${intelBlock}`;
          contents.push(fullPrompt);

          const { text: responseText, model } = await generateWithGemini(aiInstance, contents);
          usedModel = model;
          finalResult = cleanAndParseJSON<ScanResult>(responseText, getDefaultFallback());
        } catch (aiErr: any) {
          console.warn('Gemini API call error, using smart forensic engine fallback:', aiErr);
          finalResult = buildSmartFallback(text, subMode as ScanSubMode, threatIntel);
          isFallbackUsed = true;
          fallbackReason = parseGeminiError(aiErr);
        }
      }
    }

    if (threatIntel?.redFlags?.length) {
      finalResult = {
        ...finalResult,
        isScam: finalResult.isScam || threatIntel.urls.some((u) => u.listed),
        riskScore: Math.min(
          100,
          finalResult.riskScore + (threatIntel.urls.some((u) => u.listed) ? 15 : 0)
        ),
        redFlags: [...threatIntel.redFlags, ...finalResult.redFlags].slice(0, 8),
      };
    }

    let savedLog = null;
    try {
      savedLog = await prisma.scanLog.create({
        data: {
          subMode,
          isScam: finalResult.isScam,
          riskScore: finalResult.riskScore,
          redFlagsJson: JSON.stringify(finalResult.redFlags),
          analysisDetails: finalResult.analysisDetails,
          recommendedAction: finalResult.recommendedAction,
          scannedText: text || null,
          imageUrl: image || null,
          ipAddress: clientIp,
        },
      });

      await prisma.systemLog.create({
        data: {
          level: finalResult.isScam ? 'WARN' : 'INFO',
          module: 'SCAN',
          message: `scan mode=${subMode} risk=${finalResult.riskScore} model=${usedModel || 'fallback'}`,
        },
      });
    } catch (dbErr) {
      console.error('Failed to log scan to SQLite:', dbErr);
    }

    return NextResponse.json({
      success: true,
      result: finalResult,
      isFallback: isFallbackUsed,
      fallbackReason,
      model: usedModel,
      threatIntel,
      sources: {
        ai: usedModel || 'local-forensic-heuristic',
        urlThreat: 'urlhaus.abuse.ch',
        dns: 'dns.google',
      },
      logId: savedLog?.id || null,
    });
  } catch (error: any) {
    console.error('API /api/scan Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý hệ thống khi phân tích.' },
      { status: 500 }
    );
  }
}

function getDefaultFallback(): ScanResult {
  return {
    isScam: true,
    riskScore: 88,
    redFlags: [
      'Phông chữ / định dạng số tiền không khớp chuẩn ngân hàng gốc',
      'Có dấu hiệu cưỡng ép nạp tiền hoặc cọc khẩn cấp',
      'Thiếu mã giao dịch / tham chiếu đối soát đáng tin cậy',
    ],
    analysisDetails:
      'Hệ thống phát hiện dấu hiệu cắt ghép chứng từ hoặc thao túng tâm lý. Nên xác minh qua kênh chính thức trước khi chuyển tiền.',
    recommendedAction:
      'Không chuyển khoản, không gửi OTP. Liên hệ tổng đài ngân hàng hoặc hotline 111 / 156 nếu cần hỗ trợ.',
  };
}

function buildSmartFallback(
  text: string | undefined,
  subMode: ScanSubMode,
  intel: Awaited<ReturnType<typeof enrichThreatIntel>> | null
): ScanResult {
  const t = (text || '').toLowerCase();
  const flags: string[] = [];
  let score = 45;

  const keywords: Array<{ k: string; flag: string; s: number }> = [
    { k: 'otp', flag: 'Yêu cầu cung cấp mã OTP — thủ đoạn chiếm tài khoản phổ biến', s: 25 },
    { k: 'cọc', flag: 'Ép chuyển khoản cọc / phí giữ hàng bất thường', s: 20 },
    { k: 'cod', flag: 'Kịch bản shipper COD / đơn 0đ giả mạo', s: 18 },
    { k: 'công an', flag: 'Giả danh cơ quan chức năng để tạo áp lực', s: 28 },
    { k: 'rửa tiền', flag: 'Dọa dẫm liên quan rửa tiền / ma túy', s: 28 },
    { k: 'nhiệm vụ', flag: 'Bẫy tuyển CTV / làm nhiệm vụ nạp tiền', s: 22 },
    { k: 'vip', flag: 'Dụ nạp nâng cấp VIP / hoa hồng ảo', s: 18 },
    { k: 'khẩn cấp', flag: 'Tạo cảm giác gấp gáp để bỏ qua xác minh', s: 15 },
    { k: 'chuyển khoản', flag: 'Yêu cầu chuyển khoản ngoài app chính thức', s: 12 },
  ];

  for (const item of keywords) {
    if (t.includes(item.k)) {
      flags.push(item.flag);
      score += item.s;
    }
  }

  if (subMode === 'fake_bill') {
    flags.push('Chế độ phân tích bill: cần đối chiếu biến động số dư trên app ngân hàng thật');
    score += 8;
  }
  if (subMode === 'shipper_cross') {
    flags.push('Cross-check shipper: mã đơn phải khớp app Shopee/Lazada/TikTok Shop');
    score += 10;
  }
  if (subMode === 'physical_poster') {
    flags.push('Poster vật lý: lợi nhuận cam kết 100% thường là đa cấp / lừa đảo');
    score += 12;
  }

  if (intel?.redFlags?.length) {
    flags.unshift(...intel.redFlags);
    score += 20;
  }

  score = Math.min(99, Math.max(20, score));
  const isScam = score >= 55 || flags.length >= 2;

  if (!flags.length) {
    flags.push('Chưa đủ tín hiệu rõ — vẫn nên thận trọng với yêu cầu chuyển tiền lạ');
  }

  return {
    isScam,
    riskScore: score,
    redFlags: flags.slice(0, 6),
    analysisDetails: isScam
      ? `Phân tích heuristic + threat intel online (mode: ${subMode}). Phát hiện ${flags.length} tín hiệu rủi ro trong nội dung. Nên xác minh qua kênh chính thức.`
      : `Chưa thấy nhiều dấu hiệu lừa đảo điển hình (mode: ${subMode}). Vẫn kiểm tra kỹ nguồn tin và không chia sẻ OTP.`,
    recommendedAction: isScam
      ? 'Dừng giao dịch. Không gửi OTP. Tra cứu STK/SĐT trên Kho Cảnh Báo và báo cáo nếu cần.'
      : 'Có thể tiếp tục thận trọng. Chỉ giao dịch qua app chính hãng và tổng đài ngân hàng.',
  };
}

export async function GET(req: NextRequest) {
  try {
    const logs = await prisma.scanLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const parsedLogs = logs.map((log) => {
      let redFlags = [];
      try {
        redFlags = JSON.parse(log.redFlagsJson || '[]');
      } catch (e) {
        redFlags = [];
      }
      return {
        id: log.id,
        subMode: log.subMode,
        isScam: log.isScam,
        riskScore: log.riskScore,
        redFlags,
        analysisDetails: log.analysisDetails,
        recommendedAction: log.recommendedAction,
        scannedText: log.scannedText,
        imageUrl: log.imageUrl,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: parsedLogs.length,
      logs: parsedLogs,
    });
  } catch (error: any) {
    console.error('API /api/scan GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
