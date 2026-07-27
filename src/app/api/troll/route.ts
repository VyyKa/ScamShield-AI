import { NextRequest, NextResponse } from 'next/server';
import { getGenAIInstance, TROLL_PROMPT, cleanAndParseJSON, generateWithGemini, parseGeminiError } from '@/lib/gemini';
import { TrollResponse, TrollMessage } from '@/types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      history = [],
      lastScammerMessage = '',
      persona = 'Grandma_70',
      personaDetails = '',
      apiKey: bodyApiKey,
    } = body;
    const customKey = req.headers.get('x-gemini-key') || bodyApiKey;

    const formattedHistory = history
      .map((msg: TrollMessage) => `${msg.sender === 'scammer' ? 'Scammer' : 'AI Bot'}: ${msg.text}`)
      .join('\n');

    const fallbackReplies: Record<string, string[]> = {
      Grandma_70: [
        'Chờ cháu ơi, bà đang tìm cái kính lão... Mà cái ngân hàng Vietcombank này nằm ở kênh số mấy trên TV thế cháu?',
        'Ơ bà bấm nhầm mã OTP thành số điện thoại của bác thợ sửa xe rồi. Để bà đọc lại nhé: 0-9-8... ơ kính lại đâu mất rồi!',
        'Bà hỏi cháu cái này, chuyển 50 triệu này có được tặng cái bình nước thủy tinh như bên Agribank không cháu?',
        'Ơ bà bấm chuyển tiền mà máy nó báo "Mật khẩu sai", bà nhập ngày sinh của con cún nhà bà mà không được cháu ạ.',
      ],
      Naive_Student: [
        'Anh ơi em đang đứng ở cây ATM nè mà em quên mang thẻ, em dùng thẻ sinh viên quẹt vào khe gửi tiền được không anh?',
        'Dạ em muốn nạp tiền làm nhiệm vụ lắm mà ví Momo em còn có 12 nghìn à, anh cho em ứng trước 500k làm nhiệm vụ được không ạ?',
        'Ơ anh ơi mã OTP gửi về máy em là 6 số hay 8 số ạ? Em lỡ ấn xóa mất tin nhắn rồi, anh gửi lại hộ em với!',
        'Trời ơi thu nhập 2 triệu/ngày thật hả anh! Chút nữa em rủ cả phòng ký túc xá 8 đứa cùng làm chung với anh nha!',
      ],
    };

    const personaReplies = fallbackReplies[persona] || [
      'Ơ dạ cháu nói lại được không? Tín hiệu yếu quá bác nghe không rõ...',
      'Để bác lấy sổ ghi chép đã nhé, cháu đọc lại mã ngân hàng gì ấy nhỉ?',
      'Cháu ơi bác đang nấu cơm, để bác lau tay đã rồi làm theo hướng dẫn nhé...',
    ];

    const randomFallbackReply = personaReplies[Math.floor(Math.random() * personaReplies.length)];

    const fallbackResponse: TrollResponse = {
      botReply: randomFallbackReply,
      scammerFrustrationLevel: Math.floor(Math.random() * 3) + 7,
      timeWastedIncrement: Math.floor(Math.random() * 4) + 3,
    };

    let finalResponse = fallbackResponse;
    let isFallbackUsed = false;
    let fallbackReason: string | null = null;
    let usedModel: string | null = null;

    const aiInstance = getGenAIInstance(customKey);

    if (aiInstance) {
      try {
        let prompt = TROLL_PROMPT.replace('{selectedPersona}', persona)
          .replace('{personaDetails}', personaDetails || 'Không có (dùng guideline mặc định)')
          .replace('{chatHistory}', formattedHistory || 'Chưa có lịch sử tin nhắn trước đó.')
          .replace('{lastScammerMessage}', lastScammerMessage || 'Chào bạn');

        const { text: responseText, model } = await generateWithGemini(aiInstance, prompt);
        usedModel = model;
        finalResponse = cleanAndParseJSON<TrollResponse>(responseText, fallbackResponse);
      } catch (err: any) {
        console.warn('Troll Gemini API call error, using fallback:', err);
        isFallbackUsed = true;
        fallbackReason = parseGeminiError(err);
      }
    } else {
      isFallbackUsed = true;
      fallbackReason = 'Chưa cấu hình Gemini API Key (đang dùng Heuristic local)';
    }

    let cumulativeTimeWasted = 0;
    try {
      await prisma.trollSession.create({
        data: {
          persona: String(persona).slice(0, 80),
          lastScammerMessage: lastScammerMessage || 'Greeting',
          botReply: finalResponse.botReply,
          frustrationLevel: finalResponse.scammerFrustrationLevel,
          timeWastedMins: finalResponse.timeWastedIncrement,
        },
      });

      const aggregate = await prisma.trollSession.aggregate({
        _sum: { timeWastedMins: true },
      });
      cumulativeTimeWasted = aggregate._sum.timeWastedMins || 0;
    } catch (dbErr) {
      console.error('Failed to log troll session to SQLite:', dbErr);
    }

    return NextResponse.json({
      success: true,
      result: finalResponse,
      cumulativeTimeWastedMins: cumulativeTimeWasted,
      isFallback: isFallbackUsed,
      fallbackReason,
      model: usedModel,
    });
  } catch (error: any) {
    console.error('API /api/troll Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống khi sinh phản hồi Auto-Troll.' },
      { status: 500 }
    );
  }
}
