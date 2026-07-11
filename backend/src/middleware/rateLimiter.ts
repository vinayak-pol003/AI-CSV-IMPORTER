import rateLimit from "express-rate-limit";

/** Basic protection against abuse on processing-heavy endpoints. */
export const processRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests. Please slow down and try again shortly." },
  },
});
