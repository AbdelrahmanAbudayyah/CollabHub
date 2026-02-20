import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Profile edit form validation schema.
 *
 * Zod schemas define validation rules declaratively:
 *   z.string() = must be a string
 *   .max(100, "...") = max 100 chars, with custom error message
 *   .optional() = field can be undefined (not required)
 *   .or(z.literal("")) = also accept empty string (user clears the field)
 *   .url("...") = must be a valid URL format
 *
 * Why .url().optional().or(z.literal(""))?
 * Without .or(z.literal("")), an empty input would fail the .url()
 * check because "" is not a valid URL. But we want to allow users
 * to clear their LinkedIn/GitHub URL. The .or(z.literal("")) says
 * "accept either a valid URL or an empty string."
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters"),
  bio: z
    .string()
    .max(2000, "Bio must not exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .regex(/^https?:\/\/.+/, "Must be a valid URL")
    .optional()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .regex(/^https?:\/\/.+/, "Must be a valid URL")
    .optional()
    .or(z.literal("")),
  schoolName: z
    .string()
    .max(200, "School name must not exceed 200 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * z.infer<typeof profileSchema> automatically generates the
 * TypeScript type from the Zod schema. So we get:
 *
 * type ProfileFormData = {
 *   firstName: string;
 *   lastName: string;
 *   bio?: string | undefined;
 *   linkedinUrl?: string | undefined;
 *   githubUrl?: string | undefined;
 *   schoolName?: string | undefined;
 * }
 *
 * This means the form data type always matches the validation rules —
 * they can never get out of sync.
 */
export type ProfileFormData = z.infer<typeof profileSchema>;
