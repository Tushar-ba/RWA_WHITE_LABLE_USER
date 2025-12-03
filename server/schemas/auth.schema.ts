import { z } from "zod";

// Simplified signup schema - only name, email, password, confirmPassword
export const signupSchema = z.object({
  // name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).*$/, 
      "Password must contain at least 8 characters with letters and numbers"),
  confirm_password: z.string().min(1, "Please confirm your password"),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});


// Email verification schema
export const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.coerce.string().refine(val => val.length === 6, {
    message: "OTP must be 6 digits"
  })
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Update password schema
export const updatePasswordSchema = z.object({
  old_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters")
});

// Resend OTP schema
export const resendOTPSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  purpose: z.enum(["email_verification", "2fa"], {
    errorMap: () => ({ message: "Purpose must be 'email_verification' or '2fa'" })
  })
});

// 2FA verification schema
export const verify2FASchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.coerce.string().refine(val => val.length === 6, {
    message: "OTP must be 6 digits"
  })
});

// Type exports
export type SignupData = z.infer<typeof signupSchema>;
export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Verify2FAData = z.infer<typeof verify2FASchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
export type ResendOTPData = z.infer<typeof resendOTPSchema>;