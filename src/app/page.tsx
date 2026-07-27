'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

const FEATURES = [
  {
    href: '/scan',
    title: 'Quét & xác minh',
    desc: 'Phân tích bill, tin nhắn shipper, poster đa cấp bằng Gemini + threat intel online.',
    icon: 'document_scanner',
    badge: 'Gemini · URLhaus · urlscan',
    color: 'green' as const,
  },
  {
    href: '/troll',
    title: 'Auto-Troll AI',
    desc: 'Persona bà nội / sinh viên ngây thơ câu giờ, làm scammer mất kiên nhẫn.',
    icon: 'smart_toy',
    badge: 'Gemini Chat',
    color: 'violet' as const,
  },
  {
    href: '/honey',
    title: 'Deepfake & Honey',
    desc: 'Tạo canary token theo dõi IP thật (ip-api) và thử thách diệt deepfake.',
    icon: 'face',
    badge: 'Canary · GeoIP',
    color: 'cyan' as const,
  },
  {
    href: '/database',
    title: 'Kho cảnh báo',
    desc: 'Tra cứu STK, SĐT, Zalo, domain — cộng đồng tố giác + intel online.',
    icon: 'database',
    badge: 'Community DB',
    color: 'amber' as const,
  },
];

const TRICKS = [
  { title: 'Shipper COD 0đ', desc: 'Ép cọc giữ hàng qua STK cá nhân', tag: 'Phổ biến' },
  { title: 'CTV xem TikTok', desc: 'Cho rút nhỏ rồi dụ nạp lớn khóa TK', tag: 'Lợi nhuận ảo' },
  { title: 'Deepfake người thân', desc: 'Video call xin tiền cấp cứu', tag: 'Công nghệ' },
  { title: 'Giả danh công an', desc: 'Đe dọa rửa tiền, ép đọc OTP', tag: 'Nguy hiểm' },
];

const colorMap = {
  green: { box: 'icon-box-green', badge: 'badge-green', cta: 'text-primary' },
  violet: { box: 'icon-box-violet', badge: 'badge-violet', cta: 'text-accent' },
  cyan: { box: 'icon-box-cyan', badge: 'badge-cyan', cta: 'text-cyan' },
  amber: { box: 'icon-box-amber', badge: 'badge-amber', cta: 'text-amber' },
};

interface SystemStatus {
  status: string;
  version: string;
  aiStatus: string;
  onlineSources?: string[];
  databaseMetrics?: {
    scamRecords: number;
    scanLogs: number;
    trollSessions: number;
    honeyTokens: number;
    trapLogs: number;
  };
}

export default function Home() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/system/status');
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = status?.databaseMetrics;

  return (
    <div className="page-wrap space-y-10">
      {/* Hero */}
      <section className="card relative overflow-hidden bg-mesh p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <span className="badge-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {status?.status === 'ONLINE' ? 'Hệ thống online' : 'Chống lừa đảo AI'}
              {status?.version ? ` · ${status.version}` : ''}
            </span>

            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-gradient-hero">Bảo vệ người Việt</span>
              <br />
              khỏi lừa đảo AI
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
              ScamShield kết hợp Gemini AI, URLhaus, urlscan.io, Safe Browsing, GeoIP và kho cộng đồng
              để giám định bill, phản công scammer và phát hiện deepfake — rõ ràng trên mọi thiết bị.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/scan" className="btn-primary">
                <span className="material-symbols-outlined text-lg">security</span>
                Quét ngay
              </Link>
              <Link href="/database" className="btn-secondary">
                <span className="material-symbols-outlined text-lg">search</span>
                Tra cứu blacklist
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[12px] text-on-surface-variant">
              {['Gemini Flash', 'urlscan.io', 'ip-api · DNS Google'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span
                    className="material-symbols-outlined text-sm text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Live metrics</p>
              <span className="badge-green">{statusLoading ? '…' : status?.status || 'N/A'}</span>
            </div>

            {statusLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  {
                    label: 'Bản ghi blacklist',
                    value: metrics?.scamRecords ?? 0,
                    icon: 'database',
                  },
                  {
                    label: 'Lượt quét đã log',
                    value: metrics?.scanLogs ?? 0,
                    icon: 'document_scanner',
                  },
                  {
                    label: 'Phiên troll',
                    value: metrics?.trollSessions ?? 0,
                    icon: 'smart_toy',
                  },
                  {
                    label: 'Honey trap hits',
                    value: metrics?.trapLogs ?? 0,
                    icon: 'my_location',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-3 light:border-[var(--hairline)] light:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">{row.icon}</span>
                      <span className="text-sm text-on-surface-variant">{row.label}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-on-surface">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[10px] text-on-surface-variant">
              AI:{' '}
              <span className="font-medium text-on-surface">
                {status?.aiStatus || 'HEURISTIC_FALLBACK'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-5">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Công cụ
          </p>
          <h2 className="section-title mt-1">Bốn module bảo vệ chính</h2>
          <p className="section-sub mx-auto max-w-lg">
            Giao diện gọn, thao tác nhanh trên điện thoại và máy tính. Hỗ trợ dark / light.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const c = colorMap[f.color];
            return (
              <Link key={f.href} href={f.href} className="card-hover group flex flex-col p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={c.box}>
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {f.icon}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold sm:text-lg">{f.title}</h3>
                  </div>
                  <span className={`${c.badge} max-w-[9rem] truncate sm:max-w-none`}>{f.badge}</span>
                </div>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-on-surface-variant">{f.desc}</p>
                <span className={`inline-flex items-center gap-1 text-sm font-semibold ${c.cta}`}>
                  Mở module
                  <span className="material-symbols-outlined text-base transition group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Online sources strip */}
      <section className="card p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Nguồn API online
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Google Gemini',
            'URLhaus abuse.ch',
            'urlscan.io',
            'Google Safe Browsing',
            'ip-api.com',
            'dns.google',
          ].map((s) => (
            <span key={s} className="badge-green">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Hot tricks */}
      <section className="card border-danger/20 p-5 sm:p-6 glow-alert">
        <div className="mb-5 flex items-center gap-3">
          <div className="icon-box-danger">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Thủ đoạn đang nổi</h2>
            <p className="text-xs text-on-surface-variant">Cập nhật từ cộng đồng anti-scam VN</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRICKS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 light:border-[var(--hairline)] light:bg-slate-50"
            >
              <span className="badge-danger mb-2">{t.tag}</span>
              <h4 className="text-sm font-bold">{t.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center light:border-[var(--hairline)]">
          <p className="text-xs text-on-surface-variant">Gặp tình huống tương tự? Hãy quét nội dung ngay.</p>
          <Link href="/scan" className="text-sm font-semibold text-primary hover:underline">
            Mở phòng giám định →
          </Link>
        </div>
      </section>
    </div>
  );
}
