'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { GitHubAdvisory, fetchGitHubSecurityAdvisories, DShieldAttackIP, fetchDShieldHoneypotAttacks } from '@/lib/onlineApis';

const FEATURES = [
  {
    href: '/scan',
    title: 'Quét & Giám Định',
    desc: 'Tải ảnh bill chuyển tiền, tin nhắn hoặc poster để kiểm tra dấu hiệu chỉnh sửa và tra cứu mã độc.',
    icon: 'document_scanner',
    badge: 'Gemini · URLhaus',
    color: 'green' as const,
  },
  {
    href: '/troll',
    title: 'Bẫy Ngược Scammer',
    desc: 'Tự động tạo kịch bản phản công câu giờ kẻ lừa đảo, tiêu tốn thời gian của đối tượng gian lận.',
    icon: 'smart_toy',
    badge: 'AI Persona',
    color: 'violet' as const,
  },
  {
    href: '/honey',
    title: 'Deepfake & Bẫy IP',
    desc: 'Tạo liên kết xác minh vị trí kẻ gian và cung cấp quy trình nhận biết cuộc gọi video giả mạo.',
    icon: 'face',
    badge: 'Canary · GeoIP',
    color: 'cyan' as const,
  },
  {
    href: '/database',
    title: 'Kho Cảnh Báo',
    desc: 'Tra cứu và tố giác số tài khoản, số điện thoại lừa đảo được đóng góp từ dữ liệu cộng đồng.',
    icon: 'database',
    badge: 'Community DB',
    color: 'amber' as const,
  },
];

const TRICKS = [
  { title: 'Shipper COD 0đ', desc: 'Giả vờ giao hàng rồi yêu cầu chuyển cọc qua số tài khoản cá nhân', tag: 'Phổ biến' },
  { title: 'CTV Nhiệm Vụ Online', desc: 'Dụ nạp tiền làm nhiệm vụ, cho rút số tiền nhỏ rồi chiếm đoạt', tag: 'Lợi nhuận ảo' },
  { title: 'Deepfake Video Call', desc: 'Giả dạng hình ảnh và giọng nói người thân để vay tiền gấp', tag: 'Công nghệ' },
  { title: 'Giả Danh Cơ Quan Chức Năng', desc: 'Đe dọa liên quan vụ án, yêu cầu chuyển tiền hoặc tải ứng dụng lạ', tag: 'Nguy hiểm' },
];

const EMERGENCY_STEPS = [
  { step: '01', title: 'Khóa tài khoản ngân hàng', desc: 'Liên hệ tổng đài ngân hàng để tạm khóa ứng dụng iPay / Internet Banking.', icon: 'lock' },
  { step: '02', title: 'Lưu trữ bằng chứng', desc: 'Chụp màn hình tin nhắn, biến động số dư và thông tin tài khoản nhận tiền.', icon: 'fact_check' },
  { step: '03', title: 'Tố giác dữ liệu', desc: 'Gửi thông tin lên Kho cảnh báo để ngăn chặn các trường hợp tiếp theo.', icon: 'campaign' },
  { step: '04', title: 'Báo cơ quan chức năng', desc: 'Trình báo tới Cục An toàn thông tin (Hotline 156 / 111) hoặc công an gần nhất.', icon: 'gavel' },
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
    <div className="page-wrap space-y-10">
      {/* Hero Section */}
      <section className="card relative overflow-hidden bg-mesh p-6 sm:p-8 lg:p-10 border border-primary/20 shadow-glow">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <span className="badge-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Cổng Giám Định An Ninh Mạng
            </span>

            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              Giám Định Bill Giả & Tra Cứu Lừa Đảo Online
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant">
              Công cụ tra cứu số tài khoản lừa đảo, phát hiện bill chuyển khoản giả và hỗ trợ bẫy ngược gian lận trực tuyến cho người dùng Việt Nam.
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
                  placeholder="Nhập số tài khoản, số điện thoại hoặc link nghi vấn..."
                  className="input-field pl-11 pr-24 py-2.5 text-xs sm:text-sm font-mono shadow-inner border-primary/30"
                />
                <button
                  type="submit"
                  className="btn-primary absolute right-1.5 py-1.5 px-3 text-xs font-bold shrink-0"
                >
                  Kiểm tra
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[12px] text-on-surface-variant">
              {['Gemini Vision', 'URLhaus Threat Intel', 'GeoIP & DShield Feed'].map((t) => (
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
                Dữ Liệu Giám Định
              </p>
              <span className="badge-green">{statusLoading ? '…' : status?.status || 'ONLINE'}</span>
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
                    label: 'Bản ghi tố giác & blacklist',
                    value: metrics?.scamRecords ?? 0,
                    icon: 'database',
                  },
                  {
                    label: 'Lượt kiểm tra hóa đơn & nội dung',
                    value: metrics?.scanLogs ?? 0,
                    icon: 'document_scanner',
                  },
                  {
                    label: 'Phiên bẫy ngược lừa đảo',
                    value: metrics?.trollSessions ?? 0,
                    icon: 'smart_toy',
                  },
                  {
                    label: 'Lượt phát hiện bẫy IP kẻ gian',
                    value: metrics?.trapLogs ?? 0,
                    icon: 'my_location',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">{row.icon}</span>
                      <span className="text-xs text-on-surface-variant font-medium">{row.label}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-on-surface">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[10px] font-mono text-on-surface-variant pt-1 border-t border-white/5">
              Engine Status:{' '}
              <span className="font-bold text-primary">
                {status?.aiStatus || 'ACTIVE_SMART_FORENSIC_ENGINE'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Main Feature Modules */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Hệ Thống Phân Tích
          </p>
          <h2 className="section-title">Các Công Cụ Chính</h2>
          <p className="section-sub mx-auto max-w-lg">
            Hỗ trợ tra cứu và giám định trực quan trên mọi loại thiết bị.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const c = colorMap[f.color];
            return (
              <Link key={f.href} href={f.href} className="card-hover group flex flex-col p-5 sm:p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={c.box}>
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {f.icon}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold">{f.title}</h3>
                  </div>
                  <span className={`${c.badge} font-mono text-[10px]`}>{f.badge}</span>
                </div>
                <p className="mb-4 flex-1 text-xs leading-relaxed text-on-surface-variant">{f.desc}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-bold tracking-wider ${c.cta}`}>
                  Mở công cụ
                  <span className="material-symbols-outlined text-sm transition group-hover:translate-x-1">
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
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-danger text-xl">radar</span>
              Cập Nhật Mối Đe Dọa
            </h2>
            <p className="text-xs text-on-surface-variant">Dữ liệu tấn công mạng trực tiếp từ SANS DShield và GitHub Security</p>
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
                <span className="h-2 w-2 rounded-full bg-amber animate-pulse" /> SANS ISC DShield Feeds
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
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" /> GitHub Advisory Database
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-danger">Khẩn Cấp</p>
          <h2 className="section-title">Xử Lý Khẩn Cấp Khi Bị Lừa Đảo</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMERGENCY_STEPS.map((s) => (
            <div key={s.step} className="card p-4 space-y-2 relative overflow-hidden group hover:border-danger/50 transition">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-danger/50 group-hover:text-danger transition">{s.step}</span>
                <span className="material-symbols-outlined text-danger text-xl">{s.icon}</span>
              </div>
              <h3 className="text-xs font-bold text-on-surface">{s.title}</h3>
              <p className="text-xs leading-relaxed text-on-surface-variant">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Verification Portals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              Cổng Thông Tin & Xác Minh Chính Thức
            </h2>
            <p className="text-xs text-on-surface-variant">Tra cứu tại các cơ quan quản lý an toàn thông tin quốc gia</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="https://tinnhiemmang.vn/"
            target="_blank"
            rel="noreferrer"
            className="card p-4 space-y-2 border border-primary/30 bg-primary/5 hover:border-primary transition group"
          >
            <div className="flex items-center justify-between">
              <span className="badge-green text-[10px]">Quốc Gia</span>
              <span className="material-symbols-outlined text-primary text-base group-hover:translate-x-0.5 transition">open_in_new</span>
            </div>
            <h3 className="text-xs font-bold text-on-surface">Tín Nhiệm Mạng</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">Tra cứu website, tổ chức & dịch vụ chính thống do NCSC chứng nhận.</p>
          </a>

          <a
            href="https://khonggianmang.vn/"
            target="_blank"
            rel="noreferrer"
            className="card p-4 space-y-2 border border-cyan/30 bg-cyan/5 hover:border-cyan transition group"
          >
            <div className="flex items-center justify-between">
              <span className="badge-cyan text-[10px]">Cục ATTT</span>
              <span className="material-symbols-outlined text-cyan text-base group-hover:translate-x-0.5 transition">open_in_new</span>
            </div>
            <h3 className="text-xs font-bold text-on-surface">Không Gian Mạng VN</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">Cập nhật cảnh báo lỗ hổng an ninh & tin tức lừa đảo mới nhất.</p>
          </a>

          <a
            href="https://vneid.gov.vn/"
            target="_blank"
            rel="noreferrer"
            className="card p-4 space-y-2 border border-amber/30 bg-amber/5 hover:border-amber transition group"
          >
            <div className="flex items-center justify-between">
              <span className="badge-amber text-[10px]">Bộ Công An</span>
              <span className="material-symbols-outlined text-amber text-base group-hover:translate-x-0.5 transition">open_in_new</span>
            </div>
            <h3 className="text-xs font-bold text-on-surface">VNeID Chính Thức</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">Cổng thông tin Định danh điện tử Quốc gia (BCA).</p>
          </a>

          <div className="card p-4 space-y-2 border border-danger/30 bg-danger/5">
            <div className="flex items-center justify-between">
              <span className="badge-danger text-[10px]">Hotline 156 / 111</span>
              <span className="material-symbols-outlined text-danger text-base">phone_in_talk</span>
            </div>
            <h3 className="text-xs font-bold text-on-surface">Tổng Đài Tố Giác</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">Gọi 156 tố giác cuộc gọi rác / 111 bảo vệ trẻ em trực tuyến.</p>
          </div>
        </div>
      </section>

      {/* Hot Scam Tricks Alert */}
      <section className="card border-danger/30 p-5 sm:p-6 glow-alert bg-danger/5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-box-danger">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            <div>
              <h2 className="font-display text-base font-bold">Thủ Đoạn Thường Gặp</h2>
              <p className="text-xs text-on-surface-variant">Các hình thức gian lận trực tuyến cần lưu ý</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <a
              href="https://t.me/share/url?url=https://scamshield.id.vn&text=Cảnh%20báo%20lừa%20đảo%20mạng"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">send</span>
              Chia sẻ Telegram
            </a>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRICKS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5"
            >
              <span className="badge-danger mb-2 font-mono text-[10px]">{t.tag}</span>
              <h4 className="text-xs font-bold text-on-surface">{t.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-xs text-on-surface-variant">Cần kiểm tra bill hoặc nội dung nghi vấn?</p>
          <Link href="/scan" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Mở phòng giám định</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
