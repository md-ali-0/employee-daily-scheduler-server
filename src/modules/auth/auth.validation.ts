import i18n from '@config/i18n-compat';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email(i18n.__('validation.email_invalid'))
    .min(1, i18n.__('validation.email_required')),
  password: z
    .string()
    .min(
      8,
      i18n.__('validation.password_min_length', { min: String(8) }),
    )
    .max(100, i18n.__('validation.password_max_length', { max: String(100) })),
  name: z.string().min(1, i18n.__('validation.name_required')).optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email(i18n.__('validation.email_invalid'))
    .min(1, i18n.__('validation.email_required')),
  password: z.string().min(1, i18n.__('validation.password_required')),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email(i18n.__('validation.email_invalid'))
    .min(1, i18n.__('validation.email_required')),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, i18n.__('validation.password_min_length', { min: String(8) }))
      .max(100, i18n.__('validation.password_max_length', { max: String(100) })),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email(i18n.__('validation.email_invalid'))
    .min(1, i18n.__('validation.email_required')),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordWithOtpSchema = z
  .object({
    email: z
      .string()
      .email(i18n.__('validation.email_invalid'))
      .min(1, i18n.__('validation.email_required')),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    password: z
      .string()
      .min(8, i18n.__('validation.password_min_length', { min: String(8) }))
      .max(100, i18n.__('validation.password_max_length', { max: String(100) })),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordWithOtpInput = z.infer<typeof resetPasswordWithOtpSchema>;
