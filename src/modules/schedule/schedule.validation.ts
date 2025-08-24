import { z } from "zod";

export const scheduleValidation = {
  createShift: z.object({
    date: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
    role: z.string().min(1, "Role is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required"),
    location: z.string().min(1, "Location is required"),
    team: z.string().optional(),
    maxEmployees: z.number().positive().optional(),
    minEmployees: z.number().positive().default(1),
    notes: z.string().optional(),
  }),

  updateShift: z.object({
    date: z.string().datetime().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
    role: z.string().min(1, "Role is required").optional(),
    skills: z.array(z.string()).min(1, "At least one skill is required").optional(),
    location: z.string().min(1, "Location is required").optional(),
    team: z.string().optional(),
    maxEmployees: z.number().positive().optional(),
    minEmployees: z.number().positive().optional(),
    status: z.enum(['OPEN', 'FULL', 'CANCELLED']).optional(),
    notes: z.string().optional(),
  }),

  createTimeOffRequest: z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format").optional(),
    type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'OTHER']),
    reason: z.string().min(1, "Reason is required"),
  }),

  createRecurringTemplate: z.object({
    name: z.string().min(1, "Template name is required"),
    dayOfWeek: z.number().min(0).max(6, "Day of week must be 0-6"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
    role: z.string().min(1, "Role is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required"),
    location: z.string().min(1, "Location is required"),
    team: z.string().optional(),
    maxEmployees: z.number().positive().optional(),
    minEmployees: z.number().positive().default(1),
  }),

  generateShifts: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
}; 