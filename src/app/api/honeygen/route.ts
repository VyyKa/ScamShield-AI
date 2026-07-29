import { NextRequest, NextResponse } from 'next/server';
import {
  getGenAIInstance,
  DEEPFAKE_CHALLENGE_PROMPT,
  cleanAndParseJSON,
  generateWithGemini,
} from '@/lib/gemini';
import { HoneyTokenData, DeepfakeChallengeResult } from '@/types';
import { prisma } from '@/lib/prisma';
import { shortenTrapUrl } from '@/lib/onlineApis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, name, amount, context, apiKey: bodyApiKey } = body;
    const customKey = req.headers.get('x-gemini-key') || bodyApiKey;
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';

    if (action === 'generate_token') {
      const randomId = Math.random().toString(36).substring(2, 9);
      const prefix = type?.toLowerCase().includes('cccd') ? 'doc_id' : 'vcb_receipt';
      const tokenHash = `${prefix}_${randomId}`;
      const ipTrapUrl = `${protocol}://${host}/api/trap/${tokenHash}`;
      const displayName = name || 'NGUYỄN VĂN MỒI BẪY';
      const docType = type || 'CCCD / ID Card';

      let shortUrl: string | null = null;
      try {
        shortUrl = await shortenTrapUrl(ipTrapUrl);
      } catch (e) {
        console.warn('Shortener API call error:', e);
      }

      let createdToken = null;
      try {
        createdToken = await prisma.honeyToken.create({
          data: {
            type: docType,
            targetName: displayName,
            canaryToken: tokenHash,
            ipTrapUrl,
          },
        });

        await prisma.systemLog.create({
          data: {
            level: 'INFO',
            module: 'HONEY',
            message: `Created honey token ${tokenHash}`,
          },
        });
      } catch (dbErr) {
        console.error('Failed to persist HoneyToken in SQLite:', dbErr);
      }

      const tokenData: HoneyTokenData & { shortUrl?: string | null } = {
        id: createdToken?.id || `ht-${Date.now()}`,
        type: docType,
        targetName: displayName,
        bankOrOrg: 'VIETCOMBANK (TRAP)',
        accountOrId: '9999-8888-7777-6666',
        amountOrPayload: amount || '50,000,000 VND',
        canaryToken: tokenHash,
        watermarkText: `SCAMSHIELD CANARY · ${tokenHash}`,
        createdAt: new Date().toISOString(),
        ipTrapUrl,
        shortUrl: shortUrl || null,
      };

      return NextResponse.json({
        success: true,
        token: tokenData,
        shortUrl: shortUrl || null,
      });
    }

    if (action === 'deepfake_challenge') {
      const fallbackResult: DeepfakeChallengeResult = {
        challenges: [
          'Thử thách 1 (Sinh học): Yêu cầu người gọi đưa bàn tay quẹt ngang qua khuôn mặt 3 lần. Deepfake thường glitch viền mặt.',
          'Thử thách 2 (Góc nghiêng): Yêu cầu quay mặt trái/phải 90°. AI face-swap hay vỡ hình ở góc nghiêng.',
          'Thử thách 3 (Bí mật gia đình): Hỏi chi tiết chỉ người thân biết (món ăn nhà, tên thú cưng, biệt danh cũ).',
        ],
        forensicTips: [
          'Quan sát mắt: deepfake thường đờ đẫn hoặc chớp bất thường.',
          'Nghe giọng: trễ nhịp môi–âm thanh (lip-sync desync).',
          'Ngắt video call và gọi lại bằng số di động thật (cellular).',
        ],
        riskAssessment:
          'CẢNH BÁO CAO: Cuộc gọi video khẩn cấp xin tiền có nguy cơ deepfake / giả danh rất cao.',
      };

      const aiInstance = getGenAIInstance(customKey);

      if (!aiInstance) {
        return NextResponse.json({ success: true, result: fallbackResult, isFallback: true });
      }

      try {
        const prompt = `${DEEPFAKE_CHALLENGE_PROMPT}\n\nNgữ cảnh cuộc gọi nghi vấn:\n"${context || 'Cuộc gọi video hỏi vay tiền gấp'}"`;
        const { text: responseText, model } = await generateWithGemini(aiInstance, prompt);
        const parsedResult = cleanAndParseJSON<DeepfakeChallengeResult>(responseText, fallbackResult);

        return NextResponse.json({
          success: true,
          result: parsedResult,
          model,
        });
      } catch (aiErr) {
        console.warn('Deepfake challenge Gemini call error, using fallback:', aiErr);
        return NextResponse.json({ success: true, result: fallbackResult, isFallback: true });
      }
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/honeygen Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi hệ thống Honey-Gen & Deepfake Challenge.',
      },
      { status: 500 }
    );
  }
}
