import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validation.middleware";
import { Router } from "express";
import { ScheduleController } from "./schedule.controller";
import { scheduleValidation } from "./schedule.validation";

export class ScheduleRoutes {
  public router: Router;
  private scheduleController: ScheduleController;

  constructor() {
    this.router = Router();
    this.scheduleController = new ScheduleController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Apply auth middleware to all routes
    this.router.use(authenticate);

    // Shift Management
    this.router.post(
      "/shifts",
      validate(scheduleValidation.createShift, "body"),
      this.scheduleController.createShift
    );

    this.router.get("/shifts", this.scheduleController.getShifts);
    this.router.get("/shifts/:id", this.scheduleController.getShift);
    this.router.put(
      "/shifts/:id",
      validate(scheduleValidation.updateShift, "body"),
      this.scheduleController.updateShift
    );
    this.router.delete("/shifts/:id", this.scheduleController.deleteShift);

    // Shift Assignment
    this.router.post(
      "/shifts/:shiftId/assign/:employeeId",
      this.scheduleController.assignEmployeeToShift
    );
    this.router.delete(
      "/shifts/:shiftId/assign/:employeeId",
      this.scheduleController.removeEmployeeFromShift
    );

    // Time-off Management
    this.router.post(
      "/time-off",
      validate(scheduleValidation.createTimeOffRequest, "body"),
      this.scheduleController.createTimeOffRequest
    );
    this.router.get("/time-off", this.scheduleController.getTimeOffRequests);
    this.router.put(
      "/time-off/:id/approve",
      this.scheduleController.approveTimeOffRequest
    );
    this.router.put(
      "/time-off/:id/reject",
      this.scheduleController.rejectTimeOffRequest
    );

    // Daily Schedule
    this.router.get("/daily-schedule", this.scheduleController.getDailySchedule);

    // Coverage Analytics
    this.router.get("/coverage", this.scheduleController.getCoverageAnalytics);

    // Workload Analytics
    this.router.get(
      "/workload/:employeeId",
      this.scheduleController.getEmployeeWorkload
    );

    // Conflict Detection
    this.router.get(
      "/conflicts/:employeeId",
      this.scheduleController.detectConflicts
    );

    // Recurring Templates
    this.router.post(
      "/templates",
      validate(scheduleValidation.createRecurringTemplate, "body"),
      this.scheduleController.createRecurringTemplate
    );
    this.router.get("/templates", this.scheduleController.getRecurringTemplates);
    this.router.post(
      "/templates/:templateId/generate",
      this.scheduleController.generateShiftsFromTemplate
    );
  }
} 