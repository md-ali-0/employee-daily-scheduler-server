import i18n from "@config/i18n-compat";
import { Role } from "@modules/user/user.interface";
import { z } from "zod";

export const availabilitySchema = z.object({
  day: z
    .string()
    .min(1, i18n.__("validation.day_required")),
  start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, i18n.__("validation.start_time_invalid")), // e.g. "09:00"
  end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, i18n.__("validation.end_time_invalid")),   // e.g. "17:00"
});

export const employeeSchema = z.object({
  name: z
    .string()
    .min(1, i18n.__("validation.name_required")),
  email: z
    .string()
    .email(i18n.__("validation.email_invalid"))
    .min(1, i18n.__("validation.email_required")),
  phone: z
    .string()
    .optional()
    .or(z.literal("").optional()),

  role: z.enum([...Object.values(Role)] as [keyof typeof Role]),
  skills: z
    .array(z.string().min(1))
    .min(1, i18n.__("validation.skills_required")),
  team: z.string().optional(),
  availability: z
    .array(availabilitySchema)
    .optional(),

  location: z.string().optional(),
});

export const updateEmployeeSchema = employeeSchema.partial();

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
