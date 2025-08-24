import { model, Schema } from "mongoose";
import {
    IRecurringShiftTemplate,
    IShift,
    IShiftAssignment,
    ITimeOffRequest
} from "./schedule.interface";

// Shift Schema
const ShiftSchema = new Schema<IShift>({
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  role: { type: String, required: true, index: true },
  skills: { type: [String], required: true },
  location: { type: String, required: true, index: true },
  team: { type: String, index: true },
  assignedEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  maxEmployees: { type: Number },
  minEmployees: { type: Number, default: 1 },
  isOvernight: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['OPEN', 'FULL', 'CANCELLED'], 
    default: 'OPEN',
    index: true 
  },
  notes: { type: String },
}, { 
  timestamps: true
});

// Time-off Request Schema
const TimeOffRequestSchema = new Schema<ITimeOffRequest>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  startTime: { type: String, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, match: /^\d{2}:\d{2}$/ },
  type: { 
    type: String, 
    enum: ['VACATION', 'SICK', 'PERSONAL', 'OTHER'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING',
    index: true 
  },
  reason: { type: String, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { 
  timestamps: true
});

// Shift Assignment Schema
const ShiftAssignmentSchema = new Schema<IShiftAssignment>({
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true, index: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'CONFIRMED', 'DECLINED'], 
    default: 'ASSIGNED',
    index: true 
  },
  notes: { type: String },
}, { 
  timestamps: true
});

// Recurring Shift Template Schema
const RecurringShiftTemplateSchema = new Schema<IRecurringShiftTemplate>({
  name: { type: String, required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0-6 (Sunday-Saturday)
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  role: { type: String, required: true },
  skills: { type: [String], required: true },
  location: { type: String, required: true },
  team: { type: String },
  maxEmployees: { type: Number },
  minEmployees: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true
});

export const ShiftModel = model<IShift>("Shift", ShiftSchema);
export const TimeOffRequestModel = model<ITimeOffRequest>("TimeOffRequest", TimeOffRequestSchema);
export const ShiftAssignmentModel = model<IShiftAssignment>("ShiftAssignment", ShiftAssignmentSchema);
export const RecurringShiftTemplateModel = model<IRecurringShiftTemplate>("RecurringShiftTemplate", RecurringShiftTemplateSchema); 