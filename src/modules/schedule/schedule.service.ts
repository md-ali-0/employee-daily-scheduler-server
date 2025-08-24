import { BaseService } from "@core/base.service";
import { BadRequestError, NotFoundError } from "@core/error.classes";
import { Types } from "mongoose";
import {
  ICoverageAnalytics,
  IRecurringShiftTemplate,
  IScheduleConflict,
  IShift,
  IShiftAssignment,
  ITimeOffRequest,
  IWorkloadAnalytics
} from "./schedule.interface";
import {
  RecurringShiftTemplateModel,
  ShiftAssignmentModel,
  ShiftModel,
  TimeOffRequestModel
} from "./schedule.model";

export class ScheduleService extends BaseService<IShift> {
  
  constructor() {
    super(ShiftModel);
  }

  // Shift Management
  async createShift(shiftData: Partial<IShift>): Promise<IShift> {
    // Validate time format and overnight logic
    this.validateShiftTimes(shiftData.startTime!, shiftData.endTime!);
    
    const shift = new ShiftModel(shiftData);
    return await shift.save();
  }

  async updateShift(shiftId: string, updateData: Partial<IShift>): Promise<IShift> {
    if (updateData.startTime && updateData.endTime) {
      this.validateShiftTimes(updateData.startTime, updateData.endTime);
    }
    
    const shift = await ShiftModel.findByIdAndUpdate(
      shiftId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!shift) {
      throw new NotFoundError("Shift not found");
    }
    
    return shift;
  }

  async deleteShift(shiftId: string): Promise<void> {
    const shift = await ShiftModel.findByIdAndDelete(shiftId);
    if (!shift) {
      throw new NotFoundError("Shift not found");
    }
    
    // Clean up assignments
    await ShiftAssignmentModel.deleteMany({ shiftId });
  }

  // Shift Assignment
  async assignEmployeeToShift(shiftId: string, employeeId: string, assignedBy: string): Promise<IShiftAssignment> {
    // Check if shift exists and has capacity
    const shift = await ShiftModel.findById(shiftId);
    if (!shift) {
      throw new NotFoundError("Shift not found");
    }
    
    if (shift.status === 'CANCELLED') {
      throw new BadRequestError("Cannot assign to cancelled shift");
    }
    
    if (shift.maxEmployees && shift.assignedEmployees.length >= shift.maxEmployees) {
      throw new BadRequestError("Shift is at maximum capacity");
    }
    
    // Check for conflicts
    const conflicts = await this.detectConflicts(employeeId, shiftId);
    if (conflicts.length > 0) {
      throw new BadRequestError(`Assignment conflicts detected: ${conflicts.map(c => c.description).join(', ')}`);
    }
    
    // Create assignment
    const assignment = new ShiftAssignmentModel({
      shiftId,
      employeeId,
      assignedBy,
      status: 'ASSIGNED'
    });
    
    await assignment.save();
    
    // Update shift
    await ShiftModel.findByIdAndUpdate(shiftId, {
      $addToSet: { assignedEmployees: employeeId }
    });
    
    // Update shift status if full
    if (shift.maxEmployees && shift.assignedEmployees.length + 1 >= shift.maxEmployees) {
      await ShiftModel.findByIdAndUpdate(shiftId, { status: 'FULL' });
    }
    
    return assignment;
  }

  async removeEmployeeFromShift(shiftId: string, employeeId: string): Promise<void> {
    const assignment = await ShiftAssignmentModel.findOneAndDelete({ shiftId, employeeId });
    if (!assignment) {
      throw new NotFoundError("Assignment not found");
    }
    
    // Update shift
    await ShiftModel.findByIdAndUpdate(shiftId, {
      $pull: { assignedEmployees: employeeId },
      status: 'OPEN' // Reset status to open
    });
  }

  // Time-off Management
  async createTimeOffRequest(requestData: Partial<ITimeOffRequest>): Promise<ITimeOffRequest> {
    const request = new TimeOffRequestModel(requestData);
    return await request.save();
  }

  async approveTimeOffRequest(requestId: string, approvedBy: string): Promise<ITimeOffRequest> {
    const request = await TimeOffRequestModel.findByIdAndUpdate(
      requestId,
      { 
        status: 'APPROVED', 
        approvedBy, 
        approvedAt: new Date() 
      },
      { new: true }
    );
    
    if (!request) {
      throw new NotFoundError("Time-off request not found");
    }
    
    return request;
  }

  async rejectTimeOffRequest(requestId: string, approvedBy: string): Promise<ITimeOffRequest> {
    const request = await TimeOffRequestModel.findByIdAndUpdate(
      requestId,
      { 
        status: 'REJECTED', 
        approvedBy, 
        approvedAt: new Date() 
      },
      { new: true }
    );
    
    if (!request) {
      throw new NotFoundError("Time-off request not found");
    }
    
    return request;
  }

  // Daily Schedule
  async getDailySchedule(date: Date, location?: string, team?: string): Promise<IShift[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const query: any = { date: { $gte: startOfDay, $lt: endOfDay } };
    
    if (location) query.location = location;
    if (team) query.team = team;
    
    return await ShiftModel.find(query)
      .populate('assignedEmployees', 'name email role')
      .sort({ startTime: 1 });
  }

  // Coverage Analytics
  async getCoverageAnalytics(date: Date, location?: string, team?: string): Promise<ICoverageAnalytics[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Use simple find instead of aggregation for now
    const query: any = { 
      date: { $gte: startOfDay, $lt: endOfDay }
    };
    
    if (location) query.location = location;
    if (team) query.team = team;
    
    const shifts = await ShiftModel.find(query);
    
    // Group by location, team, and role
    const grouped = shifts.reduce((acc, shift) => {
      const key = `${shift.location}-${shift.team || 'no-team'}-${shift.role}`;
      if (!acc[key]) {
        acc[key] = {
          date: shift.date,
          location: shift.location,
          team: shift.team,
          role: shift.role,
          required: 0,
          assigned: 0,
          coverage: 0,
          gaps: 0,
          conflicts: 0,
          utilization: 0
        };
      }
      
      acc[key].required += shift.minEmployees || 1;
      acc[key].assigned += shift.assignedEmployees.length;
      
      return acc;
    }, {} as Record<string, ICoverageAnalytics>);
    
    // Calculate coverage percentages
    Object.values(grouped).forEach(item => {
      item.coverage = item.required > 0 ? (item.assigned / item.required) * 100 : 0;
      item.gaps = Math.max(0, item.required - item.assigned);
      item.utilization = item.required > 0 ? (item.assigned / item.required) * 100 : 0;
    });
    
    return Object.values(grouped);
  }

  // Workload Analytics
  async getEmployeeWorkload(employeeId: string, startDate: Date, endDate: Date): Promise<IWorkloadAnalytics> {
    const pipeline = [
      {
        $match: {
          assignedEmployees: new Types.ObjectId(employeeId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $addFields: {
          shiftDuration: {
            $divide: [
              {
                $subtract: [
                  { $dateFromString: { dateString: { $concat: ["$date", " ", "$endTime"] } } },
                  { $dateFromString: { dateString: { $concat: ["$date", " ", "$startTime"] } } }
                ]
              },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$shiftDuration" },
          totalShifts: { $sum: 1 },
          dateRange: {
            start: { $min: "$date" },
            end: { $max: "$date" }
          }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $project: {
          employeeId: new Types.ObjectId(employeeId),
          employeeName: { $arrayElemAt: ["$employee.name", 0] },
          dateRange: 1,
          totalHours: 1,
          totalShifts: 1,
          averageHoursPerDay: {
            $divide: [
              "$totalHours",
              {
                $add: [
                  {
                    $divide: [
                      { $subtract: ["$dateRange.end", "$dateRange.start"] },
                      1000 * 60 * 60 * 24
                    ]
                  },
                  1
                ]
              }
            ]
          },
          overtimeHours: { $max: [{ $subtract: ["$totalHours", 40] }, 0] },
          utilization: {
            $multiply: [
              { $divide: ["$totalHours", 40] },
              100
            ]
          }
        }
      }
    ];

    const result = await ShiftModel.aggregate(pipeline);
    return result[0] || {
      employeeId: new Types.ObjectId(employeeId),
      employeeName: "",
      dateRange: { start: startDate, end: endDate },
      totalHours: 0,
      totalShifts: 0,
      averageHoursPerDay: 0,
      overtimeHours: 0,
      utilization: 0
    };
  }

  // Conflict Detection
  async detectConflicts(employeeId: string, shiftId?: string): Promise<IScheduleConflict[]> {
    const conflicts: IScheduleConflict[] = [];
    
    // Get employee's existing assignments
    const existingAssignments = await ShiftModel.find({
      assignedEmployees: employeeId,
      ...(shiftId && { _id: { $ne: shiftId } })
    });
    
    // Get time-off requests
    const timeOffRequests = await TimeOffRequestModel.find({
      employeeId,
      status: 'APPROVED'
    });
    
    // Check for overlaps with existing shifts
    for (const assignment of existingAssignments) {
      for (const otherAssignment of existingAssignments) {
        if (assignment._id.toString() !== otherAssignment._id.toString()) {
          if (this.shiftsOverlap(assignment, otherAssignment)) {
            conflicts.push({
              type: 'DOUBLE_BOOKING',
              employeeId: new Types.ObjectId(employeeId),
              shiftId: assignment._id,
              description: `Double booking with shift on ${otherAssignment.date}`,
              severity: 'HIGH'
            });
          }
        }
      }
    }
    
    // Check for time-off conflicts
    for (const timeOff of timeOffRequests) {
      for (const assignment of existingAssignments) {
        if (this.timeOffConflictsWithShift(timeOff, assignment)) {
          conflicts.push({
            type: 'TIME_OFF_CLASH',
            employeeId: new Types.ObjectId(employeeId),
            shiftId: assignment._id,
            description: `Conflicts with approved time-off from ${timeOff.startDate} to ${timeOff.endDate}`,
            severity: 'MEDIUM'
          });
        }
      }
    }
    
    return conflicts;
  }

  // Recurring Shift Templates
  async createRecurringTemplate(templateData: Partial<IRecurringShiftTemplate>): Promise<IRecurringShiftTemplate> {
    this.validateShiftTimes(templateData.startTime!, templateData.endTime!);
    
    const template = new RecurringShiftTemplateModel(templateData);
    return await template.save();
  }

  async generateShiftsFromTemplate(templateId: string, startDate: Date, endDate: Date): Promise<IShift[]> {
    const template = await RecurringShiftTemplateModel.findById(templateId);
    if (!template) {
      throw new NotFoundError("Template not found");
    }
    
    const shifts: IShift[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (currentDate.getDay() === template.dayOfWeek) {
        const shift = new ShiftModel({
          date: new Date(currentDate),
          startTime: template.startTime,
          endTime: template.endTime,
          role: template.role,
          skills: template.skills,
          location: template.location,
          team: template.team,
          maxEmployees: template.maxEmployees,
          minEmployees: template.minEmployees,
          isOvernight: this.isOvernightShift(template.startTime, template.endTime)
        });
        
        shifts.push(await shift.save());
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return shifts;
  }

  // Utility Methods
  async findById(id: string): Promise<any> {
    const shift = await ShiftModel.findById(id);
    if (!shift) {
      throw new NotFoundError("Shift not found");
    }
    return shift;
  }

  async getAll(filters: any = {}): Promise<any> {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      ShiftModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      ShiftModel.countDocuments()
    ]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  private validateShiftTimes(startTime: string, endTime: string): void {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestError("Invalid time format. Use HH:mm format");
    }
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
      throw new BadRequestError("End time must be after start time");
    }
  }

  private isOvernightShift(startTime: string, endTime: string): boolean {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return end < start;
  }

  private shiftsOverlap(shift1: IShift, shift2: IShift): boolean {
    if (shift1.date.toDateString() !== shift2.date.toDateString()) {
      return false;
    }
    
    const start1 = new Date(`2000-01-01T${shift1.startTime}:00`);
    const end1 = new Date(`2000-01-01T${shift1.endTime}:00`);
    const start2 = new Date(`2000-01-01T${shift2.startTime}:00`);
    const end2 = new Date(`2000-01-01T${shift2.endTime}:00`);
    
    return start1 < end2 && start2 < end1;
  }

  private timeOffConflictsWithShift(timeOff: ITimeOffRequest, shift: IShift): boolean {
    const shiftDate = shift.date.toDateString();
    const timeOffStart = timeOff.startDate.toDateString();
    const timeOffEnd = timeOff.endDate.toDateString();
    
    // Check if shift date falls within time-off period
    if (shiftDate >= timeOffStart && shiftDate <= timeOffEnd) {
      // If time-off has specific times, check for overlap
      if (timeOff.startTime && timeOff.endTime) {
        const shiftStart = new Date(`2000-01-01T${shift.startTime}:00`);
        const shiftEnd = new Date(`2000-01-01T${shift.endTime}:00`);
        const timeOffStartTime = new Date(`2000-01-01T${timeOff.startTime}:00`);
        const timeOffEndTime = new Date(`2000-01-01T${timeOff.endTime}:00`);
        
        return shiftStart < timeOffEndTime && timeOffStartTime < shiftEnd;
      }
      
      return true; // Full day time-off
    }
    
    return false;
  }
} 