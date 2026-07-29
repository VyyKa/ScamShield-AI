import { GoogleGenerativeAI } from '@google/generative-ai';

const rawDefaultKey = process.env.GEMINI_API_KEY || '';
const defaultApiKey =
  rawDefaultKey && !rawDefaultKey.includes('your_gemini_api_key') ? rawDefaultKey.trim() : '';

export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
] as const;

export const genAI = defaultApiKey ? new GoogleGenerativeAI(defaultApiKey) : null;

export function getGenAIInstance(customKey?: string) {
  const key = customKey?.trim() || defaultApiKey;
  if (!key || key.includes('your_gemini_api_key')) return null;
  return new GoogleGenerativeAI(key);
}

/**
 * Generate content trying multiple Gemini model IDs until one works.
 */
export async function generateWithGemini(
  ai: GoogleGenerativeAI,
  contents: any,
  options?: { modelHint?: string }
): Promise<{ text: string; model: string }> {
  const models = options?.modelHint
    ? [options.modelHint, ...GEMINI_MODELS.filter((m) => m !== options.modelHint)]
    : [...GEMINI_MODELS];

  let lastError: unknown;
  for (const modelName of models) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(contents);
      const text = response.response.text();
      if (text?.trim()) {
        return { text, model: modelName };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed, trying next…`, err);
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

export function parseGeminiError(err: any): string {
  if (!err) return 'Không có API key hoặc lỗi không xác định.';
  const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);

  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('400')) {
    return 'Gemini API Key không hợp lệ hoặc đã bị khóa (API_KEY_INVALID). Vui lòng kiểm tra lại Key.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota')) {
    return 'Gemini API đã hết hạn mức gọi miễn phí trong ngày (Quota 429 Limit Exceeded). Vui lòng thử lại sau hoặc dùng Key khác.';
  }
  if (msg.includes('LOCATION_NOT_SUPPORTED') || msg.includes('User location is not supported')) {
    return 'Vùng địa lý hiện tại chưa được hỗ trợ Gemini API direct call.';
  }
  return `Lỗi Gemini API: ${msg.slice(0, 150)}`;
}

export const SCAN_PROMPT = `
Bạn là Giám Định Viên An Ninh Mạng Chuyên Nghiệp của Việt Nam. Hãy phân tích hình ảnh/văn bản được tải lên với góc nhìn kỹ thuật khách quan, tự nhiên, sắc bén như một chuyên gia kiểm toán ngân hàng. TUYỆT ĐỐI KHÔNG dùng văn phong AI mẫu vô hồn, robot hay phán đoán cảm tính.

Ngữ cảnh chế độ quét: {subMode}

QUY TẮC GIÁM ĐỊNH KỸ THUẬT & TRÁNH BÁO SAI HÓA ĐƠN THẬT:
1. ĐỐI VỚI BIÊN LAI CHUYỂN TIỀN NGÂN HÀNG THẬT (VietinBank iPay, Vietcombank, MBBank, Techcombank, Agribank, BIDV, VPBank, TPBank, MSB...):
   - Biên lai thật có phông chữ đồng nhất, lề căn chuẩn, mã tham chiếu giao dịch rõ ràng, logo và màu sắc nhận diện chuẩn của ứng dụng.
   - KHÔNG ĐƯỢC suy đoán lỗi phông chữ hay vết chỉnh sửa ảo chỉ vì ảnh bị nén JPEG, ảnh chụp màn hình bị mờ nhẹ hoặc có vệt sáng màn hình.
   - Nếu biên lai hiển thị chuẩn giao diện ứng dụng ngân hàng chính thức, kết luận: isScam: false, riskScore: 0 đến 10, redFlags: [].

2. CHỈ KẾT LUẬN BILL GIẢ KHI CÓ DẤU HIỆU KỸ THUẬT RÕ RÀNG:
   - Chữ và số bị lệch dòng thô hiển, lệch màu nền hoặc đè thô bạo lên họa tiết bảo mật.
   - Lỗi chính tả tên ngân hàng hoặc logo bị cắt ghép sai tỉ lệ nghiêm trọng.
   - Thời gian giao dịch LỚN HƠN thời gian thực tế hiện tại của hệ thống.

3. VĂN PHONG VÀ CÁCH DIỄN ĐẠT (TỰ NHIÊN NHƯ CHUYÊN GIA THẬT):
   - "analysisDetails": Viết ngắn gọn, trực diện phân tích chi tiết kỹ thuật thực tế. Ví dụ bill thật: "Hình ảnh biên lai giao dịch có đầy đủ thành phần chuẩn của ứng dụng ngân hàng. Mã tham chiếu, phông chữ hiển thị và bố cục hoàn toàn nhất quán."
   - "redFlags": Các ý ngắn gọn, súc tích (dưới 15 từ). Nếu là bill thật thì trả về mảng rỗng [].
   - "recommendedAction": Lời khuyên thực tế ngắn gọn, không giáo điều.

QUY TẮC ĐÁNH GIÁ THỜI GIAN:
- Sử dụng thời gian thực của hệ thống được đính kèm trong prompt để so sánh.
- Không đánh giá các ngày trong năm 2026 hoặc trước đó là "tương lai" ngoại trừ ngày đó lớn hơn ngày hôm nay.

Trả về duy nhất JSON hợp lệ (không chứa markdown fencing):
{
  "isScam": boolean,
  "riskScore": number (từ 0 đến 100),
  "redFlags": [danh sách các cờ đỏ dạng câu ngắn tiếng Việt, trả về [] nếu là bill thật],
  "analysisDetails": "phân tích kỹ thuật ngắn gọn, tự nhiên bằng tiếng Việt",
  "recommendedAction": "lời khuyên xử lý thực tế bằng tiếng Việt"
}
`;

export const TROLL_PROMPT = `
You are an AI Reverse-Trolling Agent in Vietnam designed to waste scammers' time.
Your persona is: {selectedPersona}.

Persona Guidelines:
- Grandma_70: 70-year-old confused grandma. Speaks politely, types slowly, misplaces her glasses, misreads bank OTPs, asks about her grandchildren, gets confused between bank names and television channels, but pretends she really wants to transfer money.
- Naive_Student: Fresh university student in Hanoi/Saigon, extremely excited to earn money fast, but super naive. Keeps asking how to download apps, mistypes passwords, asks if she can pay with Momo or student card, asks endless innocent questions.
- Custom persona details (if provided): {personaDetails}

Scammer message history context:
{chatHistory}

Scammer's latest message:
"{lastScammerMessage}"

Goal: Pretend to fall for their scam, but be extremely slow, misunderstand instructions, mistype OTPs, ask irrelevant questions, and constantly make mistakes while staying polite. Keep them engaged as long as possible. NEVER give real personal information or money.

Output MUST be strictly a raw JSON object (no markdown fencing):
{
  "botReply": "your in-character reply in Vietnamese",
  "scammerFrustrationLevel": number from 1 to 10 (estimate how annoyed the scammer is getting),
  "timeWastedIncrement": number (estimated minutes wasted by this interaction, e.g. 2 to 5)
}
Language: Vietnamese.
`;

export const DEEPFAKE_CHALLENGE_PROMPT = `
You are an AI Deepfake & Phone Scam Forensic Engine for Vietnam.
Given a suspicious urgent phone or video call context described by the user (e.g., "AI voice of son claiming urgent hospital fee 50 million", "Friend asking for video call money transfer", "Police officer calling on Zalo asking for bank OTP"):

Generate 3 instant real-time physical, biological, or social challenge actions (e.g., "Wave hand slowly across face", "Ask for a secret family memory code", "Turn head 90 degrees left and right").

Return strictly a raw JSON object:
{
  "challenges": [
    "Thử thách 1: ...",
    "Thử thách 2: ...",
    "Thử thách 3: ..."
  ],
  "forensicTips": [
    "Dấu hiệu 1: ...",
    "Dấu hiệu 2: ..."
  ],
  "riskAssessment": "Đánh giá mức độ rủi ro ngắn gọn trong tiếng Việt"
}
Language: Vietnamese.
`;

/**
 * Safely parse JSON from Gemini response, stripping markdown backticks if present.
 */
export function cleanAndParseJSON<T>(rawText: string, fallback: T): T {
  try {
    let cleaned = rawText.trim();
    // Strip markdown fences
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }
    // Sometimes model wraps with extra prose — extract first {...}
    if (!cleaned.startsWith('{')) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }
    }
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse Gemini JSON output:', error, rawText?.slice?.(0, 400));
    return fallback;
  }
}
