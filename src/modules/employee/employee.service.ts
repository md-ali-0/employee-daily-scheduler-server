import i18n from "@config/i18n-compat";
import { BadRequestError, NotFoundError } from "@core/error.classes";
import { AuditLogModel } from "@modules/audit-log/audit-log.model";

import { EmployeeModel } from "./employee.model";
import type { EmployeeInput, UpdateEmployeeInput } from "./employee.validation";

export class EmployeeService {
  // Create new employee
  async createEmployee(data: EmployeeInput) {
    const existing = await EmployeeModel.findOne({ email: data.email }).exec();
    if (existing) {
      throw new BadRequestError(i18n.__("employee.already_exists"), "employee.already_exists");
    }

    const employee = await EmployeeModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      role: data.role,
      skills: data.skills,
      team: data.team,
      availability: data.availability || [],
    });

    await this.logActivity(String(employee._id), "CREATE_EMPLOYEE", null);

    return employee;
  }

  // Get all employees with pagination
  async getEmployees(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const employees = await EmployeeModel.find().skip(skip).limit(limit).exec();
    const total = await EmployeeModel.countDocuments();

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get employee by ID
  async getEmployeeById(id: string) {
    const employee = await EmployeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundError(i18n.__("employee.not_found"), "employee.not_found");
    }
    return employee;
  }

  // Update employee
  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    const employee = await EmployeeModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!employee) {
      throw new NotFoundError(i18n.__("employee.not_found"), "employee.not_found");
    }

    await this.logActivity(String(employee._id), "UPDATE_EMPLOYEE", null);

    return employee;
  }

  // Delete employee
  async deleteEmployee(id: string) {
    const employee = await EmployeeModel.findByIdAndDelete(id).exec();
    if (!employee) {
      throw new NotFoundError(i18n.__("employee.not_found"), "employee.not_found");
    }

    await this.logActivity(String(employee._id), "DELETE_EMPLOYEE", null);

    return true;
  }

  // Log activity in audit log
  private async logActivity(entityId: string, action: string, changedBy: string | null) {
    try {
      await AuditLogModel.create({
        entityType: "employee",
        entityId,
        action,
        changedBy,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to log employee activity:", error);
    }
  }
}
