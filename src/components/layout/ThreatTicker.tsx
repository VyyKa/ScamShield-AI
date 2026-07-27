'use client';

import React from 'react';

const ALERTS = [
  'Shipper COD 0đ ép cọc 300k–500k',
  'Video call deepfake giả người thân',
  'SMS giả công an / VKS đòi OTP',
  'CTV TikTok–Shopee dụ nạp tiền',
  'QR đè tại điểm thanh toán',
  'Web giả ngân hàng đánh cắp OTP',
  'Vé máy bay / KS giảm 70% trên Zalo',
];

export const ThreatTicker: React.FC = () => {
  const items = [...ALERTS, ...ALERTS];

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-danger-soft/40">
      <div className="flex h-9 items-center">
        <div className="z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-danger/20 bg-danger-soft px-3">
          <span className="material-symbols-outlined animate-pulse-soft text-sm text-danger" style={{ fontVariationSettings: "'FILL' 1" }}>
            campaign
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-danger">Cảnh báo</span>
        </div>
        <div className="ticker-wrapper flex-1">
          <div className="ticker-content items-center">
            {items.map((text, i) => (
              <span key={i} className="mx-5 inline-flex items-center gap-2 text-[12px] text-on-surface-variant">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
