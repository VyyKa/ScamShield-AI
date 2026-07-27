'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  badge: string;
  route?: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-key-button',
    title: '1. Cấu Hình Gemini API Key (🔑)',
    content: 'Nhấp vào đây để nhập Gemini API Key cá nhân từ Google AI Studio (aistudio.google.com). Mở khóa mô hình AI Gemini 3.5 Flash miễn phí!',
    badge: 'KÍCH HOẠT AI',
    position: 'bottom',
  },
  {
    targetId: 'tour-nav-scan',
    title: '2. Quét & Giám Định Forensics AI (🛡️)',
    content: 'Phòng giám định bill ngân hàng giả mạo, QR đè, poster đa cấp & SMS shipper COD 0đ. Soi điểm vỡ pixel & cờ đỏ lừa đảo trong 3 giây.',
    badge: 'PHÒNG GIÁM ĐỊNH',
    route: '/scan',
    position: 'bottom',
  },
  {
    targetId: 'tour-nav-troll',
    title: '3. Đại Lý Auto-Troll AI Câu Giờ (🤖)',
    content: 'Kích hoạt AI Persona (Bà nội 70t lãng tai, Sinh viên ngây thơ...) dán tin nhắn scammer để AI tự động chat làm nản lòng kẻ lừa đảo.',
    badge: 'CÂU GIỜ SCAMMER',
    route: '/troll',
    position: 'bottom',
  },
  {
    targetId: 'tour-nav-honey',
    title: '4. Canary Token & Diệt Deepfake (🪤)',
    content: 'Sinh link/file bẫy tracking IP ngầm khi scammer mở file + bộ câu hỏi vận động sinh học diệt cuộc gọi video AI giả mạo.',
    badge: 'SẬP BẪY SCAMMER',
    route: '/honey',
    position: 'bottom',
  },
  {
    targetId: 'tour-nav-database',
    title: '5. Kho Tra Cứu & Tố Giác Supabase Cloud (🗂️)',
    content: 'Tra cứu STK, SĐT hoặc gửi báo cáo lừa đảo mới lên Supabase Cloud Database để cảnh báo tức thì cho cả cộng đồng.',
    badge: 'SUPABASE CLOUD DB',
    route: '/database',
    position: 'bottom',
  },
];

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const currentStep = TOUR_STEPS[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;

    if (currentStep?.route && pathname !== currentStep.route) {
      router.push(currentStep.route);
    }

    const timer = setTimeout(() => {
      updateTargetRect();
    }, 200);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, currentStepIndex, currentStep, pathname, router, updateTargetRect]);

  if (!isOpen || !currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      localStorage.setItem('scamshield_tour_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('scamshield_tour_completed', 'true');
    onClose();
  };

  // Tooltip positioning
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow > 260 || spaceBelow > spaceAbove) {
      // Place below target
      tooltipStyle = {
        position: 'fixed',
        top: `${Math.min(targetRect.bottom + 14, window.innerHeight - 280)}px`,
        left: `${Math.max(20, Math.min(targetRect.left + targetRect.width / 2 - 180, window.innerWidth - 380))}px`,
      };
    } else {
      // Place above target
      tooltipStyle = {
        position: 'fixed',
        bottom: `${window.innerHeight - targetRect.top + 14}px`,
        left: `${Math.max(20, Math.min(targetRect.left + targetRect.width / 2 - 180, window.innerWidth - 380))}px`,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in pointer-events-auto">
      {/* Background Dimmed Overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300"
        onClick={handleSkip}
      />

      {/* Spotlight Cutout Ring around Target Element */}
      {targetRect && (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-300 ease-out z-[101]"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 25px rgba(78, 222, 163, 0.8)',
            border: '2px solid #4edea3',
          }}
        />
      )}

      {/* Floating Product Tour Tooltip Callout Box */}
      <div
        style={tooltipStyle}
        className="w-[360px] sm:w-[400px] rounded-2xl border border-primary/40 bg-[#0a1224] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[102] transition-all duration-300 animate-scale-in space-y-4"
      >
        {/* Tooltip Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-mono font-bold uppercase">
              {currentStep.badge}
            </span>
            <span className="text-[11px] font-mono text-on-surface-variant font-bold">
              Bước {currentStepIndex + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-on-surface-variant hover:text-on-surface font-mono"
            title="Bỏ qua tour"
          >
            Bỏ qua ✕
          </button>
        </div>

        {/* Tooltip Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold font-display text-on-surface flex items-center gap-1.5">
            {currentStep.title}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Tooltip Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentStepIndex === idx ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Trước
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 shadow-[0_0_12px_rgba(78,222,163,0.3)]"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
