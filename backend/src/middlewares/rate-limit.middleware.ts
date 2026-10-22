import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  errorCode?: string;
  errorMessage?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Periodic cleanup every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in test environment unless specifically testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = (req.user?.id ?? req.ip ?? 'unknown').toString();
    const now = Date.now();

    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', options.maxRequests - 1);
      return next();
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      return next(
        new AppError(
          429,
          options.errorCode ?? 'RATE_LIMIT_EXCEEDED',
          options.errorMessage ?? 'Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.'
        )
      );
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
    next();
  };
}

// Preconfigured rate limiters based on PRD FR-OPS-001
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  errorCode: 'CHAT_RATE_LIMIT_EXCEEDED',
  errorMessage: 'Batas pengiriman pesan tercapai (maksimal 15 pesan per menit). Mohon tunggu sejenak.',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5,
  errorCode: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  errorMessage: 'Batas unggah dokumen tercapai (maksimal 5 dokumen per 10 menit).',
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  errorCode: 'RATE_LIMIT_EXCEEDED',
  errorMessage: 'Terlalu banyak permintaan ke server. Silakan coba lagi nanti.',
});
