import { Document, Types } from "mongoose";

export interface IShift extends Document {
  _id: Types.ObjectId;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  role: string;
  skills: string[];
  location: string;
  team?: string;
  assignedEmployees: Types.ObjectId[];
  maxEmployees?: number;
  minEmployees?: number;
  isOvernight: boolean;
  status: 'OPEN' | 'FULL' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeOffRequest extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: string; // HH:mm format for partial day
  endTime?: string;   // HH:mm format for partial day
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShiftAssignment extends Document {
  _id: Types.ObjectId;
  shiftId: Types.ObjectId;
  employeeId: Types.ObjectId;
  assignedAt: Date;
  assignedBy: Types.ObjectId;
  status: 'ASSIGNED' | 'CONFIRMED' | 'DECLINED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoverageAnalytics {
  date: Date;
  location: string;
  team?: string;
  role: string;
  required: number;
  assigned: number;
  coverage: number; // percentage
  gaps: number;
  conflicts: number;
  utilization: number; // percentage
}

export interface IScheduleConflict {
  type: 'OVERLAP' | 'DOUBLE_BOOKING' | 'TIME_OFF_CLASH' | 'AVAILABILITY_MISMATCH';
  employeeId: Types.ObjectId;
  shiftId: Types.ObjectId;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface IRecurringShiftTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  role: string;
  skills: string[];
  location: string;
  team?: string;
  maxEmployees?: number;
  minEmployees?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkloadAnalytics {
  employeeId: Types.ObjectId;
  employeeName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  totalHours: number;
  totalShifts: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  utilization: number; // percentage
} 