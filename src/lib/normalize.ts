import type { ScamCategory } from '@/types';

/**
 * Chuẩn hóa target để dedupe (STK / SĐT / domain / Zalo).
 */
export function normalizeTargetValue(category: string, raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '';

  switch (category) {
    case 'bank_account': {
      // chỉ giữ chữ số
      return v.replace(/\D/g, '');
    }
    case 'phone_number':
    case 'zalo_account': {
      let digits = v.replace(/\D/g, '');
      // 0xxxxxxxxx → 84xxxxxxxxx
      if (digits.startsWith('0') && digits.length >= 9) {
        digits = `84${digits.slice(1)}`;
      }
      if (digits.startsWith('840')) {
        digits = `84${digits.slice(3)}`;
      }
      return digits;
    }
    case 'phishing_website': {
      try {
        const withProto = /^https?:\/\//i.test(v) ? v : `http://${v}`;
        const host = new URL(withProto).hostname.toLowerCase().replace(/^www\./, '');
        return host;
      } catch {
        return v.toLowerCase().replace(/^www\./, '').replace(/\/.*$/, '');
      }
    }
    default:
      return v.toLowerCase().replace(/\s+/g, ' ');
  }
}

export function isValidCategory(c: string): c is ScamCategory {
  return ['bank_account', 'phone_number', 'zalo_account', 'phishing_website'].includes(c);
}

/** Hiển thị relative time đơn giản (vi) */
export function formatLastReported(date: Date = new Date()): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}
