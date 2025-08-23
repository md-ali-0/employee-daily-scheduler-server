import { TooManyRequestsError } from "@core/error.classes"
import { rateLimit } from "express-rate-limit"
import i18n from "@config/i18n-compat"

/**
 * Global rate limiting middleware.
 * Limits each IP to 100 requests per 15 minutes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new TooManyRequestsError(i18n.__("errors.too_many_requests"), "errors.too_many_requests"))
  },
})

/**
 * Stricter rate limiting for authentication routes.
 * Limits each IP to 5 requests per 5 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new TooManyRequestsError(i18n.__("errors.too_many_auth_requests"), "errors.too_many_auth_requests"))
  },
})
