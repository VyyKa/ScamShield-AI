'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/scan', label: 'Quét', icon: 'document_scanner' },
  { href: '/troll', label: 'Troll', icon: 'smart_toy' },
  { href: '/honey', label: 'Deepfake', icon: 'face' },
  { href: '/database', label: 'Kho', icon: 'database' },
  { href: '/security-map', label: 'Threats', icon: 'public' },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav-bar fixed bottom-0 left-0 right-0 z-50 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-[64px] max-w-lg items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />
              )}
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  active ? 'bg-primary-soft' : ''
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
              </span>
              <span className="truncate text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
