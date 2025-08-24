import { BadRequestError } from "@core/error.classes";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { IShift, ITimeOffRequest } from "./schedule.interface";
import { ScheduleService } from "./schedule.service";
import { scheduleValidation } from "./schedule.validation";

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  // Shift Management
  public createShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = scheduleValidation.createShift.parse(req.body);
      // Convert date string to Date object
      const shiftData: Partial<IShift> = {
        ...validatedData,
        date: new Date(validatedData.date)
      };
      const shift = await this.scheduleService.createShift(shiftData);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.shift_created"),
        data: shift
      });
    } catch (error) {
      next(error);
    }
  };

  public updateShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = scheduleValidation.updateShift.parse(req.body);
      // Convert date string to Date object if present
      const { date, ...restData } = validatedData;
      const updateData: Partial<IShift> = {
        ...restData,
        ...(date && { date: new Date(date) })
      };
      const shift = await this.scheduleService.updateShift(id, updateData);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.shift_updated"),
        data: shift
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteShift(id);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.shift_deleted")
      });
    } catch (error) {
      next(error);
    }
  };

  public getShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // Use the schedule service to find shift
      const shift = await this.scheduleService.findById(id);
      
      res.status(200).json({
        success: true,
        data: shift
      });
    } catch (error) {
      next(error);
    }
  };

  public getShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, location, team, role, date } = req.query;
      
      // For now, use a simple find all approach since the service doesn't have proper pagination
      const shifts = await this.scheduleService.getAll({
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json({
        success: true,
        data: shifts
      });
    } catch (error) {
      next(error);
    }
  };

  // Shift Assignment
  public assignEmployeeToShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shiftId, employeeId } = req.params;
      const assignment = await this.scheduleService.assignEmployeeToShift(
        shiftId,
        employeeId,
        req.user!.id
      );
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.employee_assigned"),
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  };

  public removeEmployeeFromShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shiftId, employeeId } = req.params;
      await this.scheduleService.removeEmployeeFromShift(shiftId, employeeId);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.employee_removed")
      });
    } catch (error) {
      next(error);
    }
  };

  // Time-off Management
  public createTimeOffRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = scheduleValidation.createTimeOffRequest.parse(req.body);
      const requestData: Partial<ITimeOffRequest> = {
        ...validatedData,
        employeeId: new Types.ObjectId(validatedData.employeeId),
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate)
      };
      const request = await this.scheduleService.createTimeOffRequest(requestData);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.time_off_requested"),
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  public approveTimeOffRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const request = await this.scheduleService.approveTimeOffRequest(
        id,
        req.user!.id
      );
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.time_off_approved"),
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  public rejectTimeOffRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const request = await this.scheduleService.rejectTimeOffRequest(
        id,
        req.user!.id
      );
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.time_off_rejected"),
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  public getTimeOffRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, status, employeeId } = req.query;
      
      // For now, use a simple find all approach
      const requests = await this.scheduleService.getAll({
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  };

  // Daily Schedule
  public getDailySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, location, team } = req.query;
      
      if (!date) {
        throw new BadRequestError("Date parameter is required");
      }
      
      const schedule = await this.scheduleService.getDailySchedule(
        new Date(date as string),
        location as string,
        team as string
      );
      
      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  };

  // Coverage Analytics
  public getCoverageAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, location, team } = req.query;
      
      if (!date) {
        throw new BadRequestError("Date parameter is required");
      }
      
      const analytics = await this.scheduleService.getCoverageAnalytics(
        new Date(date as string),
        location as string,
        team as string
      );
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  };

  // Workload Analytics
  public getEmployeeWorkload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new BadRequestError("Start date and end date are required");
      }
      
      const workload = await this.scheduleService.getEmployeeWorkload(
        employeeId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.status(200).json({
        success: true,
        data: workload
      });
    } catch (error) {
      next(error);
    }
  };

  // Conflict Detection
  public detectConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const { shiftId } = req.query;
      
      const conflicts = await this.scheduleService.detectConflicts(
        employeeId,
        shiftId as string
      );
      
      res.status(200).json({
        success: true,
        data: conflicts
      });
    } catch (error) {
      next(error);
    }
  };

  // Recurring Templates
  public createRecurringTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = scheduleValidation.createRecurringTemplate.parse(req.body);
      const template = await this.scheduleService.createRecurringTemplate(validatedData);
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.template_created"),
        data: template
      });
    } catch (error) {
      next(error);
    }
  };

  public generateShiftsFromTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new BadRequestError("Start date and end date are required");
      }
      
      const shifts = await this.scheduleService.generateShiftsFromTemplate(
        templateId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.status(200).json({
        success: true,
        message: req.t("schedule.shifts_generated"),
        data: shifts
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecurringTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, isActive } = req.query;
      
      // For now, use a simple find all approach
      const templates = await this.scheduleService.getAll({
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  };
} 