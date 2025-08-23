import i18n from '@config/i18n-compat';
import { z } from 'zod';
import { Role } from './user.interface';

export const userIdSchema = z.object({
  id: z.string().uuid(i18n.__('validation.user_id_invalid_format')),
});

export const createUserSchema = z.object({
  email: z
    .string()
    .email(i18n.__('validation.email_invalid'))
    .min(1, i18n.__('validation.email_required')),
  password: z
    .string()
    .min(8, i18n.__('validation.password_min_length', { min: '8' }))
    .max(100, i18n.__('validation.password_max_length', { max: '100' })),
  name: z.string().min(1, i18n.__('validation.name_required')).optional(),
  role: z.nativeEnum(Role).default(Role.USER),
});

export const updateUserSchema = z.object({
  email: z.string().email(i18n.__('validation.email_invalid')).optional(),
  password: z
    .string()
    .min(8, i18n.__('validation.password_min_length', { min: '8' }))
    .max(100, i18n.__('validation.password_max_length', { max: '100' }))
    .optional(),
  name: z.string().min(1, i18n.__('validation.name_required')).optional(),
  role: z.nativeEnum(Role).optional(),
  failedLoginAttempts: z.number().int().min(0).optional(),
  lockUntil: z.string().datetime().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  avatar: z.string().url(i18n.__('validation.avatar_url_invalid')).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
