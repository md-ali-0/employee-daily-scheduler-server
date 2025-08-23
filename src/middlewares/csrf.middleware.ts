import env from "@config/env"
import i18n from "@config/i18n-compat"
import redisClient from "@config/redis"
import { ForbiddenError } from "@core/error.classes"
import RedisStore from "connect-redis"
import csurf from "csurf"
import type { NextFunction, Request, Response } from "express"
import session from "express-session"

// Session middleware configuration
export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: "lax", // Adjust as needed: 'strict', 'lax', 'none'
  },
})

// CSRF protection middleware
// export const csrfProtection = csurf({
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//   },
// })

// Custom middleware to skip CSRF on swagger routes
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api-docs") || req.path.startsWith("/swagger")) {
    console.log("done");
    
    return next() // Skip CSRF for Swagger UI routes
  }
  return csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
})
}


// Middleware to handle CSRF errors
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === "EBADCSRFTOKEN") {
    return next(new ForbiddenError(i18n.__("errors.csrf_token_invalid"), "errors.csrf_token_invalid"))
  }
  next(err)
}

// Middleware to set CSRF token in response headers for client-side use
export const setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.csrfToken) {
    res.cookie("XSRF-TOKEN", req.csrfToken())
  }
  next()
}
