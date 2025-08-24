import { Router } from "express"

// Import all routes
import { AuthRoutes } from "@modules/auth/auth.routes"
import { FileRoutes } from "@modules/file/file.routes"
import { ScheduleRoutes } from "@modules/schedule/schedule.routes"
import { UserRoutes } from "@modules/user/user.routes"
import { HealthRoutes } from "@routes/health.routes"
import { SystemRoutes } from "@routes/system.routes"

export class MainRouter {
  public router: Router
  private readonly apiPrefix = "/api/v1"

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // Non-API routes
    this.router.use("/health", new HealthRoutes().router)

    // API routes configuration
    const routes: { path: string; handler: Router }[] = [
      { path: "/auth", handler: new AuthRoutes().router },
      { path: "/users", handler: new UserRoutes().router },
      { path: "/files", handler: new FileRoutes().router },
      { path: "/schedule", handler: new ScheduleRoutes().router },
      { path: "/system", handler: new SystemRoutes().router },
    ]

    // Dynamically mount all API routes
    routes.forEach(({ path, handler }) => {
      this.router.use(`${this.apiPrefix}${path}`, handler)
    })
  }
}
