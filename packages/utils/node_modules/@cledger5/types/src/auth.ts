import { z } from 'zod'

// App roles from PRD
export const AppRoleEnum = z.enum(['candidate', 'recruiter', 'admin'])
export type AppRole = z.infer<typeof AppRoleEnum>

// App user schema
export const AppUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: AppRoleEnum,
  email_verified_at: z.string().optional(),
  is_active: z.boolean().default(true),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type AppUser = z.infer<typeof AppUserSchema>

// Login schema
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
export type LoginCredentials = z.infer<typeof LoginSchema>

// Registration schema - V7
export const RegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[!@#$%^&*()]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  role: AppRoleEnum.default('candidate'),
  first_name: z.string().optional(),
  last_name: z.string().optional()
})
export type Registration = z.infer<typeof RegistrationSchema>

// Password reset schema
export const PasswordResetRequestSchema = z.object({
  email: z.string().email()
})
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>

export const PasswordResetSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[!@#$%^&*()]/, 'Le mot de passe doit contenir au moins un caractère spécial')
})
export type PasswordReset = z.infer<typeof PasswordResetSchema>

// Session schema
export const SessionSchema = z.object({
  user: AppUserSchema,
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_at: z.string()
})
export type Session = z.infer<typeof SessionSchema> 