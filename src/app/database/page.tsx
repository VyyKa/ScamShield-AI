'use client';

import React, { useEffect, useState } from 'react';
import { ScamRecord } from '@/types';
import { Toast } from '@/components/ui/Toast';
import { apiPost } from '@/lib/clientApi';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'bank_account', label: 'STK ngân hàng' },
  { id: 'phone_number', label: 'Số điện thoại' },
  { id: 'phishing_website', label: 'Website' },
  { id: 'zalo_account', label: 'Zalo / MXH' },
];

export default function DatabasePage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [records, setRecords] = useState<ScamRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [onlineIntel, setOnlineIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'danger' | 'warning'>('info');

  const [formCategory, setFormCategory] = useState<'bank_account' | 'phone_number' | 'zalo_account' | 'phishing_website'>('bank_account');
  const [formTarget, setFormTarget] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formType, setFormType] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (m: string, variant: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setToastVariant(variant);
    setToast(m);
  };

  const fetchRecords = async (searchQuery?: string, categoryToUse?: string) => {
    setIsLoading(true);
    const q = searchQuery !== undefined ? searchQuery : query;
    const cat = categoryToUse !== undefined ? categoryToUse : selectedCategory;
    try {
      const url = new URL('/api/database', window.location.origin);
      if (q.trim()) url.searchParams.set('q', q.trim());
      if (cat && cat !== 'all') url.searchParams.set('category', cat);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setRecords(data.results);
        setTotalRecords(data.totalRecords || data.results.length);
        setOnlineIntel(data.onlineIntel || null);
      }
    } catch {
      notify('Không tải được dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let initialQ = '';
    let initialCat = 'all';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      initialQ = params.get('q') || '';
      initialCat = params.get('category') || 'all';
    }
    if (initialQ) setQuery(initialQ);
    if (initialCat) setSelectedCategory(initialCat);
    fetchRecords(initialQ, initialCat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTarget.trim() || !formType.trim()) {
      notify('Nhập đối tượng và hành vi lừa đảo');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await apiPost<{ success: boolean; message?: string; error?: string }>('/api/database', {
        category: formCategory,
        targetValue: formTarget,
        ownerName: formOwner,
        bankName: formBank,
        scamType: formType,
        description: formDesc,
      });
      if (data.success) {
        notify(data.message || 'Đã ghi nhận báo cáo', 'success');
        setShowReport(false);
        setFormTarget('');
        setFormOwner('');
        setFormBank('');
        setFormType('');
        setFormDesc('');
        fetchRecords(query, selectedCategory);
      } else {
        notify(data.error || 'Lỗi gửi báo cáo', 'danger');
      }
    } catch (err: any) {
      notify(err.message || 'Lỗi kết nối', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconFor = (cat: string) => {
    switch (cat) {
      case 'bank_account': return 'account_balance';
      case 'phone_number': return 'call';
      case 'phishing_website': return 'language';
      case 'zalo_account': return 'chat';
      default: return 'warning';
    }
  };

  return (
    <div className="page-wrap space-y-5">
      <Toast message={toast} variant={toastVariant} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="section-title">Kho cảnh báo</h1>
          <p className="section-sub">
            Tra STK / SĐT / domain. Domain sẽ kiểm tra thêm URLhaus + DNS Google.
          </p>
        </div>
        <button type="button" className="btn-danger shrink-0" onClick={() => setShowReport(true)}>
          <span className="material-symbols-outlined text-lg">add_alert</span>
          Báo cáo mới
        </button>
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            fetchRecords(query, selectedCategory);
          }}
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="input-field pl-10 font-mono text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="STK, SĐT, domain phishing..."
            />
          </div>
          <button type="submit" className="btn-primary shrink-0" disabled={isLoading}>
            {isLoading ? 'Đang tra…' : 'Tra cứu'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategory(c.id);
                fetchRecords(query, c.id);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === c.id
                  ? 'border-primary/40 bg-primary-soft text-primary'
                  : 'border-white/10 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {onlineIntel && (
        <div className="card border-cyan/25 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-cyan">
            Intel online · {(onlineIntel.sources || []).join(' · ')}
          </p>
          {onlineIntel.urlhaus && (
            <p className="text-sm">
              <span className="font-semibold">URLhaus: </span>
              <span className={onlineIntel.urlhaus.listed ? 'text-danger' : 'text-primary'}>
                {onlineIntel.urlhaus.detail}
              </span>
            </p>
          )}
          {onlineIntel.urlscan && (
            <p className="text-sm">
              <span className="font-semibold">urlscan.io: </span>
              <span
                className={
                  onlineIntel.urlscan.maliciousHints?.length ? 'text-danger' : 'text-on-surface-variant'
                }
              >
                {onlineIntel.urlscan.detail}
              </span>
            </p>
          )}
          {onlineIntel.safeBrowsing && (
            <p className="text-sm">
              <span className="font-semibold">Safe Browsing: </span>
              <span className={onlineIntel.safeBrowsing.listed ? 'text-danger' : 'text-on-surface-variant'}>
                {onlineIntel.safeBrowsing.detail}
              </span>
            </p>
          )}
          {onlineIntel.dns && (
            <p className="text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">DNS: </span>
              {onlineIntel.dns.detail}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span>
          Hiển thị <strong className="text-on-surface">{records.length}</strong> / tổng {totalRecords}
        </span>
        {isLoading && <span className="text-primary">Đang tải…</span>}
      </div>

      {records.length === 0 && !isLoading ? (
        <div className="card py-14 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl text-primary opacity-50">verified_user</span>
          <p className="text-sm font-semibold">Không có bản ghi khớp</p>
          <p className="mt-1 text-xs text-on-surface-variant">Bạn có thể gửi báo cáo mới để cảnh báo cộng đồng.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {records.map((item) => (
            <article key={item.id} className="card-hover p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="icon-box-amber shrink-0">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {iconFor(item.category)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold text-danger">{item.targetValue}</p>
                    {(item.ownerName || item.bankName) && (
                      <p className="truncate text-xs text-on-surface-variant">
                        {item.ownerName}
                        {item.bankName ? ` · ${item.bankName}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={item.riskLevel === 'CRITICAL' ? 'badge-danger' : 'badge-amber'}>
                    {item.riskLevel === 'CRITICAL' ? 'CRITICAL' : item.riskLevel}
                  </span>
                  <span className="badge-green text-[10px]">
                    {item.status === 'VERIFIED' || item.status === 'VERIFIED_SCAM'
                      ? 'VERIFIED'
                      : item.status === 'UNDER_REVIEW' || item.status === 'UNDER_INVESTIGATION'
                        ? 'REVIEW'
                        : String(item.status)}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold">{item.scamType}</h3>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">{item.description}</p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-white/[0.06] pt-2 text-[11px] text-on-surface-variant light:border-[var(--hairline)]">
                <span>
                  Tố giác: <strong className="text-danger">{item.reportCount}</strong>
                  {typeof item.confirmCount === 'number' && (
                    <> · Confirm: <strong className="text-primary">{item.confirmCount}</strong></>
                  )}
                  {typeof item.confidenceScore === 'number' && (
                    <> · Score: <strong>{item.confidenceScore}</strong></>
                  )}
                </span>
                <span>{item.lastReported}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Báo cáo scammer</h3>
              <button type="button" className="btn-ghost !p-2" onClick={() => setShowReport(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-3">
              <select
                className="input-field"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
              >
                <option value="bank_account">Số tài khoản</option>
                <option value="phone_number">Số điện thoại</option>
                <option value="phishing_website">Website phishing</option>
                <option value="zalo_account">Zalo / MXH</option>
              </select>
              <input
                className="input-field font-mono"
                required
                placeholder="STK / SĐT / domain *"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input className="input-field" placeholder="Tên chủ TK" value={formOwner} onChange={(e) => setFormOwner(e.target.value)} />
                <input className="input-field" placeholder="Ngân hàng" value={formBank} onChange={(e) => setFormBank(e.target.value)} />
              </div>
              <input
                className="input-field"
                required
                placeholder="Hành vi lừa đảo *"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
              <textarea
                className="input-field min-h-[80px]"
                placeholder="Chi tiết / bằng chứng"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-secondary" onClick={() => setShowReport(false)}>Hủy</button>
                <button type="submit" className="btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi…' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
