'use client';

import React, { useState, useEffect } from 'react';
import { HoneyTokenData, DeepfakeChallengeResult } from '@/types';
import { apiPost } from '@/lib/clientApi';
import { Toast } from '@/components/ui/Toast';

export const HoneyChallengeTab: React.FC = () => {
  const [docType, setDocType] = useState('CCCD / ID Card');
  const [targetName, setTargetName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<HoneyTokenData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trapLog, setTrapLog] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [trapHistory, setTrapHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!generatedToken?.canaryToken) return;

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trap/poll?token=${generatedToken.canaryToken}`);
        const data = await res.json();
        if (data.success) {
          if (data.latestLog) {
            setTrapLog(data.latestLog);
          }
          if (data.history) {
            setTrapHistory(data.history);
          }
        }
      } catch (e) {
        console.warn('Poll trap log error:', e);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [generatedToken]);

  const [callContext, setCallContext] = useState(
    'Người gọi video Zalo xưng công an, nói con tôi nợ 50 triệu tiền viện, yêu cầu chuyển khoản gấp…'
  );
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [challengeResult, setChallengeResult] = useState<DeepfakeChallengeResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'danger' | 'warning'>('info');
  const [isFallback, setIsFallback] = useState(false);

  const notify = (m: string, variant: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setToastVariant(variant);
    setToast(m);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTrapLog(null);
    try {
      const data = await apiPost<{ success: boolean; token?: HoneyTokenData; error?: string }>(
        '/api/honeygen',
        {
          action: 'generate_token',
          type: docType,
          name: targetName || 'MỒI BẪY SCAMSHIELD',
          amount: '50.000.000 VND',
        }
      );
      if (data.success && data.token) {
        setGeneratedToken(data.token);
        notify('Đã tạo honey-token', 'success');
      } else {
        notify(data.error || 'Lỗi tạo token', 'danger');
      }
    } catch (err: any) {
      notify(err.message || 'Không kết nối được máy chủ', 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerTrap = async () => {
    if (!generatedToken?.canaryToken) return;
    setIsTriggering(true);
    try {
      const res = await fetch(`/api/trap/${encodeURIComponent(generatedToken.canaryToken)}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'TRAP_TRIGGERED') {
        setTrapLog(data.loggedData);
        notify('Trap kích hoạt — IP/geo đã ghi nhận (ip-api.com)', 'success');
      } else {
        notify('Phản hồi trap không hợp lệ', 'warning');
      }
    } catch {
      notify('Không kích hoạt được trap', 'danger');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleChallenge = async () => {
    if (!callContext.trim()) return;
    setIsChallengeLoading(true);
    setCompleted({});
    try {
      const data = await apiPost<{
        success: boolean;
        result?: DeepfakeChallengeResult;
        isFallback?: boolean;
        error?: string;
      }>('/api/honeygen', {
        action: 'deepfake_challenge',
        context: callContext,
      });
      if (data.success && data.result) {
        setChallengeResult(data.result);
        setIsFallback(Boolean(data.isFallback));
        notify(data.isFallback ? 'Challenge mặc định (không có Gemini)' : 'Đã sinh thử thách', data.isFallback ? 'warning' : 'success');
      } else {
        notify(data.error || 'Lỗi tạo thử thách', 'danger');
      }
    } catch (err: any) {
      notify(err.message || 'Không kết nối được máy chủ', 'danger');
    } finally {
      setIsChallengeLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!generatedToken?.ipTrapUrl) return;
    try {
      await navigator.clipboard.writeText(generatedToken.ipTrapUrl);
      notify('Đã copy URL bẫy', 'success');
    } catch {
      notify(generatedToken.ipTrapUrl, 'info');
    }
  };

  return (
    <div className="page-wrap space-y-5">
      <Toast message={toast} variant={toastVariant} onClose={() => setToast(null)} />

      <header>
        <h1 className="section-title">Deepfake & Bẫy Định Vị (Honey-Token)</h1>
        <p className="section-sub">
          Tạo đường link bẫy ẩn định vị IP thật của kẻ lừa đảo và sinh thử thách vật lý diệt cuộc gọi Deepfake AI.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-box-cyan">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                travel_explore
              </span>
            </div>
            <div>
              <h2 className="font-display font-bold">Tạo Link Bẫy Định Vị</h2>
              <p className="text-xs text-on-surface-variant">Tạo URL ẩn ngụy trang tài liệu để bẫy IP kẻ gian</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Loại tài liệu mồi</label>
              <select className="input-field" value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option>CCCD / ID Card</option>
                <option>Bill chuyển khoản giả</option>
                <option>PDF hợp đồng</option>
                <option>QR thanh toán</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Tên trên mồi bẫy</label>
              <input
                className="input-field"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="VD: NGUYỄN VĂN A"
              />
            </div>
            <button type="button" className="btn-primary w-full" disabled={isGenerating} onClick={handleGenerate}>
              <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>
                {isGenerating ? 'progress_activity' : 'add_link'}
              </span>
              {isGenerating ? 'Đang tạo…' : 'Tạo honey-token'}
            </button>
          </div>

          {generatedToken && (
            <div className="mt-5 space-y-3">
              {/* Fake document preview card */}
              <div className="relative overflow-hidden rounded-2xl border border-cyan/30 bg-gradient-to-br from-[#0a1628] to-[#122038] p-5">
                <div className="absolute right-3 top-3 rotate-12 rounded border border-danger/40 bg-danger-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-danger">
                  Canary
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan">{generatedToken.type}</p>
                <p className="mt-2 font-display text-lg font-bold">{generatedToken.targetName}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  <div>
                    <p className="text-[10px] uppercase opacity-60">Ngân hàng</p>
                    <p className="font-medium text-on-surface">{generatedToken.bankOrOrg}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-60">Số / ID</p>
                    <p className="font-mono text-on-surface">{generatedToken.accountOrId}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase opacity-60">Payload</p>
                    <p className="font-mono text-primary">{generatedToken.amountOrPayload}</p>
                  </div>
                </div>
                <p className="mt-4 border-t border-white/10 pt-2 font-mono text-[9px] text-on-surface-variant/70">
                  {generatedToken.watermarkText}
                </p>
              </div>

              <div className="rounded-xl border border-cyan/25 bg-cyan-soft/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="badge-cyan">Link Bẫy Sẵn Sàng</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{generatedToken.canaryToken}</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div>
                    <p className="text-[10px] font-sans text-on-surface-variant mb-1">Link Ngụy Trang Kỹ Thuật:</p>
                    <p className="break-all text-cyan bg-black/40 p-2 rounded border border-white/5">{generatedToken.ipTrapUrl}</p>
                  </div>

                  {(generatedToken as any).shortUrl && (
                    <div>
                      <p className="text-[10px] font-sans text-emerald-400 font-bold mb-1">Link Rút Gọn Siêu Gọn (is.gd / tinyurl):</p>
                      <p className="break-all text-emerald-300 bg-black/60 p-2 rounded border border-emerald-500/30 font-bold">
                        {(generatedToken as any).shortUrl}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => {
                      const urlToCopy = (generatedToken as any).shortUrl || generatedToken.ipTrapUrl;
                      navigator.clipboard.writeText(urlToCopy);
                      notify('Đã copy đường link bẫy rút gọn!', 'success');
                    }}
                  >
                    <span className="material-symbols-outlined text-base">content_copy</span>
                    Copy Link Bẫy
                  </button>
                  <button type="button" className="btn-primary text-xs" disabled={isTriggering} onClick={handleTriggerTrap}>
                    <span className="material-symbols-outlined text-base">bug_report</span>
                    {isTriggering ? 'Đang thử…' : 'Mô phỏng Scammer mở link'}
                  </button>
                  <a href={generatedToken.ipTrapUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
                    Mở trang trap
                  </a>
                </div>

                {/* Live Radar Polling Status */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold">
                      Đang lắng nghe kẻ lừa đảo mở link...
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">Tự động bắt IP mỗi 3s</span>
                </div>

                {trapLog && (
                  <div className="rounded-xl border border-danger/40 bg-danger/10 p-3.5 space-y-2.5 font-mono text-[11px] animate-pulse">
                    <div className="flex items-center justify-between border-b border-danger/30 pb-2">
                      <span className="font-sans text-xs font-extrabold text-danger flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">warning</span>
                        SẬP BẪY! KẺ LỪA ĐẢO VỪA NHẤP VÀO LINK
                      </span>
                      <span className="text-[10px] text-danger font-bold">LIVE TELEMETRY</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant text-[10px] block">ĐỊA CHỈ IP THẬT:</span>
                        <strong className="text-danger text-sm font-bold">{trapLog.ipAddress}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-[10px] block">VỊ TRÍ TỈNH / THÀNH:</span>
                        <strong className="text-emerald-400 text-xs font-bold">{trapLog.location}</strong>
                      </div>
                    </div>

                    {/* Advanced Device Fingerprint */}
                    {(() => {
                      let fpData: any = {};
                      try {
                        fpData = typeof trapLog.geoJson === 'string' ? JSON.parse(trapLog.geoJson) : (trapLog.geoJson || {});
                      } catch(e){}
                      const fp = fpData.deviceFingerprint || {};
                      const gps = fpData.gpsCoords;

                      return (
                        <div className="space-y-1.5 pt-2 border-t border-white/10 text-[10px]">
                          <p className="font-sans font-bold text-cyan flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">memory</span>
                            DẤU VẾT PHẦN CỨNG & THIẾT BỊ (FINGERPRINT):
                          </p>
                          
                          {fp.gpu && (
                            <div>
                              <span className="text-on-surface-variant">Chip / Card Đồ Họa (GPU): </span>
                              <strong className="text-amber">{fp.gpu}</strong>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            {fp.screen && <div>Màn hình: <span className="text-on-surface">{fp.screen}</span></div>}
                            {fp.cores && <div>Số nhân CPU: <span className="text-on-surface">{fp.cores} cores</span></div>}
                            {fp.ram && <div>Bộ nhớ RAM: <span className="text-on-surface">{fp.ram}</span></div>}
                            {fp.timezone && <div>Múi giờ máy: <span className="text-on-surface">{fp.timezone}</span></div>}
                          </div>

                          {gps && (
                            <div className="p-2 rounded bg-black/60 border border-emerald-400/40 text-emerald-300 font-bold">
                              📍 TỌA ĐỘ GPS THỰC TẾ: {gps.lat}, {gps.lng} (Độ chính xác: ~{Math.round(gps.acc || 0)}m)
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {trapLog.isp && (
                      <div>
                        <span className="text-on-surface-variant text-[10px] block">NHÀ MẠNG (ISP):</span>
                        <span className="text-on-surface font-semibold">{trapLog.isp}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-on-surface-variant text-[10px] block">THIẾT BỊ / TRÌNH DUYỆT (USER-AGENT):</span>
                      <span className="text-on-surface-variant break-all text-[10px]">{(trapLog.userAgent || '').slice(0, 85)}</span>
                    </div>
                  </div>
                )}

                {/* Trap History Viewer */}
                {trapHistory.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">history</span>
                      Lịch Sử Kẻ Gian Sập Bẫy ({trapHistory.length} lượt)
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {trapHistory.map((h: any, idx: number) => (
                        <div key={h.id || idx} className="flex items-center justify-between bg-black/50 p-2 rounded text-[11px] font-mono border border-white/5">
                          <span className="text-danger font-bold">{h.ipAddress}</span>
                          <span className="text-on-surface-variant">{h.location}</span>
                          <span className="text-[10px] text-on-surface-variant/70">
                            {new Date(h.createdAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="card flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-box-violet">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                face_retouching_natural
              </span>
            </div>
            <div>
              <h2 className="font-display font-bold">Thử thách deepfake</h2>
              <p className="text-xs text-on-surface-variant">Gemini · challenge sinh học</p>
            </div>
          </div>

          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Mô tả cuộc gọi nghi vấn</label>
          <textarea
            className="input-field mb-3 min-h-[100px]"
            rows={4}
            value={callContext}
            onChange={(e) => setCallContext(e.target.value)}
          />
          <button type="button" className="btn-primary w-full" disabled={isChallengeLoading} onClick={handleChallenge}>
            <span className={`material-symbols-outlined ${isChallengeLoading ? 'animate-spin' : ''}`}>
              {isChallengeLoading ? 'progress_activity' : 'psychology'}
            </span>
            {isChallengeLoading ? 'Đang sinh…' : 'Sinh 3 thử thách'}
          </button>

          {challengeResult && (
            <div className="mt-5 space-y-4">
              {isFallback && (
                <p className="text-[11px] text-amber">Đang dùng bộ challenge mặc định (không có / lỗi Gemini)</p>
              )}
              <div className="rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                {challengeResult.riskAssessment}
              </div>
              <div className="space-y-2">
                {challengeResult.challenges.map((c, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                      completed[i] ? 'border-primary/40 bg-primary-soft' : 'border-white/8 bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!!completed[i]}
                      onChange={() => setCompleted((p) => ({ ...p, [i]: !p[i] }))}
                    />
                    <span className="text-sm leading-relaxed">{c}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-on-surface-variant">Mẹo forensics</p>
                <ul className="space-y-1.5">
                  {challengeResult.forensicTips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-on-surface-variant">
                      <span className="text-primary">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
