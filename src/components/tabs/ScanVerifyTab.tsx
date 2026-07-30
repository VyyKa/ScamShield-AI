'use client';

import React, { useState } from 'react';
import { ScanSubMode, ScanResult } from '@/types';
import { PRESET_SAMPLES, getRiskColor } from '@/lib/utils';
import { apiPost, apiGet } from '@/lib/clientApi';
import { Toast } from '@/components/ui/Toast';

export const ScanVerifyTab: React.FC = () => {
  const [subMode, setSubMode] = useState<ScanSubMode>('fake_bill');
  const [inputText, setInputText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [threatIntel, setThreatIntel] = useState<any>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTarget, setBlockTarget] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'danger' | 'warning'>('info');
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchScanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiGet<{ success: boolean; logs: any[] }>('/api/scan');
      if (data.success) {
        setHistoryLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const subModeOptions = [
    { id: 'fake_bill' as const, title: 'Bill & QR', icon: 'receipt_long', hint: 'Biên nhận chuyển khoản' },
    { id: 'shipper_cross' as const, title: 'Shipper', icon: 'local_shipping', hint: 'SMS / Zalo COD' },
    { id: 'zalo_chat' as const, title: 'Chat Zalo / Tele', icon: 'chat', hint: 'Hội thoại nghi vấn' },
    { id: 'physical_poster' as const, title: 'Poster', icon: 'campaign', hint: 'Tuyển CTV / đầu tư' },
  ];

  const showToast = (msg: string, variant: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setToastVariant(variant);
    setToast(msg);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActivePresetId(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_SAMPLES.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setSubMode(preset.subMode);
    setInputText(preset.sampleText);
    setPreviewImage(null);
    setScanResult(preset.mockResult);
    setThreatIntel(null);
    setIsFallback(false);
  };

  const handleRunScan = async () => {
    if (!previewImage && !inputText.trim() && !activePresetId) {
      showToast('Nhập tin nhắn, dán link hoặc tải ảnh để phân tích');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiPost<{
        success: boolean;
        result: ScanResult;
        threatIntel?: unknown;
        isFallback?: boolean;
        fallbackReason?: string;
        model?: string;
        error?: string;
      }>('/api/scan', {
        image: previewImage,
        text: inputText,
        subMode,
        presetId: activePresetId,
      });
      if (data.success) {
        setScanResult(data.result);
        setThreatIntel(data.threatIntel || null);
        setIsFallback(Boolean(data.isFallback));
        setFallbackReason(data.fallbackReason || null);
        setUsedModel(data.model || null);
        showToast(
          data.isFallback ? 'Đã quét (chế độ heuristic / offline AI)' : 'Phân tích xong với Gemini AI',
          data.isFallback ? 'warning' : 'success'
        );
      } else {
        showToast(data.error || 'Lỗi phân tích', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Không kết nối được máy chủ', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBlockReport = async () => {
    if (!blockTarget.trim()) {
      showToast('Nhập STK hoặc SĐT cần báo cáo');
      return;
    }
    setIsSubmittingBlock(true);
    try {
      const data = await apiPost<{ success: boolean; error?: string }>('/api/database', {
        category: 'bank_account',
        targetValue: blockTarget.trim(),
        scamType: 'Phát hiện từ Forensic Scan AI',
        description: blockDesc.trim() || scanResult?.analysisDetails || 'Báo cáo từ scan',
      });
      if (data.success) {
        showToast('Đã gửi báo cáo vào kho cảnh báo', 'success');
        setShowBlockModal(false);
        setBlockTarget('');
        setBlockDesc('');
      } else {
        showToast(data.error || 'Không gửi được báo cáo', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối', 'danger');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleReset = () => {
    setPreviewImage(null);
    setInputText('');
    setScanResult(null);
    setThreatIntel(null);
    setActivePresetId(null);
    setIsFallback(false);
  };

  const risk = getRiskColor(scanResult?.riskScore ?? 0);

  return (
    <div className="page-wrap space-y-6">
      <Toast message={toast} variant={toastVariant} onClose={() => setToast(null)} />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Quét & xác minh</h1>
          <p className="section-sub">
            Gemini 3.5 / 2.0 Flash Vision + Forensic Engine. Nhập API Key (icon 🔑) để dùng Gemini AI của bạn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowHistoryModal(true);
            fetchScanHistory();
          }}
          className="btn-secondary text-xs flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">history</span>
          Lịch sử quét cộng đồng
        </button>
      </header>

      {/* Modes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {subModeOptions.map((opt) => {
          const on = subMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSubMode(opt.id);
                setActivePresetId(null);
              }}
              className={`card flex flex-col items-center gap-1.5 p-3 text-center transition sm:p-4 ${
                on ? 'border-primary/40 bg-primary-soft shadow-glow' : 'hover:border-white/15'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${on ? 'text-primary' : 'text-on-surface-variant'}`}>
                {opt.icon}
              </span>
              <span className="text-xs font-bold sm:text-sm">{opt.title}</span>
              <span className="hidden text-[10px] text-on-surface-variant sm:block">{opt.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber/30 bg-amber-soft p-3.5 flex items-start gap-3 text-xs text-on-surface">
        <span className="material-symbols-outlined text-amber text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified_user
        </span>
        <div className="space-y-0.5">
          <strong className="text-amber block font-bold">Khuyến cáo bảo mật quan trọng:</strong>
          <span>
            Ảnh chụp màn hình chuyển khoản <strong>có thể bị làm giả 100%</strong> bằng các ứng dụng chỉnh sửa. AI chỉ hỗ trợ soi dấu hiệu kỹ thuật. <strong>Bạn luôn cần kiểm tra biến động số dư trên ứng dụng ngân hàng thật</strong> trước khi giao hàng.
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Input */}
        <div className="space-y-4 lg:col-span-7">
          <label className="card relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed p-6 transition hover:border-primary/40">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="max-h-52 rounded-xl object-contain" />
            ) : (
              <>
                <div className="icon-box-green mb-3 !h-14 !w-14">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <p className="text-sm font-semibold">Kéo thả hoặc chạm để chọn ảnh</p>
                <p className="mt-1 text-xs text-on-surface-variant">Bill chuyển khoản, QR, screenshot chat…</p>
              </>
            )}
          </label>

          <div className="card space-y-2 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Tin nhắn / link nghi vấn
              </label>
              {(previewImage || inputText || scanResult) && (
                <button type="button" onClick={handleReset} className="text-xs font-medium text-primary hover:underline">
                  Làm mới
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setActivePresetId(null);
              }}
              placeholder="Dán SMS shipper, STK, hoặc URL phishing..."
              className="input-field resize-y min-h-[88px]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {PRESET_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handlePresetSelect(s.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                    activePresetId === s.id
                      ? 'border-primary/40 bg-primary-soft text-primary'
                      : 'border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Mẫu: {s.title.split('(')[0].trim().slice(0, 22)}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleRunScan} disabled={isLoading} className="btn-primary shrink-0 sm:min-w-[140px]">
              <span className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}>
                {isLoading ? 'progress_activity' : 'search_check'}
              </span>
              {isLoading ? 'Đang quét…' : 'Phân tích'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-5">
          <div className={`card flex h-full flex-col p-5 ${scanResult?.isScam ? 'glow-alert border-danger/25' : scanResult ? 'glow-active' : ''}`}>
            {!scanResult ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-40">policy</span>
                <p className="text-sm">Kết quả phân tích sẽ hiện ở đây</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <h3 className="font-display text-base font-bold">Kết quả</h3>
                  <span className={scanResult.isScam ? 'badge-danger' : 'badge-green'}>
                    {scanResult.isScam ? 'Rủi ro cao' : 'Tương đối an toàn'}
                  </span>
                </div>

                <div className="mb-4 text-center">
                  <p className={`font-display text-5xl font-extrabold ${risk.text}`}>{scanResult.riskScore}</p>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">Risk score / 100</p>
                  <p className={`mt-2 text-xs font-semibold ${risk.text}`}>{risk.label}</p>
                  {isFallback && (
                    <div className="mt-2.5 rounded-xl border border-amber/30 bg-amber/10 p-2.5 text-left text-[11px] text-amber">
                      <p className="font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Đang dùng heuristic local (chưa có / lỗi Gemini key)
                      </p>
                      {fallbackReason && <p className="mt-1 text-[10px] text-on-surface-variant leading-relaxed">{fallbackReason}</p>}
                    </div>
                  )}
                  {usedModel && !isFallback && (
                    <p className="mt-2 text-[11px] text-primary font-mono font-semibold">Model: {usedModel}</p>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold uppercase text-on-surface-variant">Cờ đỏ</p>
                  <ul className="space-y-1.5">
                    {scanResult.redFlags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-snug text-on-surface">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-3 rounded-xl bg-surface p-3 text-sm leading-relaxed text-on-surface-variant">
                  <p className="mb-1 text-xs font-semibold text-on-surface">Phân tích</p>
                  {scanResult.analysisDetails}
                </div>
                <div className="mb-4 rounded-xl border border-primary/20 bg-primary-soft p-3 text-sm leading-relaxed text-primary-muted">
                  <p className="mb-1 text-xs font-semibold text-primary">Khuyến nghị</p>
                  {scanResult.recommendedAction}
                </div>

                {threatIntel?.urls?.length > 0 && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-surface p-3">
                    <p className="mb-2 text-xs font-semibold text-cyan">Threat intel online</p>
                    {threatIntel.urls.map((u: any, i: number) => (
                      <p key={i} className="text-[11px] text-on-surface-variant">
                        {u.listed ? '⛔' : '○'} {u.url} — {u.detail}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-danger mt-auto w-full"
                  onClick={() => {
                    setBlockTarget(inputText.slice(0, 80) || '');
                    setShowBlockModal(true);
                  }}
                >
                  <span className="material-symbols-outlined text-lg">block</span>
                  Báo cáo vào blacklist
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold">Báo cáo scammer</h3>
              <button type="button" className="btn-ghost !p-2" onClick={() => setShowBlockModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">STK / SĐT *</label>
                <input className="input-field font-mono" value={blockTarget} onChange={(e) => setBlockTarget(e.target.value)} placeholder="1903..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Mô tả</label>
                <textarea className="input-field min-h-[80px]" rows={3} value={blockDesc} onChange={(e) => setBlockDesc(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-secondary" onClick={() => setShowBlockModal(false)}>Hủy</button>
                <button type="button" className="btn-danger" disabled={isSubmittingBlock} onClick={handleConfirmBlockReport}>
                  {isSubmittingBlock ? 'Đang gửi…' : 'Gửi báo cáo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-panel max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Nhật Ký Quét & Giám Định Cộng Đồng
              </h3>
              <button type="button" className="btn-ghost !p-2" onClick={() => setShowHistoryModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingHistory ? (
                <p className="text-xs text-on-surface-variant text-center py-8">Đang tải nhật ký từ máy chủ...</p>
              ) : historyLogs.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">Chưa có dữ liệu quét gần đây</p>
              ) : (
                historyLogs.map((log) => (
                  <div key={log.id} className="card p-3 space-y-2 border border-white/5 hover:border-primary/30 transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className={log.isScam ? 'badge-danger' : 'badge-green'}>
                        {log.isScam ? `Cảnh báo rủi ro (${log.riskScore}/100)` : `An toàn (${log.riskScore}/100)`}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {log.imageUrl && (
                      <div className="my-1.5 overflow-hidden rounded-xl border border-white/10 max-h-48 bg-black/40 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={log.imageUrl} alt="Ảnh giám định" className="max-h-48 w-auto object-contain" />
                      </div>
                    )}

                    {log.scannedText && (
                      <p className="text-xs font-mono text-on-surface line-clamp-2 bg-surface p-2 rounded-lg border border-white/5">
                        "{log.scannedText}"
                      </p>
                    )}

                    <p className="text-xs text-on-surface-variant leading-relaxed">{log.analysisDetails}</p>

                    {log.redFlags && log.redFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {log.redFlags.map((flag: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded font-mono">
                            ⚠ {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 flex justify-between items-center text-xs text-on-surface-variant">
              <span>Tự động đồng bộ với Cơ Sở Dữ Liệu Chung</span>
              <button type="button" className="btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
