import { NextRequest, NextResponse } from 'next/server';

// -----------------------------------------------------------------------------
// In-Memory Rate Limiter (Sliding Window per IP)
// -----------------------------------------------------------------------------

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitStore>();

// Cleanup stale IPs every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  ipRequestMap.forEach((store, ip) => {
    if (now > store.resetTime) {
      ipRequestMap.delete(ip);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit?: number; // max requests
  windowMs?: number; // duration in ms
}

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 20, windowMs: 60 * 1000 }
): { success: boolean; limit: number; remaining: number; reset: number } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const now = Date.now();
  const windowMs = options.windowMs || 60 * 1000;
  const limit = options.limit || 20;

  const current = ipRequestMap.get(ip);

  if (!current || now > current.resetTime) {
    ipRequestMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (current.count >= limit) {
    return { success: false, limit, remaining: 0, reset: current.resetTime };
  }

  current.count += 1;
  return { success: true, limit, remaining: limit - current.count, reset: current.resetTime };
}

// -----------------------------------------------------------------------------
// Input Sanitization & Payload Validation
// -----------------------------------------------------------------------------

export function sanitizeText(input?: string | null, maxLength = 2000): string {
  if (!input) return '';
  // Truncate to max length
  let cleaned = input.slice(0, maxLength);
  // Remove dangerous HTML/script tag injections
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/onload=/gi, '');
  cleaned = cleaned.replace(/onerror=/gi, '');
  return cleaned.trim();
}

export function enforceSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}
