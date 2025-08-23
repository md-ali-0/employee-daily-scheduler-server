import env from "@config/env"
import redisClient from "@config/redis"
import { setupSentryErrorHandler } from "@config/sentry"
import { setupSwagger } from "@config/swagger"
import { NotFoundError } from "@core/error.classes"
import { errorHandler } from "@middlewares/error.handler"
import { i18nMiddleware } from "@middlewares/i18n.middleware"
import { metricsMiddleware } from "@middlewares/metrics.middleware"
import { requestIdMiddleware } from "@middlewares/request-id.middleware"
import { requestLoggerMiddleware } from "@middlewares/request-logger.middleware"
import { FileService } from "@modules/file/file.service"
import { MainRouter } from "@routes/index"
import RedisStore from "connect-redis"
import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import session from "express-session"
import helmet from "helmet"
import morgan from "morgan"
import passport from "passport"
import "./config/passport"

class App {
  public app: express.Application
  private fileService: FileService // Instantiate FileService

  constructor() {
    this.app = express()
    this.fileService = new FileService() // Initialize FileService
    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddlewares() {
    // Setup Sentry Express error handler (Sentry is already initialized)
    setupSentryErrorHandler(this.app)
    // Core Middlewares
    this.app.use(express.json()) // Body parser for JSON
    this.app.use(express.urlencoded({ extended: true })) // Body parser for URL-encoded data
    this.app.use(cookieParser()) // Cookie parser

    // Session management for CSRF and Passport.js
    this.app.use(
      session({
        store: new RedisStore({ client: redisClient }),
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: env.NODE_ENV === "production", // Use secure cookies in production
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: "lax", // Protect against CSRF while allowing some cross-site requests
        },
      }),
    )

    // Passport.js initialization
    this.app.use(passport.initialize())
    this.app.use(passport.session())

    // CSRF protection (after session and cookie-parser)
    // this.app.use(csrfProtection as unknown as express.RequestHandler)
    // this.app.use(setCsrfToken) // Set CSRF token in res.locals for client-side access

    this.app.use(cors({
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Content-Type", "Authorization"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 600,
    })) // CORS protection
    this.app.use(helmet()) // Security headers
    this.app.use(morgan("dev")) // HTTP request logger
    this.app.use(requestIdMiddleware) // Add unique request ID
    this.app.use(requestLoggerMiddleware) // Log requests with request ID
    this.app.use(metricsMiddleware) // Use correct metrics middleware
    this.app.use(i18nMiddleware)

  
  }

  private initializeRoutes() {
  // Serve static files for local storage (if using LOCAL provider)

     if (env.STORAGE_TYPE === "LOCAL") {
      this.app.use("/uploads", express.static("uploads"))
    }
    // API Routes
    const mainRouter = new MainRouter()
    this.app.use("/", mainRouter.router)

    // Swagger API Documentation
    setupSwagger(this.app as any)

    // Catch-all for undefined routes
    this.app.use("*", (req, res, next) => {
      next(new NotFoundError(req.t("error.route_not_found", { url: req.originalUrl }))) // Use i18n
    })
  }

  private initializeErrorHandling() {
    // Sentry error handler is set up in initSentry
    // Custom error handling middleware
    this.app.use(errorHandler)
    // 404 Not Found handler
    // No separate notFoundHandler needed; handled by errorHandler and catch-all
  }

  public getApp(): express.Application {
    return this.app
  }
}

export default new App().getApp()
