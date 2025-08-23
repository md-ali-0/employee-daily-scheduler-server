import { metricsMiddleware } from "@middlewares/metrics.middleware"
import { Router } from "express"

export class SystemRoutes {
  public router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // Metrics route
    this.router.get("/metrics", metricsMiddleware)

    // Swagger Docs - handled by setupSwagger in app.ts
  }

  public getRouter(): Router {
    return this.router
  }
}
