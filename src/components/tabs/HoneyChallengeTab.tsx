'use client';

import React, { useState } from 'react';
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
        <h1 className="section-title">Deepfake & Honey-token</h1>
        <p className="section-sub">
          Tạo canary link (geo IP qua ip-api.com) và sinh thử thách phát hiện deepfake bằng Gemini.
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
              <h2 className="font-display font-bold">Honey-token generator</h2>
              <p className="text-xs text-on-surface-variant">Canary URL + trap log thật</p>
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
                  <span className="badge-cyan">Token sẵn sàng</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{generatedToken.canaryToken}</span>
                </div>
                <p className="break-all font-mono text-[11px] text-cyan">{generatedToken.ipTrapUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary text-xs" onClick={copyUrl}>
                    <span className="material-symbols-outlined text-base">content_copy</span>
                    Copy URL
                  </button>
                  <button type="button" className="btn-primary text-xs" disabled={isTriggering} onClick={handleTriggerTrap}>
                    <span className="material-symbols-outlined text-base">bug_report</span>
                    {isTriggering ? 'Đang bẫy…' : 'Mô phỏng scammer mở link'}
                  </button>
                  <a href={generatedToken.ipTrapUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
                    Mở trang trap
                  </a>
                </div>

                {trapLog && (
                  <div className="rounded-xl bg-surface p-3 font-mono text-[11px] text-primary">
                    <p className="mb-1 font-sans text-xs font-bold text-danger">TRAP TRIGGERED</p>
                    <p>IP: {trapLog.ipAddress}</p>
                    <p className="text-on-surface-variant">Geo: {trapLog.location}</p>
                    {trapLog.isp && <p className="text-on-surface-variant">ISP: {trapLog.isp}</p>}
                    <p className="text-on-surface-variant">Nguồn: {trapLog.geoSource || 'ip-api.com'}</p>
                    <p className="text-on-surface-variant">UA: {(trapLog.userAgent || '').slice(0, 60)}</p>
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
