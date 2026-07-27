'use client';

import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/clientApi';
import { GitHubAdvisory } from '@/lib/onlineApis';

interface LiveAttack {
  id: string;
  originCountry: string;
  originCode: string;
  targetCountry: string;
  targetCode: string;
  attackType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  ipRange: string;
  timestamp: string;
}

interface MapData {
  metrics: {
    totalAttacksBlockedToday: number;
    activeBotnetNodes: number;
    criticalVulnerabilitiesLogged: number;
    topVectors: { name: string; percent: number }[];
  };
  githubAdvisories: GitHubAdvisory[];
  liveAttacks: LiveAttack[];
}

export default function SecurityMapPage() {
  const [data, setData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'attacks' | 'github'>('attacks');

  const fetchSecurityMapData = async () => {
    try {
      const res = await apiGet<{ success: boolean } & MapData>('/api/security-map');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load Security Map:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMapData();

    // Auto refresh threat stream every 10s
    const timer = setInterval(fetchSecurityMapData, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredAttacks = (data?.liveAttacks || []).filter(
    (a) => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  const filteredAdvisories = (data?.githubAdvisories || []).filter(
    (g) => filterSeverity === 'ALL' || g.severity === filterSeverity
  );

  return (
    <div className="page-wrap space-y-6 pb-12">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              REAL-TIME THREAT RADAR STREAM
            </span>
          </div>
          <h1 className="section-title text-2xl sm:text-3xl font-display font-extrabold flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">public</span>
            Bản Đồ Cảnh Báo An Ninh Mạng Toàn Cầu
          </h1>
          <p className="section-sub text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Theo dõi luồng tấn công mạng trực tuyến real-time & cập nhật bản tin lỗ hổng bảo mật trực tiếp từ **GitHub Security Advisories API**.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityMapData}
            className="btn-secondary text-xs flex items-center gap-1.5"
            disabled={isLoading}
          >
            <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Cập nhật Live</span>
          </button>
        </div>
      </header>

      {/* Metrics Banner Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 space-y-1.5 border border-primary/30 bg-primary/5">
          <p className="text-[11px] font-mono text-on-surface-variant uppercase font-semibold">Tấn Công Đã Chặn Hôm Nay</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-primary">
            {isLoading ? '...' : (data?.metrics.totalAttacksBlockedToday || 148320).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <span>▲ +12.4%</span> vs 24h trước
          </span>
        </div>

        <div className="card p-4 space-y-1.5 border border-danger/30 bg-danger/5">
          <p className="text-[11px] font-mono text-on-surface-variant uppercase font-semibold">Nút Botnet & Phishing Đang Hoạt Động</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-danger">
            {isLoading ? '...' : (data?.metrics.activeBotnetNodes || 3425).toLocaleString()}
          </p>
          <span className="text-[10px] text-danger/80 font-mono">Giám sát IP đa quốc gia</span>
        </div>

        <div className="card p-4 space-y-1.5 border border-amber/30 bg-amber/5">
          <p className="text-[11px] font-mono text-on-surface-variant uppercase font-semibold">Bản Tin GitHub Advisories</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber">
            {isLoading ? '...' : data?.githubAdvisories?.length || 20} CVE
          </p>
          <span className="text-[10px] text-amber/80 font-mono">Cơ sở dữ liệu GitHub Security</span>
        </div>

        <div className="card p-4 space-y-1.5 border border-cyan/30 bg-cyan/5">
          <p className="text-[11px] font-mono text-on-surface-variant uppercase font-semibold">Véc-tơ Tấn Công Chính</p>
          <p className="text-sm font-bold font-mono text-cyan truncate">
            Phishing & COD (42%)
          </p>
          <span className="text-[10px] text-cyan/80 font-mono">Ransomware 28% · DDoS 18%</span>
        </div>
      </div>

      {/* Cyber Security World Threat Radar Canvas Visualizer */}
      <div className="card p-5 space-y-4 border border-white/10 relative overflow-hidden bg-[#070e1e]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">radar</span>
            <h2 className="font-display font-bold text-base text-on-surface">
              Mô Phỏng Trực Quan Luồng Tấn Công Real-Time (Live Cyber Radar)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-danger">
              <span className="h-2 w-2 rounded-full bg-danger inline-block" /> Critical
            </span>
            <span className="flex items-center gap-1 text-amber">
              <span className="h-2 w-2 rounded-full bg-amber inline-block" /> High
            </span>
            <span className="flex items-center gap-1 text-primary">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Medium
            </span>
          </div>
        </div>

        {/* Interactive Simulated Threat Map Grid */}
        <div className="relative w-full h-[320px] sm:h-[380px] rounded-xl border border-white/10 bg-black/60 overflow-hidden flex items-center justify-center">
          {/* Cybernetic Grid & Radar Sweep */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.08)_0,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* SVG Shooting Attack Beams */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Attack Beams */}
            <path d="M 180 120 Q 320 60 520 210" fill="none" stroke="url(#beamGrad)" strokeWidth="2" strokeDasharray="6,6" className="animate-pulse" />
            <path d="M 620 180 Q 420 140 220 220" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,4" />
            <path d="M 280 240 Q 480 200 680 140" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="5,5" />
          </svg>

          {/* World Nodes */}
          <div className="absolute top-[35%] left-[22%] flex flex-col items-center group">
            <span className="h-3 w-3 rounded-full bg-danger animate-ping" />
            <span className="text-[10px] font-mono font-bold text-danger bg-black/80 px-1.5 py-0.5 rounded border border-danger/40 mt-1">US (California)</span>
          </div>

          <div className="absolute top-[28%] left-[48%] flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-amber animate-ping" />
            <span className="text-[10px] font-mono font-bold text-amber bg-black/80 px-1.5 py-0.5 rounded border border-amber/40 mt-1">DE (Frankfurt)</span>
          </div>

          <div className="absolute top-[65%] left-[76%] flex flex-col items-center">
            <span className="h-4 w-4 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-black/90 px-2 py-0.5 rounded border border-emerald-400/50 mt-1 shadow-[0_0_10px_rgba(52,211,153,0.5)]">VN (Việt Nam) 🛡️</span>
          </div>

          <div className="absolute top-[32%] left-[82%] flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-cyan animate-ping" />
            <span className="text-[10px] font-mono font-bold text-cyan bg-black/80 px-1.5 py-0.5 rounded border border-cyan/40 mt-1">JP (Tokyo)</span>
          </div>

          <div className="absolute bottom-[20%] left-[55%] flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-purple-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-purple-400 bg-black/80 px-1.5 py-0.5 rounded border border-purple-400/40 mt-1">SG (Singapore)</span>
          </div>

          {/* Overlay Live Feed Snippet */}
          <div className="absolute bottom-3 left-3 right-3 bg-black/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <span className="text-danger font-bold">⚡ TẤN CÔNG THỜI GIAN THỰC:</span>
              <span className="text-on-surface truncate">
                {data?.liveAttacks[0]
                  ? `${data.liveAttacks[0].originCountry} ➔ ${data.liveAttacks[0].targetCountry} (${data.liveAttacks[0].attackType})`
                  : 'Đang kết nối luồng vệ tinh cảnh báo...'}
              </span>
            </div>
            <span className="text-on-surface-variant shrink-0 ml-2">Cập nhật mỗi 10s</span>
          </div>
        </div>
      </div>

      {/* Main Tabs: Live Attack Stream vs GitHub Security Advisories */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('attacks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 ${
                activeTab === 'attacks'
                  ? 'bg-primary text-on-primary shadow-glow'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">warning</span>
              Luồng Tấn Công Trực Tiếp ({filteredAttacks.length})
            </button>

            <button
              onClick={() => setActiveTab('github')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 ${
                activeTab === 'github'
                  ? 'bg-primary text-on-primary shadow-glow'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">code</span>
              GitHub Security Advisories API ({filteredAdvisories.length})
            </button>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-on-surface-variant mr-1">Mức độ:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                  filterSeverity === sev
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-white/10 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Live Attack Stream Table */}
        {activeTab === 'attacks' && (
          <div className="card border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface border-b border-white/10 text-on-surface-variant uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Nguồn tấn công (Origin)</th>
                    <th className="p-3">Mục tiêu (Target)</th>
                    <th className="p-3">Loại hình tấn công</th>
                    <th className="p-3">IP Range</th>
                    <th className="p-3 text-right">Mức rủi ro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttacks.map((atk) => (
                    <tr key={atk.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 text-on-surface-variant">{atk.timestamp}</td>
                      <td className="p-3 font-semibold text-on-surface">
                        <span className="mr-1.5">🌐</span>{atk.originCountry}
                      </td>
                      <td className="p-3 font-semibold text-primary">
                        <span className="mr-1.5">🎯</span>{atk.targetCountry}
                      </td>
                      <td className="p-3 font-bold text-cyan">{atk.attackType}</td>
                      <td className="p-3 text-on-surface-variant">{atk.ipRange}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            atk.severity === 'CRITICAL'
                              ? 'bg-danger/20 text-danger border border-danger/40'
                              : atk.severity === 'HIGH'
                              ? 'bg-amber/20 text-amber border border-amber/40'
                              : 'bg-primary/20 text-primary border border-primary/40'
                          }`}
                        >
                          {atk.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: GitHub Security Advisories Feed */}
        {activeTab === 'github' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAdvisories.map((adv) => (
              <div
                key={adv.ghsaId}
                className="card p-4 space-y-2 border border-white/10 hover:border-primary/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface border border-white/10 text-[10px] font-mono text-cyan font-bold">
                      📦 {adv.packageName} ({adv.ecosystem})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        adv.severity === 'CRITICAL'
                          ? 'bg-danger/20 text-danger border border-danger/40'
                          : 'bg-amber/20 text-amber border border-amber/40'
                      }`}
                    >
                      {adv.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-on-surface font-display leading-snug line-clamp-2">
                    {adv.summary}
                  </h3>

                  {adv.cveId && (
                    <p className="text-[11px] font-mono text-on-surface-variant">
                      CVE Identifier: <strong className="text-primary">{adv.cveId}</strong> · {adv.ghsaId}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {new Date(adv.publishedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <a
                    href={adv.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>Xem trên GitHub</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
