import { z } from 'zod';

// Signup validation schema
export const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/, 'Password must contain letters and at least one number or special character'),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
});

// Login validation schema - supports either email or username
export const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required')
}).refine((data) => data.email || data.username, {
  message: 'Either email or username must be provided',
  path: ['email', 'username']
});

// OTP verification schema
export const otpVerificationSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers')
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address')
});

// Password reset schema
export const resetPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/, 'Password must contain letters and at least one number or special character'),
  passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm']
});

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OTPVerificationInput = z.infer<typeof otpVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;