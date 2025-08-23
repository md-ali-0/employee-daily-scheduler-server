import prisma from "@config/db"

import env from "@config/env"
import logger from "@config/winston"
import { sessionMiddleware } from "@middlewares/csrf.middleware"
import { authRateLimiter, globalRateLimiter } from "@middlewares/rate-limit.middleware"
import { validate } from "@middlewares/validation.middleware"
import { Role } from "@prisma/client"
import { AuditLogUtil } from "@utils/audit-log.util"
import { Router } from "express"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { AuthController } from "./auth.controller"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetPasswordWithOtpSchema,
  verifyOtpSchema,
} from './auth.validation'

const auditLogUtil = new AuditLogUtil()

export class AuthRoutes {
  public router: Router
  private authController: AuthController

  constructor() {
    this.router = Router()
    this.authController = new AuthController()
    this.initializePassport()
    this.initializeRoutes()
  }

  private initializePassport() {
    // Use session middleware for Passport.js
    this.router.use(sessionMiddleware)
    this.router.use(passport.initialize())
    this.router.use(passport.session())

    passport.serializeUser((user: any, done) => {
      done(null, user.id)
    })

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            userPermissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
        done(null, user)
      } catch (error) {
        done(error, null)
      }
    })

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_REDIRECT_URI,
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              let user = await prisma.user.findUnique({
                where: { googleId: profile.id },
                include: {
                  userPermissions: {
                    select: {
                      permission: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              })

              if (!user) {
                // Check if user exists with email
                user = await prisma.user.findUnique({
                  where: { email: profile.emails?.[0]?.value },
                  include: {
                    userPermissions: {
                      select: {
                        permission: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                })

                if (user) {
                  // Link existing user to Google account
                  user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.id },
                    include: {
                      userPermissions: {
                        select: {
                          permission: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  })
                  logger.info(`Linked existing user ${user.email} to Google account.`)
                  await auditLogUtil.logAudit("user", user.id, "GOOGLE_LINK", null, user, user.id, "N/A", "N/A")
                } else {
                  // Create new user
                  const newUser = await prisma.user.create({
                    data: {
                      email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
                      name: profile.displayName,
                      googleId: profile.id,
                      role: Role.USER, // Default role for new OAuth users
                    },
                    include: {
                      userPermissions: {
                        select: {
                          permission: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  })
                  logger.info(`Created new user ${newUser.email} via Google OAuth.`)
                  await auditLogUtil.logAudit(
                    "user",
                    newUser.id,
                    "GOOGLE_REGISTER",
                    null,
                    newUser,
                    newUser.id,
                    "N/A",
                    "N/A",
                  )
                  user = newUser
                }
              }
              done(null, user)
            } catch (error: any) {
              logger.error("Google OAuth callback error:", error)
              done(error, undefined)
            }
          },
        ),
      )
      logger.info("Google OAuth strategy initialized.")
    } else {
      logger.warn("Google OAuth environment variables not provided. Google OAuth will not be available.")
    }
  }

  private initializeRoutes() {
    // Apply global rate limiter to all auth routes
    this.router.use(globalRateLimiter)

    // Routes that require CSRF protection
  //  this.router.use(csrfProtection as unknown as RequestHandler)
  //   this.router.use(setCsrfToken) // Set CSRF token in cookie for client-side
  //   this.router.use(csrfErrorHandler) // Handle CSRF errors

    this.router.post("/register", authRateLimiter, validate(registerSchema, "body"), this.authController.register)
    this.router.post("/login", authRateLimiter, validate(loginSchema, "body"), this.authController.login)
    this.router.post("/logout", this.authController.logout)
    this.router.post("/refresh-token", this.authController.refreshToken)

        // Forgot password routes
        this.router.post(
          '/forgot-password',
          authRateLimiter,
          validate(forgotPasswordSchema, 'body'),
          this.authController.forgotPassword,
        );
        this.router.post(
          '/verify-otp',
          authRateLimiter,
          validate(verifyOtpSchema, 'body'),
          this.authController.verifyOtp,
        );
        this.router.post(
          '/reset-password',
          authRateLimiter,
          validate(resetPasswordSchema, 'body'),
          this.authController.resetPassword,
        );
        this.router.post(
          '/reset-password-otp',
          authRateLimiter,
          validate(resetPasswordWithOtpSchema, 'body'),
          this.authController.resetPasswordWithOtp,
        );

    // Google OAuth routes
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) {
      this.router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
      this.router.get(
        "/google/callback",
        passport.authenticate("google", { failureRedirect: "/login" }),
        this.authController.googleAuthCallback,
      )
      this.router.get("/success", this.authController.authSuccess) // Dummy success page
    }
  }

  public getRouter(): Router {
    return this.router
  }
}
