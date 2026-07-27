'use client';

import React, { useState, useEffect } from 'react';

interface GuideStep {
  stepNumber: number;
  icon: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  features: string[];
  tip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    stepNumber: 1,
    icon: 'key',
    title: '1. Cấu Hình Gemini API Key Cá Nhân (🔑)',
    badge: 'KÍCH HOẠT AI',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    description: 'Ứng dụng hỗ trợ bạn nhập và sử dụng Gemini API Key cá nhân miễn phí từ Google AI Studio.',
    features: [
      'Key được lưu an toàn 100% trong trình duyệt của bạn (localStorage).',
      'Mở khóa sức mạnh các mô hình AI mới nhất: Gemini 3.5 Flash & 2.0 Flash Vision.',
      'Nếu không nhập key, hệ thống tự động bật Chế độ Heuristic Offline để bạn sử dụng.',
    ],
    tip: 'Nhấp vào icon chìa khóa 🔑 ở góc trên thanh Menu Header bất kỳ lúc nào để nhập hoặc đổi Key.',
  },
  {
    stepNumber: 2,
    icon: 'security',
    title: '2. Quét & Giám Định Forensics AI (🛡️)',
    badge: 'PHÒNG GIÁM ĐỊNH',
    badgeColor: 'bg-primary/20 text-primary border-primary/40',
    description: 'Phân tích đa thức hình ảnh và văn bản nghi vấn lừa đảo chỉ trong 3 giây.',
    features: [
      'Giám định bill ngân hàng giả mạo, điểm vỡ pixel & font chữ bất thường.',
      'Phát hiện bẫy shipper COD đơn 0đ và poster tuyển CTV TikTok / Shopee.',
      'Tích hợp nút "Báo cáo vào Blacklist" lưu thẳng thông tin scammer lên Supabase Cloud.',
    ],
    tip: 'Bạn có thể nhấn "Lịch sử quét cộng đồng" để xem các cuộc giám định mới nhất của mọi người.',
  },
  {
    stepNumber: 3,
    icon: 'smart_toy',
    title: '3. Đại Lý Auto-Troll AI Phản Công (🤖)',
    badge: 'CÂU GIỜ SCAMMER',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    description: 'Sử dụng AI giả dạng để kéo dài thời gian và tiêu hao nguồn lực của kẻ lừa đảo.',
    features: [
      'Chọn các AI Persona như: Bà nội 70 tuổi lãng tai, Sinh viên ngây thơ...',
      'Tự tạo Persona cá nhân hóa theo chiến thuật riêng của bạn.',
      'AI tự động trả về tin nhắn ngây thơ, gõ chậm, nhầm OTP để scammer bất lực.',
    ],
    tip: 'Dán tin nhắn lừa đảo bất kỳ vào ô chat để kích hoạt AI phản công ngay tức thì!',
  },
  {
    stepNumber: 4,
    icon: 'psychology',
    title: '4. Thử Thách Deepfake & Canary Token (🪤)',
    badge: 'SẬP BẪY SCAMMER',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    description: 'Bắt bài các cuộc gọi video ghép mặt AI và thu thập dấu vết IP của scammer.',
    features: [
      'Sinh link bẫy Honey-Token định vị ngầm (Bẫy ảnh CCCD, Bill ngân hàng).',
      'Khi scammer mở link, hệ thống thu thập địa chỉ IP, User-Agent & vị trí địa lý thực.',
      'Bộ câu hỏi thử thách vận động sinh học để lật tẩy cuộc gọi video Deepfake.',
    ],
    tip: 'Gửi link bẫy cho scammer khi chúng yêu cầu gửi hình ảnh bằng chứng!',
  },
  {
    stepNumber: 5,
    icon: 'database',
    title: '5. Kho Cảnh Báo & Tố Giác Cộng Đồng (🗂️)',
    badge: 'SUPABASE CLOUD DB',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    description: 'Cơ sở dữ liệu anti-scam toàn quốc lưu trữ vĩnh viễn trên Supabase Database Cloud.',
    features: [
      'Tra cứu số tài khoản ngân hàng, số điện thoại hoặc link web nghi vấn.',
      'Gửi báo cáo lừa đảo mới kèm bằng chứng chi tiết.',
      'Đồng bộ tức thì cho tất cả người dùng trên toàn bộ hệ thống.',
    ],
    tip: 'Hãy luôn tra cứu STK trước khi thực hiện các giao dịch chuyển khoản cho người lạ!',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = GUIDE_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('scamshield_onboarded', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('scamshield_onboarded', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-white/[0.12] bg-[#0b1329] p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                help
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-on-surface">Hướng Dẫn Sử Dụng ScamShield AI</h2>
              <p className="text-[11px] text-on-surface-variant font-mono">Bước {currentStep + 1} / {GUIDE_STEPS.length}</p>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs font-mono text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg border border-white/10 transition"
          >
            Bỏ qua hướng dẫn ✕
          </button>
        </div>

        {/* Step Card Content */}
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-display">
              <span className="material-symbols-outlined text-primary text-lg">{step.icon}</span>
              {step.title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${step.badgeColor}`}>
              {step.badge}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">{step.description}</p>

          {/* Feature highlights list */}
          <div className="rounded-xl border border-white/[0.06] bg-surface-container/60 p-3.5 space-y-2">
            {step.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="leading-snug">{feat}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 flex items-start gap-2.5 text-xs text-primary-muted">
            <span className="material-symbols-outlined text-primary text-base shrink-0">lightbulb</span>
            <div>
              <strong className="text-primary block font-mono text-[11px] uppercase tracking-wider mb-0.5">Mẹo nhanh</strong>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">{step.tip}</p>
            </div>
          </div>
        </div>

        {/* Stepper Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {GUIDE_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-6 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary text-xs px-4 py-2"
              >
                Quay lại
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-[0_0_15px_rgba(78,222,163,0.3)]"
            >
              <span>{currentStep === GUIDE_STEPS.length - 1 ? 'Bắt đầu sử dụng ngay' : 'Bước tiếp theo'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
