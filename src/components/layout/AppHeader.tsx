'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EMERGENCY_HOTLINES } from '@/lib/mockDatabase';
import { useTheme } from '@/components/providers/ThemeProvider';

import { OnboardingGuideModal } from '@/components/ui/OnboardingGuideModal';
import { ProductTour } from '@/components/ui/ProductTour';

const NAV = [
  { href: '/', label: 'Trang chủ', tourId: 'tour-nav-home' },
  { href: '/scan', label: 'Quét & Xác minh', tourId: 'tour-nav-scan' },
  { href: '/troll', label: 'Troll AI', tourId: 'tour-nav-troll' },
  { href: '/honey', label: 'Deepfake & Trap', tourId: 'tour-nav-honey' },
  { href: '/database', label: 'Kho cảnh báo', tourId: 'tour-nav-database' },
  { href: 'https://cybermap.kaspersky.com/', label: 'Security Map', tourId: 'tour-nav-secmap', external: true },
];

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggle, mounted } = useTheme();
  const [openMenu, setOpenMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [showHotline, setShowHotline] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showProductTour, setShowProductTour] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('user_gemini_api_key') || '');
    const tourCompleted = localStorage.getItem('scamshield_tour_completed');
    if (tourCompleted !== 'true') {
      setShowProductTour(true);
    }
  }, []);

  useEffect(() => {
    setOpenMenu(false);
  }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/database?q=${encodeURIComponent(search.trim())}`;
    }
  };

  const saveKey = () => {
    localStorage.setItem('user_gemini_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAdminUnlockNotice, setShowAdminUnlockNotice] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (clickTimer) clearTimeout(clickTimer);
    
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);

    if (nextCount >= 5) {
      localStorage.setItem('scamshield_admin_mode', 'true');
      setShowAdminUnlockNotice(true);
      setLogoClicks(0);
      setTimeout(() => {
        window.location.href = '/developer?key=admin';
      }, 600);
      return;
    }

    const timer = setTimeout(() => {
      setLogoClicks(0);
    }, 2500);
    setClickTimer(timer);
  };

  return (
    <>
      <header className="app-header sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-6">
          <div onClick={handleLogoClick} className="cursor-pointer">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-soft text-primary transition group-hover:scale-105">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_person
                </span>
              </div>
              <div className="hidden min-[400px]:block">
                <p className="font-display text-[15px] font-bold leading-tight tracking-tight">
                  ScamShield <span className="text-gradient-green">AI</span>
                </p>
                <p className="text-[10px] text-on-surface-variant">VietGuard Anti-Scam</p>
              </div>
            </Link>
          </div>

          <nav className="ml-2 hidden items-center gap-1 xl:gap-1.5 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href === '/developer' && pathname === '/api-docs');
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    id={item.tourId}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface inline-flex items-center gap-1"
                  >
                    <span>{item.label}</span>
                    <span className="material-symbols-outlined text-[14px] text-primary/80">open_in_new</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  id={item.tourId}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={onSearch} className="ml-auto hidden min-w-0 max-w-[200px] xl:max-w-xs flex-1 md:block">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tra STK, SĐT, domain..."
                className="w-full rounded-xl border border-white/10 bg-surface py-2 pl-10 pr-3 text-sm outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 shrink-0 md:ml-2">
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost !px-2.5 !py-2 shrink-0"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              aria-label="Đổi theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mounted ? (theme === 'dark' ? 'light_mode' : 'dark_mode') : 'contrast'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowHotline(true)}
              className="btn-ghost !px-2.5 !py-2 shrink-0"
              title="Hotline khẩn"
            >
              <span className="material-symbols-outlined text-[20px] text-danger">emergency</span>
            </button>
            <button
              type="button"
              id="tour-key-button"
              onClick={() => {
                setApiKey(localStorage.getItem('user_gemini_api_key') || '');
                setShowKey(true);
              }}
              className="btn-ghost !px-2.5 !py-2 relative shrink-0"
              title="Gemini API Key"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">key</span>
              {apiKey && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Đã lưu API Key" />
              )}
            </button>

            <button
              type="button"
              id="tour-help-button"
              onClick={() => setShowProductTour(true)}
              className="btn-ghost !px-2.5 !py-2 flex items-center gap-1 text-xs font-semibold text-primary shrink-0 whitespace-nowrap"
              title="Product Tour Hướng dẫn"
            >
              <span className="material-symbols-outlined text-[20px]">explore</span>
              <span className="hidden xl:inline whitespace-nowrap">Product Tour</span>
            </button>
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-2 lg:hidden"
              onClick={() => setOpenMenu((v) => !v)}
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-[22px]">{openMenu ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {openMenu && (
          <div className="border-t border-white/[0.06] bg-surface/95 px-4 py-3 lg:hidden animate-fade-in">
            <form onSubmit={onSearch} className="mb-3 md:hidden">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tra STK, SĐT, domain..."
                className="input-field"
              />
            </form>
            <div className="grid grid-cols-2 gap-1.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active ? 'bg-primary-soft text-primary' : 'bg-white/[0.03] text-on-surface-variant'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {showHotline && (
        <div className="modal-overlay" onClick={() => setShowHotline(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Đường dây nóng</h3>
              <button className="btn-ghost !p-2" onClick={() => setShowHotline(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              {EMERGENCY_HOTLINES.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number.replace(/\./g, '')}`}
                  className="card flex items-start gap-3 p-4 transition hover:border-danger/30"
                >
                  <div className="icon-box-danger">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-base font-bold text-danger">{h.number}</p>
                    <p className="text-sm font-semibold text-on-surface">{h.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{h.description}</p>
                    <span className="badge-danger mt-2">{h.badge}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {showKey && (
        <div className="modal-overlay" onClick={() => setShowKey(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span>
                Google Gemini API Key
              </h3>
              <button className="btn-ghost !p-2" onClick={() => setShowKey(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mb-3 text-sm text-on-surface-variant leading-relaxed">
              Key được lưu bảo mật trên trình duyệt của bạn (localStorage). Lấy miễn phí tại{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-bold underline"
              >
                Google AI Studio (aistudio.google.com)
              </a>
              . Khi có Key, hệ thống sẽ sử dụng <strong>Gemini 1.5/2.0 Flash AI Vision</strong> trực tiếp thay vì chế độ offline heuristic.
            </p>
            
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán Gemini Key bắt đầu bằng AIzaSy..."
                className="input-field font-mono text-xs pr-10"
              />
              {apiKey && (
                <button
                  onClick={() => setApiKey('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs font-mono"
                  title="Xóa chữ"
                >
                  ✕
                </button>
              )}
            </div>

            {apiKey && (
              <p className="mt-1.5 text-[11px] font-mono text-primary">
                ✓ Đã nhập {apiKey.length} ký tự (Bắt đầu với: {apiKey.slice(0, 7)}...)
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                className="text-xs text-danger font-semibold hover:underline"
                onClick={() => {
                  localStorage.removeItem('user_gemini_api_key');
                  setApiKey('');
                  setSaved(false);
                }}
              >
                Xóa Key khỏi trình duyệt
              </button>

              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setShowKey(false)}>
                  Đóng
                </button>
                <button className="btn-primary" onClick={saveKey}>
                  {saved ? 'Đã lưu thành công ✓' : 'Lưu Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <OnboardingGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      <ProductTour isOpen={showProductTour} onClose={() => setShowProductTour(false)} />

      {showAdminUnlockNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black font-bold font-mono text-xs px-4 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(52,211,153,0.5)] border border-emerald-300 animate-bounce">
          🔓 Đã mở khóa Admin Mode! Đang chuyển hướng vào Developer API Hub...
        </div>
      )}
    </>
  );
};

// Keep old export name if any file still imports Navbar
export const Navbar = AppHeader;
