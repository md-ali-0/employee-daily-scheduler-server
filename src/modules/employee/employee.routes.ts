import { authorizeRoles } from "@middlewares/auth.middleware"
import { globalRateLimiter } from "@middlewares/rate-limit.middleware"
import { validate } from "@middlewares/validation.middleware"
import { Role } from "@modules/user/user.interface"
import { Router } from "express"
import { EmployeeController } from "./employee.controller"
import { employeeSchema, updateEmployeeSchema } from "./employee.validation"

export class EmployeeRoutes {
  public router: Router
  private employeeController: EmployeeController

  constructor() {
    this.router = Router()
    this.employeeController = new EmployeeController()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // Apply global rate limiter
    this.router.use(globalRateLimiter)

    // Create Employee (Admin/Manager only)
    this.router.post(
      "/",
      authorizeRoles([Role.ADMIN, Role.MANAGER]),
      validate(employeeSchema, "body"),
      this.employeeController.createEmployee
    )

    // Get all employees (with pagination)
    this.router.get(
      "/",
      authorizeRoles([Role.ADMIN, Role.MANAGER]),
      this.employeeController.getEmployees
    )

    // Get single employee
    this.router.get(
      "/:id",
      authorizeRoles([Role.ADMIN, Role.MANAGER]),
      this.employeeController.getEmployeeById
    )

    // Update employee
    this.router.put(
      "/:id",
      authorizeRoles([Role.ADMIN, Role.MANAGER]),
      validate(updateEmployeeSchema, "body"),
      this.employeeController.updateEmployee
    )

    // Delete employee
    this.router.delete(
      "/:id",
      authorizeRoles([Role.ADMIN]),
      this.employeeController.deleteEmployee
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
