import rateLimit from 'express-rate-limit';

/**
 * General rate limiter — 200 requests per 15 minutes per IP.
 * Applies to all routes by default.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health',
});

/**
 * Strict limiter for upload/webhook endpoints — 30 requests per 15 minutes.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests, please try again later.' },
});

/**
 * Mutation limiter for create/update/delete — 100 requests per 15 minutes.
 */
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
