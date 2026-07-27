/**
 * Online threat-intel helpers (public / free APIs).
 * - ip-api.com : IP geolocation
 * - urlhaus.abuse.ch : malware URL (optional Auth-Key)
 * - dns.google : public DNS
 * - urlscan.io : public domain search (no key)
 * - Google Safe Browsing v4 (optional API key)
 */

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export interface IpGeoResult {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  org?: string;
  as?: string;
  lat?: number;
  lon?: number;
  label: string;
  raw?: Record<string, unknown>;
}

export interface UrlThreatResult {
  url: string;
  listed: boolean;
  threat?: string;
  tags?: string[];
  dateAdded?: string;
  source: 'urlhaus' | 'urlscan' | 'safebrowsing' | 'none';
  detail?: string;
}

export interface DomainDnsResult {
  domain: string;
  exists: boolean;
  answers?: string[];
  detail: string;
}

export interface UrlscanResult {
  domain: string;
  found: boolean;
  total?: number;
  maliciousHints: string[];
  detail: string;
  sample?: { pageTitle?: string; verdicts?: string; link?: string };
}

export interface SafeBrowsingResult {
  url: string;
  listed: boolean;
  threats: string[];
  detail: string;
  source: 'safebrowsing' | 'none';
}

const URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?:\/[^\s]*)?)/gi;

export function extractUrls(text: string): string[] {
  if (!text?.trim()) return [];
  const found = new Set<string>();
  const matches = text.match(URL_REGEX) || [];
  for (const m of matches) {
    let u = m.trim().replace(/[.,;:!?)]+$/, '');
    if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
    try {
      const parsed = new URL(u);
      if (parsed.hostname.includes('.') && !parsed.hostname.endsWith('.local')) {
        found.add(parsed.href);
      }
    } catch {
      /* ignore */
    }
  }
  return Array.from(found).slice(0, 5);
}

export function extractDomain(urlOrHost: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(urlOrHost) ? urlOrHost : `http://${urlOrHost}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Free IP geolocation via ip-api.com */
export async function lookupIpGeo(ip: string): Promise<IpGeoResult> {
  const clean = (ip || '').split(',')[0].trim();
  const fallback: IpGeoResult = {
    ip: clean || 'unknown',
    label: 'Không xác định được vị trí IP',
  };

  if (
    !clean ||
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean.startsWith('192.168.') ||
    clean.startsWith('10.')
  ) {
    return { ...fallback, label: 'IP nội bộ / localhost', city: 'Local', country: 'Local' };
  }

  try {
    const res = await fetchWithTimeout(
      `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,message,country,regionName,city,isp,org,as,lat,lon,query`,
      { cache: 'no-store' },
      5000
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data.status !== 'success') {
      return { ...fallback, label: data.message || fallback.label };
    }
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return {
      ip: data.query || clean,
      country: data.country,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      org: data.org,
      as: data.as,
      lat: data.lat,
      lon: data.lon,
      label: `${parts.join(', ')}${data.isp ? ` · ${data.isp}` : ''}`,
      raw: data,
    };
  } catch (err) {
    console.warn('ip-api lookup failed:', err);
    return fallback;
  }
}

/** Check URL against abuse.ch URLhaus API (optional Auth-Key via URLHAUS_AUTH_KEY) */
export async function checkUrlhaus(url: string): Promise<UrlThreatResult> {
  const normalized = url.trim();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const authKey = process.env.URLHAUS_AUTH_KEY?.trim();
    if (authKey) headers['Auth-Key'] = authKey;

    const res = await fetchWithTimeout(
      'https://urlhaus-api.abuse.ch/v1/url/',
      {
        method: 'POST',
        headers,
        body: `url=${encodeURIComponent(normalized)}`,
        cache: 'no-store',
      },
      8000
    );
    if (res.status === 401) {
      return {
        url: normalized,
        listed: false,
        source: 'none',
        detail:
          'URLhaus yêu cầu Auth-Key (auth.abuse.ch). Thêm URLHAUS_AUTH_KEY vào .env để bật.',
      };
    }
    if (!res.ok) {
      return { url: normalized, listed: false, source: 'none', detail: `URLhaus HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.query_status === 'ok') {
      return {
        url: normalized,
        listed: true,
        threat: data.threat || 'malware_download',
        tags: Array.isArray(data.tags) ? data.tags : [],
        dateAdded: data.date_added,
        source: 'urlhaus',
        detail: `URL bị liệt kê trên URLhaus — threat: ${data.threat || 'unknown'}`,
      };
    }
    return {
      url: normalized,
      listed: false,
      source: 'urlhaus',
      detail: 'URL chưa có trong feed URLhaus (không đồng nghĩa an toàn 100%).',
    };
  } catch (err) {
    console.warn('URLhaus check failed:', err);
    return { url: normalized, listed: false, source: 'none', detail: 'Không kết nối được URLhaus API' };
  }
}

/** Public urlscan.io search by domain (no API key) */
export async function checkUrlscan(domainOrUrl: string): Promise<UrlscanResult> {
  const domain = extractDomain(domainOrUrl) || domainOrUrl;
  try {
    const res = await fetchWithTimeout(
      `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=3`,
      {
        cache: 'no-store',
        headers: { 'User-Agent': 'ScamShield-AI/3.0 (anti-scam research)' },
      },
      8000
    );
    if (!res.ok) {
      return {
        domain,
        found: false,
        maliciousHints: [],
        detail: `urlscan.io HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    const results = data.results || [];
    const total = data.total ?? results.length;
    const maliciousHints: string[] = [];

    for (const r of results) {
      const score = r.verdicts?.overall?.score;
      const malicious = r.verdicts?.overall?.malicious;
      if (malicious || (typeof score === 'number' && score > 0)) {
        maliciousHints.push(
          `Scan ${r.task?.uuid || ''}: malicious=${Boolean(malicious)} score=${score ?? '?'}`
        );
      }
    }

    const first = results[0];
    return {
      domain,
      found: total > 0,
      total,
      maliciousHints,
      detail:
        total > 0
          ? `urlscan.io: ${total} lần quét domain${maliciousHints.length ? ` · ${maliciousHints.length} tín hiệu xấu` : ''}`
          : 'urlscan.io: chưa có scan công khai cho domain này',
      sample: first
        ? {
            pageTitle: first.page?.title,
            verdicts: first.verdicts?.overall
              ? JSON.stringify(first.verdicts.overall)
              : undefined,
            link: first.result || first.task?.uuid
              ? `https://urlscan.io/result/${first.task?.uuid}/`
              : undefined,
          }
        : undefined,
    };
  } catch (err) {
    console.warn('urlscan lookup failed:', err);
    return {
      domain,
      found: false,
      maliciousHints: [],
      detail: 'Không kết nối được urlscan.io',
    };
  }
}

/** Google Safe Browsing Lookup API v4 (optional GOOGLE_SAFE_BROWSING_API_KEY) */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const key =
    process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim(); // often same Google Cloud key if enabled

  if (!key) {
    return {
      url,
      listed: false,
      threats: [],
      detail: 'Chưa cấu hình GOOGLE_SAFE_BROWSING_API_KEY — bỏ qua Safe Browsing',
      source: 'none',
    };
  }

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`;
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'scamshield-ai', clientVersion: '3.0.0' },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
        cache: 'no-store',
      },
      8000
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        url,
        listed: false,
        threats: [],
        detail: `Safe Browsing HTTP ${res.status}${errText ? ` · ${errText.slice(0, 120)}` : ''}`,
        source: 'none',
      };
    }

    const data = await res.json();
    const matches = data.matches || [];
    if (matches.length) {
      const threats = matches.map((m: { threatType?: string }) => m.threatType || 'UNKNOWN');
      return {
        url,
        listed: true,
        threats,
        detail: `Google Safe Browsing: ${threats.join(', ')}`,
        source: 'safebrowsing',
      };
    }
    return {
      url,
      listed: false,
      threats: [],
      detail: 'Safe Browsing: không có threat match',
      source: 'safebrowsing',
    };
  } catch (err) {
    console.warn('Safe Browsing failed:', err);
    return {
      url,
      listed: false,
      threats: [],
      detail: 'Không kết nối được Google Safe Browsing',
      source: 'none',
    };
  }
}

/** Resolve domain via Google Public DNS */
export async function resolveDomainDns(domain: string): Promise<DomainDnsResult> {
  const host = extractDomain(domain) || domain;
  try {
    const res = await fetchWithTimeout(
      `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
      { cache: 'no-store' },
      5000
    );
    if (!res.ok) {
      return { domain: host, exists: false, detail: `DNS HTTP ${res.status}` };
    }
    const data = await res.json();
    const answers = (data.Answer || [])
      .filter((a: { type: number }) => a.type === 1)
      .map((a: { data: string }) => a.data);
    if (answers.length > 0) {
      return {
        domain: host,
        exists: true,
        answers,
        detail: `Domain resolve được · A: ${answers.slice(0, 3).join(', ')}`,
      };
    }
    return {
      domain: host,
      exists: false,
      detail: data.Status === 3 ? 'Domain không tồn tại (NXDOMAIN)' : 'Không có bản ghi A',
    };
  } catch (err) {
    console.warn('DNS resolve failed:', err);
    return { domain: host, exists: false, detail: 'Không kết nối được Google DNS' };
  }
}

/** Run online threat checks for any free-text input */
export async function enrichThreatIntel(text: string): Promise<{
  urls: UrlThreatResult[];
  domains: DomainDnsResult[];
  urlscan: UrlscanResult[];
  safeBrowsing: SafeBrowsingResult[];
  redFlags: string[];
}> {
  const urls = extractUrls(text);
  const urlResults: UrlThreatResult[] = [];
  const domainResults: DomainDnsResult[] = [];
  const urlscanResults: UrlscanResult[] = [];
  const sbResults: SafeBrowsingResult[] = [];
  const redFlags: string[] = [];

  for (const u of urls) {
    const [uh, dns, us, sb] = await Promise.all([
      checkUrlhaus(u),
      resolveDomainDns(u),
      checkUrlscan(u),
      checkSafeBrowsing(u),
    ]);
    urlResults.push(uh);
    domainResults.push(dns);
    urlscanResults.push(us);
    sbResults.push(sb);

    if (uh.listed) redFlags.push(`🌐 [URLhaus] ${uh.detail}`);
    if (us.maliciousHints.length) redFlags.push(`🔍 [urlscan] ${us.detail}`);
    if (sb.listed) redFlags.push(`🛡️ [Safe Browsing] ${sb.detail}`);
  }

  return {
    urls: urlResults,
    domains: domainResults,
    urlscan: urlscanResults,
    safeBrowsing: sbResults,
    redFlags,
  };
}
