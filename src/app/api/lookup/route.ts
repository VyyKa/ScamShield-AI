import { NextRequest, NextResponse } from 'next/server';
import {
  checkSafeBrowsing,
  checkUrlhaus,
  checkUrlscan,
  extractUrls,
  lookupIpGeo,
  resolveDomainDns,
} from '@/lib/onlineApis';

export const dynamic = 'force-dynamic';

/**
 * Unified online lookup: URL threat, DNS, IP geo, urlscan, Safe Browsing.
 * GET /api/lookup?q=example.com  or  ?ip=8.8.8.8
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const ip = searchParams.get('ip')?.trim() || '';

    if (!q && !ip) {
      return NextResponse.json(
        { success: false, error: 'Cần tham số q (url/domain/text) hoặc ip' },
        { status: 400 }
      );
    }

    const result: Record<string, unknown> = {
      success: true,
      sources: [] as string[],
    };

    if (ip) {
      const geo = await lookupIpGeo(ip);
      result.geo = geo;
      (result.sources as string[]).push('ip-api.com');
    }

    if (q) {
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(q) && !ip) {
        const geo = await lookupIpGeo(q);
        result.geo = geo;
        (result.sources as string[]).push('ip-api.com');
      }

      const urls = extractUrls(q).length
        ? extractUrls(q)
        : q.includes('.')
          ? [q.startsWith('http') ? q : `http://${q}`]
          : [];

      const urlChecks = [];
      const dnsChecks = [];
      const urlscanChecks = [];
      const sbChecks = [];

      for (const u of urls.slice(0, 3)) {
        const [uh, dns, us, sb] = await Promise.all([
          checkUrlhaus(u),
          resolveDomainDns(u),
          checkUrlscan(u),
          checkSafeBrowsing(u),
        ]);
        urlChecks.push(uh);
        dnsChecks.push(dns);
        urlscanChecks.push(us);
        sbChecks.push(sb);
      }

      if (urlChecks.length) {
        result.urlhaus = urlChecks;
        result.dns = dnsChecks;
        result.urlscan = urlscanChecks;
        result.safeBrowsing = sbChecks;
        (result.sources as string[]).push(
          'urlhaus.abuse.ch',
          'dns.google',
          'urlscan.io',
          'safebrowsing.googleapis.com'
        );
      } else {
        result.hint = 'Không phát hiện URL/domain. Thử STK/SĐT trên /api/database.';
      }
    }

    result.sources = Array.from(new Set(result.sources as string[]));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('/api/lookup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
