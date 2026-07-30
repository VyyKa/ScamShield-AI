'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-surface/50">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/favico.png" alt="ScamShield AI Logo" className="h-8 w-8 object-contain rounded-lg" />
              <span className="font-display font-bold">
                ScamShield <span className="text-gradient-green">AI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Công cụ chống lừa đảo cho người Việt: giám định AI, troll scammer, honey-token và kho cảnh báo cộng đồng.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tính năng</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><Link className="hover:text-primary" href="/scan">Quét & xác minh</Link></li>
              <li><Link className="hover:text-primary" href="/troll">Auto-Troll AI</Link></li>
              <li><Link className="hover:text-primary" href="/honey">Deepfake & Honey</Link></li>
              <li><Link className="hover:text-primary" href="/database">Kho cảnh báo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hotline</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><span className="font-mono font-bold text-danger">111</span> — An ninh mạng</li>
              <li><span className="font-mono font-bold text-danger">156</span> — SMS / cuộc gọi rác</li>
              <li><span className="font-mono font-bold text-danger">069.2348560</span> — C02</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nguồn online</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li>Google Gemini 1.5 Flash</li>
              <li>URLhaus (abuse.ch)</li>
              <li>ip-api.com · dns.google</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-on-surface-variant sm:flex-row">
          <p>© {new Date().getFullYear()} ScamShield AI · VietGuard</p>
          <p className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Vì an toàn cộng đồng
          </p>
        </div>
      </div>
    </footer>
  );
};
