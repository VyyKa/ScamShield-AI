import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { ThreatTicker } from '@/components/layout/ThreatTicker';

export const metadata: Metadata = {
  title: {
    default: 'ScamShield AI · Chống Lừa Đảo Việt Nam',
    template: '%s · ScamShield AI',
  },
  description:
    'Giám định bill giả, troll scammer, honey-token, tra cứu blacklist và phát hiện deepfake — bảo vệ người Việt khỏi lừa đảo online.',
  applicationName: 'ScamShield AI',
  keywords: [
    'chống lừa đảo',
    'anti scam',
    'bill giả',
    'deepfake',
    'URLhaus',
    'Gemini',
    'Việt Nam',
  ],
  openGraph: {
    title: 'ScamShield AI · Chống Lừa Đảo Việt Nam',
    description: 'Công cụ AI phòng thủ lừa đảo online cho người Việt.',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
  ],
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('scamshield_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased text-on-background">
        <ThemeProvider>
          <AppHeader />
          <ThreatTicker />
          <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 sm:py-8 pb-28 md:pb-10">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
