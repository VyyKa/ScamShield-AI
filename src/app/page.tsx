'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { GitHubAdvisory, fetchGitHubSecurityAdvisories, DShieldAttackIP, fetchDShieldHoneypotAttacks } from '@/lib/onlineApis';

const FEATURES = [
  {
    href: '/scan',
    title: 'Quét & Giám Định AI',
    desc: 'Phân tích bill chuyển khoản giả, tin nhắn shipper, poster đa cấp bằng Gemini Vision + Threat Intel.',
    icon: 'document_scanner',
    badge: 'Gemini 2.0 · URLhaus · urlscan',
    color: 'green' as const,
  },
  {
    href: '/troll',
    title: 'Auto-Troll Scammer',
    desc: 'Bột AI giả lập bà nội 70 tuổi / sinh viên ngây thơ câu giờ, làm scammer phát điên.',
    icon: 'smart_toy',
    badge: 'Persona AI',
    color: 'violet' as const,
  },
  {
    href: '/honey',
    title: 'Deepfake & Canary Trap',
    desc: 'Tạo canary link bẫy IP thật của kẻ lừa đảo và thử thách 3 bước diệt video call deepfake.',
    icon: 'face',
    badge: 'Canary · GeoIP',
    color: 'cyan' as const,
  },
  {
    href: '/database',
    title: 'Kho Cảnh Báo Cộng Đồng',
    desc: 'Tra cứu STK, SĐT, Zalo, link độc hại — tố giác đối soát chống lừa đảo toàn quốc.',
    icon: 'database',
    badge: 'Community DB',
    color: 'amber' as const,
  },
];

const TRICKS = [
  { title: 'Shipper COD 0đ', desc: 'Giả vờ giao đơn shopee/tiktok ép chuyển cọc STK cá nhân', tag: 'Phổ biến', severity: 'HIGH' },
  { title: 'CTV Nhiệm Vụ TikTok', desc: 'Dụ nạp tiền làm nhiệm vụ, cho rút nhỏ rồi chiếm đoạt', tag: 'Lợi nhuận ảo', severity: 'CRITICAL' },
  { title: 'Deepfake Video Call', desc: 'AI dựng hình ảnh/giọng nói người thân vay tiền gấp', tag: 'Công nghệ cao', severity: 'CRITICAL' },
  { title: 'Giả Danh Công An / VKS', desc: 'Hù dọa rửa tiền, ép tải app độc hại chiếm quyền máy', tag: 'Nguy hiểm', severity: 'HIGH' },
];

const EMERGENCY_STEPS = [
  { step: '01', title: 'Khóa Tài Khoản Ngân Hàng', desc: 'Gọi ngay Hotline ngân hàng khóa khẩn cấp ứng dụng iPay / Internet Banking.', icon: 'lock' },
  { step: '02', title: 'Thu Thập Bằng Chứng', desc: 'Chụp lại tin nhắn, STK nhận tiền, số điện thoại và đường link lừa đảo.', icon: 'fact_check' },
  { step: '03', title: 'Tố Giác Lên ScamShield', desc: 'Đăng ký bản ghi lên Kho cảnh báo để bảo vệ hàng nghìn nạn nhân tiếp theo.', icon: 'campaign' },
  { step: '04', title: 'Liên Hệ Cơ Quan Chức Năng', desc: 'Gửi đơn tới Cục An toàn thông tin (156 / 111) hoặc công an địa phương.', icon: 'gavel' },
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
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [quickQuery, setQuickQuery] = useState('');
  const [githubAdvisories, setGithubAdvisories] = useState<GitHubAdvisory[]>([]);
  const [dshieldAttacks, setDshieldAttacks] = useState<DShieldAttackIP[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

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

    (async () => {
      try {
        const [gh, ds] = await Promise.all([
          fetchGitHubSecurityAdvisories(),
          fetchDShieldHoneypotAttacks(),
        ]);
        if (!cancelled) {
          setGithubAdvisories(gh.slice(0, 4));
          setDshieldAttacks(ds.slice(0, 4));
        }
      } catch (e) {
        console.warn('Failed to load homepage security feeds:', e);
      } finally {
        if (!cancelled) setLoadingFeeds(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      router.push(`/database?q=${encodeURIComponent(quickQuery.trim())}`);
    }
  };

  const metrics = status?.databaseMetrics;

  return (
    <div className="page-wrap space-y-12">
      {/* Hero Section */}
      <section className="card relative overflow-hidden bg-mesh p-6 sm:p-8 lg:p-10 border border-primary/20 shadow-glow">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <span className="badge-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {status?.status === 'ONLINE' ? 'Hệ thống online 24/7' : 'Chống lừa đảo AI'}
              {status?.version ? ` · ${status.version}` : ''}
            </span>

            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-gradient-hero">Bảo vệ người Việt</span>
              <br />
              khỏi lừa đảo AI & Bill Giả
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Nền tảng trí tuệ nhân tạo phòng thủ không gian mạng hàng đầu Việt Nam. Giám định hoá đơn giả, bẫy ngược kẻ lừa đảo và tra cứu dữ liệu thời gian thực.
            </p>

            {/* Quick Search Widget */}
            <form onSubmit={handleQuickSearch} className="relative max-w-lg">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-primary text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Nhập Số tài khoản, Số điện thoại hoặc Đường link để tra cứu nhanh..."
                  className="input-field pl-11 pr-28 py-3 text-xs sm:text-sm font-mono shadow-inner border-primary/30"
                />
                <button
                  type="submit"
                  className="btn-primary absolute right-1.5 py-2 px-3.5 text-xs font-bold shrink-0"
                >
                  Kiểm tra
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[12px] text-on-surface-variant">
              {['Gemini 2.0 Flash Vision', 'URLhaus Threat API', 'GeoIP & DShield Feed'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 font-medium">
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

          <div className="card space-y-4 p-5 bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">monitoring</span>
                Thống Kê Giám Định Thực Tế
              </p>
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
                    label: 'Bản ghi blacklist & tố giác',
                    value: metrics?.scamRecords ?? 0,
                    icon: 'database',
                  },
                  {
                    label: 'Lượt quét bill & nội dung đã log',
                    value: metrics?.scanLogs ?? 0,
                    icon: 'document_scanner',
                  },
                  {
                    label: 'Phiên bẫy ngược Troll AI',
                    value: metrics?.trollSessions ?? 0,
                    icon: 'smart_toy',
                  },
                  {
                    label: 'Canary trap hits (Vị trí scammer)',
                    value: metrics?.trapLogs ?? 0,
                    icon: 'my_location',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">{row.icon}</span>
                      <span className="text-xs sm:text-sm text-on-surface-variant font-medium">{row.label}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-on-surface">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[10px] font-mono text-on-surface-variant pt-1 border-t border-white/5">
              Engine AI Active:{' '}
              <span className="font-bold text-primary">
                {status?.aiStatus || 'HEURISTIC_LOCAL_ENGINE'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Main Feature Modules */}
      <section className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Hệ Thống Phòng Thủ
          </p>
          <h2 className="section-title">Bốn Module Công Cụ Trọng Tâm</h2>
          <p className="section-sub mx-auto max-w-lg">
            Được tối ưu hóa giao diện cho mọi loại thiết bị di động và máy tính bảng.
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
                  <span className={`${c.badge} max-w-[9rem] truncate sm:max-w-none font-mono text-[10px]`}>{f.badge}</span>
                </div>
                <p className="mb-5 flex-1 text-xs sm:text-sm leading-relaxed text-on-surface-variant">{f.desc}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${c.cta}`}>
                  Bắt đầu ngay
                  <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Real-Time Cyber Threat Security Feeds */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-danger">radar</span>
              Cảnh Báo An Ninh Mạng Real-Time
            </h2>
            <p className="text-xs text-on-surface-variant">Nguồn dữ liệu trực tiếp từ SANS DShield & GitHub Security Advisories</p>
          </div>
          <a
            href="https://cybermap.kaspersky.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Security Map 3D</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* SANS DShield Top Honeypot Attackers */}
          <div className="card p-4 space-y-3 border border-amber/30 bg-amber/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-amber flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber animate-pulse" /> SANS ISC DShield Honeypot Feeds
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">Attacker IPs</span>
            </div>

            {loadingFeeds ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {dshieldAttacks.map((ds, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-amber font-bold">IP: {ds.ip} ({ds.country})</span>
                    <span className="text-on-surface-variant">{ds.attacks} đợt quét</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GitHub Security Advisories */}
          <div className="card p-4 space-y-3 border border-cyan/30 bg-cyan/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-cyan flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" /> GitHub CVE Advisories Database
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">Global CVEs</span>
            </div>

            {loadingFeeds ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {githubAdvisories.map((gh) => (
                  <div key={gh.ghsaId} className="flex items-center justify-between text-xs font-mono bg-black/40 p-2 rounded border border-white/5 truncate">
                    <span className="text-cyan font-bold truncate mr-2">{gh.cveId || gh.summary}</span>
                    <span className="text-danger font-bold text-[10px] px-1.5 py-0.5 rounded bg-danger/20 shrink-0">{gh.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Emergency Playbook Guide */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-danger">Quy Trình Khẩn Cấp</p>
          <h2 className="section-title">4 Bước Cần Làm Ngay Khi Bị Lừa Đảo Chuyển Tiền</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMERGENCY_STEPS.map((s) => (
            <div key={s.step} className="card p-4 space-y-2 relative overflow-hidden group hover:border-danger/50 transition">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-danger/40 group-hover:text-danger transition">{s.step}</span>
                <span className="material-symbols-outlined text-danger text-2xl">{s.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">{s.title}</h3>
              <p className="text-xs leading-relaxed text-on-surface-variant">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hot Scam Tricks Alert */}
      <section className="card border-danger/30 p-5 sm:p-6 glow-alert bg-danger/5">
        <div className="mb-5 flex items-center gap-3">
          <div className="icon-box-danger">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Thủ Đoạn Lừa Đảo Đang Nổi Rộ</h2>
            <p className="text-xs text-on-surface-variant">Tổng hợp từ phòng giám định ScamShield AI</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRICKS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-white/[0.08] bg-black/40 p-4"
            >
              <span className="badge-danger mb-2 font-mono text-[10px]">{t.tag}</span>
              <h4 className="text-sm font-bold text-on-surface">{t.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-xs text-on-surface-variant">Nghi ngờ giao dịch hoặc hình ảnh hoá đơn? Hãy kiểm tra ngay.</p>
          <Link href="/scan" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Mở Phòng Giám Định AI</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
