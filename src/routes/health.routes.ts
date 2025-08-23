import { authenticate } from "@middlewares/auth.middleware"
import { Router } from "express"

export class HealthRoutes {
  public router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // Basic health check
    this.router.get("/", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        cookies: req.cookies,
        headers: {
          authorization: req.headers.authorization ? "present" : "missing",
          "user-agent": req.headers["user-agent"],
        },
      })
    })

    // Protected health check
    this.router.get("/protected", authenticate, (req, res) => {
      res.json({
        status: "authenticated",
        user: req.user,
        timestamp: new Date().toISOString(),
        cookies: req.cookies,
      })
    })

    // Test endpoint for debugging
    this.router.get("/test", (req, res) => {
      res.json({
        message: "Server is running",
        cookies: req.cookies,
        headers: req.headers,
        timestamp: new Date().toISOString(),
      })
    })
  }

  public getRouter(): Router {
    return this.router
  }
}
