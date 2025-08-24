import { HTTP_STATUS } from "@config/constants";
import i18n from "@config/i18n-compat";
import { errorResponse, successResponse } from "@core/response.util";
import type { NextFunction, Request, Response } from "express";
import { EmployeeService } from "./employee.service";
import type { EmployeeInput, UpdateEmployeeInput } from "./employee.validation";

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  /**
   * Create a new employee.
   */
  createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: EmployeeInput = req.body;
      const employee = await this.employeeService.createEmployee(data);

      successResponse(
        res,
        i18n.__("employee.create_success"),
        { employee },
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all employees with pagination.
   */
  getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = "1", limit = "10" } = req.query;
      const employees = await this.employeeService.getEmployees(
        Number(page),
        Number(limit)
      );

      successResponse(res, i18n.__("employee.list_success"), employees);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single employee by ID.
   */
  getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeById(id);

      if (!employee) {
        return errorResponse(
          res,
          i18n.__("employee.not_found"),
          HTTP_STATUS.NOT_FOUND,
          { path: req.path, message: i18n.__("employee.not_found") }
        );
      }

      successResponse(res, i18n.__("employee.fetch_success"), { employee });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update employee details.
   */
  updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: UpdateEmployeeInput = req.body;

      const employee = await this.employeeService.updateEmployee(id, data);

      if (!employee) {
        return errorResponse(
          res,
          i18n.__("employee.not_found"),
          HTTP_STATUS.NOT_FOUND,
          { path: req.path, message: i18n.__("employee.not_found") }
        );
      }

      successResponse(res, i18n.__("employee.update_success"), { employee });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete employee.
   */
  deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deleted = await this.employeeService.deleteEmployee(id);

      if (!deleted) {
        return errorResponse(
          res,
          i18n.__("employee.not_found"),
          HTTP_STATUS.NOT_FOUND,
          { path: req.path, message: i18n.__("employee.not_found") }
        );
      }

      successResponse(res, i18n.__("employee.delete_success"));
    } catch (error) {
      next(error);
    }
  };
}
