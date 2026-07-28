'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  name: string;
  badge: string;
  description: string;
  defaultPayload?: object;
  defaultQueryParams?: string;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'system',
    method: 'GET',
    path: '/api/system/status',
    name: 'System status',
    badge: 'Health',
    description: 'Trạng thái module + metrics SQLite.',
  },
  {
    id: 'lookup',
    method: 'GET',
    path: '/api/lookup',
    name: 'Online lookup',
    badge: 'URLhaus · urlscan · SB · DNS · IP',
    description: 'Tra URL malware, urlscan.io, Safe Browsing, DNS Google, geo IP.',
    defaultQueryParams: '?q=http://example.com',
  },
  {
    id: 'scan',
    method: 'POST',
    path: '/api/scan',
    name: 'Scan forensics',
    badge: 'Gemini',
    description: 'Phân tích text/ảnh + threat intel online.',
    defaultPayload: {
      subMode: 'shipper_cross',
      text: 'Shipper Shopee COD 0đ, chuyển cọc 300k STK 19038888999901 gấp!',
    },
  },
  {
    id: 'troll',
    method: 'POST',
    path: '/api/troll',
    name: 'Auto-troll',
    badge: 'Gemini',
    description: 'Sinh reply persona câu giờ scammer.',
    defaultPayload: {
      persona: 'Grandma_70',
      lastScammerMessage: 'Đọc OTP 6 số ngay!',
      history: [],
    },
  },
  {
    id: 'honey',
    method: 'POST',
    path: '/api/honeygen',
    name: 'Honey / Deepfake',
    badge: 'Canary',
    description: 'generate_token hoặc deepfake_challenge.',
    defaultPayload: {
      action: 'generate_token',
      type: 'CCCD',
      name: 'TEST TARGET',
    },
  },
  {
    id: 'db_get',
    method: 'GET',
    path: '/api/database',
    name: 'Database search',
    badge: 'SQLite',
    description: 'Tra blacklist + intel domain nếu có.',
    defaultQueryParams: '?q=19038888',
  },
  {
    id: 'db_post',
    method: 'POST',
    path: '/api/database',
    name: 'Database report',
    badge: 'Write',
    description: 'Tố giác → ScamRecord + Report (dedupe normalize).',
    defaultPayload: {
      category: 'bank_account',
      targetValue: '97042299887766',
      ownerName: 'TEST USER',
      bankName: 'MBBank',
      scamType: 'Test report',
      description: 'Báo cáo thử từ API hub',
    },
  },
  {
    id: 'db_vote',
    method: 'POST',
    path: '/api/database/vote',
    name: 'Community vote',
    badge: 'Vote',
    description: 'CONFIRM | DISPUTE | UPVOTE — cần userId (seed user).',
    defaultPayload: {
      entityId: 'scam-001',
      userId: 'REPLACE_WITH_USER_ID',
      type: 'CONFIRM',
      note: 'Đã gặp chiêu này',
    },
  },
  {
    id: 'moderation',
    method: 'POST',
    path: '/api/moderation',
    name: 'Moderation action',
    badge: 'Mod',
    description: 'VERIFY | ARCHIVE | … — cần moderatorId role MOD/ADMIN.',
    defaultPayload: {
      entityId: 'scam-005',
      moderatorId: 'REPLACE_WITH_MOD_ID',
      action: 'VERIFY',
      note: 'Đủ bằng chứng',
    },
  },
];

function DeveloperConsoleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeId, setActiveId] = useState('lookup');
  const [payload, setPayload] = useState('');
  const [queryParams, setQueryParams] = useState('');
  const [output, setOutput] = useState<unknown>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const key = searchParams.get('key') || searchParams.get('secret') || searchParams.get('dev');
    const isSavedAdmin = typeof window !== 'undefined' && localStorage.getItem('scamshield_admin_mode') === 'true';

    if (key === 'admin' || key === 'scamshield' || key === 'true' || isSavedAdmin) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('scamshield_admin_mode', 'true');
      }
      setIsAuthorized(true);
    } else {
      router.replace('/');
    }
  }, [searchParams, router]);

  const ep = ENDPOINTS.find((e) => e.id === activeId)!;

  useEffect(() => {
    if (ep.method === 'POST') {
      setPayload(JSON.stringify(ep.defaultPayload ?? {}, null, 2));
      setQueryParams('');
    } else {
      setPayload('');
      setQueryParams(ep.defaultQueryParams || '');
    }
    setOutput(null);
    setStatus(null);
    setLatency(null);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    setLoading(true);
    setOutput(null);
    const t0 = performance.now();
    try {
      let url = ep.path;
      if (ep.method === 'GET' && queryParams.trim()) {
        url += queryParams.startsWith('?') ? queryParams : `?${queryParams}`;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (apiKey.trim()) headers['x-gemini-key'] = apiKey.trim();

      const res = await fetch(url, {
        method: ep.method,
        headers,
        body: ep.method === 'POST' ? payload : undefined,
      });
      setStatus(res.status);
      setLatency(Math.round(performance.now() - t0));
      const data = await res.json();
      setOutput(data);
    } catch (err: any) {
      setStatus(500);
      setOutput({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-mono text-xs text-on-surface-variant">
        🔒 Đang kiểm tra quyền Admin Developer...
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-6">
      <header>
        <h1 className="section-title">Developer API Hub</h1>
        <p className="section-sub">
          Thử REST endpoints. Ưu tiên nguồn online: Gemini, URLhaus, ip-api, dns.google.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="space-y-1.5 lg:col-span-4">
          {ENDPOINTS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setActiveId(e.id)}
              className={`flex w-full flex-col rounded-xl border px-3.5 py-3 text-left transition ${
                activeId === e.id
                  ? 'border-primary/40 bg-primary-soft'
                  : 'border-white/8 bg-surface-elevated/60 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${e.method === 'GET' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                  {e.method}
                </span>
                <span className="text-sm font-semibold">{e.name}</span>
              </div>
              <span className="mt-1 font-mono text-[11px] text-on-surface-variant">{e.path}</span>
            </button>
          ))}
        </aside>

        <section className="card space-y-4 p-4 sm:p-5 lg:col-span-8">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">{ep.method}</span>
              <span className="font-mono text-sm">{ep.path}</span>
              <span className="badge-green">{ep.badge}</span>
            </div>
            <p className="text-sm text-on-surface-variant">{ep.description}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Gemini key (optional header)</label>
            <input
              className="input-field font-mono text-xs"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="x-gemini-key"
            />
          </div>

          {ep.method === 'GET' ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Query string</label>
              <input className="input-field font-mono text-xs" value={queryParams} onChange={(e) => setQueryParams(e.target.value)} />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">JSON body</label>
              <textarea
                className="input-field min-h-[160px] font-mono text-xs"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
          )}

          <button type="button" className="btn-primary" onClick={run} disabled={loading}>
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'play_arrow'}
            </span>
            {loading ? 'Calling…' : 'Send request'}
          </button>

          {(status !== null || output !== null) && (
            <div className="rounded-xl border border-white/10 bg-surface p-3">
              <div className="mb-2 flex flex-wrap gap-3 text-xs">
                {status !== null && (
                  <span className={status < 400 ? 'text-primary' : 'text-danger'}>
                    HTTP {status}
                  </span>
                )}
                {latency !== null && <span className="text-on-surface-variant">{latency} ms</span>}
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-on-surface-variant">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DeveloperPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center font-mono text-xs text-on-surface-variant">
          🔒 Đang kiểm tra quyền Admin Developer...
        </div>
      }
    >
      <DeveloperConsoleContent />
    </Suspense>
  );
}
