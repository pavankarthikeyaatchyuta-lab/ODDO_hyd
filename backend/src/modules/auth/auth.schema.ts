import { z } from 'zod';

export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'VIEWER_AUDITOR']).default('WAREHOUSE_STAFF'),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const RequestOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
  }),
});

export const ResetPasswordOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type RequestOTPInput = z.infer<typeof RequestOTPSchema>['body'];
export type ResetPasswordOTPInput = z.infer<typeof ResetPasswordOTPSchema>['body'];
