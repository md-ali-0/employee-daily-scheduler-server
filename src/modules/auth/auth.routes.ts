
import env from "@config/env"
import logger from "@config/winston"
import { sessionMiddleware } from "@middlewares/csrf.middleware"
import { authRateLimiter, globalRateLimiter } from "@middlewares/rate-limit.middleware"
import { validate } from "@middlewares/validation.middleware"
import { IUser } from "@modules/user/user.interface"
import { UserModel } from "@modules/user/user.model"
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
        const user = await UserModel.findById(id).lean();
        done(null, user);
      } catch (error) {
        done(error, null);
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
              let user = await UserModel.findOne({ googleId: profile.id }).lean();

              if (!user) {
                user = await UserModel.findOne({ email: profile.emails?.[0]?.value }).lean();
                if (user) {
                  await UserModel.findByIdAndUpdate(user._id, { googleId: profile.id });
                  user = await UserModel.findById(user._id).lean();
                  if (!user) {
                    return done(new Error("User not found after linking Google account."), undefined);
                  }
                  logger.info(`Linked existing user ${user.email} to Google account.`);
                  await auditLogUtil.logAudit("user", user._id.toString(), "GOOGLE_LINK", null, user, user._id.toString(), "N/A", "N/A");
                } else {
                  const newUser = await UserModel.create({
                    email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
                    name: profile.displayName,
                    googleId: profile.id,
                    role: "USER",
                  });
                  logger.info(`Created new user ${newUser.email} via Google OAuth.`);
                  await auditLogUtil.logAudit("user", newUser._id.toString(), "GOOGLE_REGISTER", null, newUser, newUser._id.toString(), "N/A", "N/A");
                  // @ts-ignore
                  user = newUser as IUser;
                }
              }
              // @ts-ignore
              done(null, user);
            } catch (error) {
              logger.error("Google OAuth callback error:", error);
              done(error, undefined);
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
