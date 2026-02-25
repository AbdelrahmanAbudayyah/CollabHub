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

/**
 * Project creation wizard — Step 1 (Basics) validation.
 *
 * maxTeamSize uses z.number() because the input field will use
 * React Hook Form's { valueAsNumber: true } option, which converts
 * the HTML input string to a number before Zod sees it.
 * Without valueAsNumber, z.number() would fail because HTML inputs
 * always produce strings.
 */
export const projectBasicsSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must not exceed 5000 characters"),
  maxTeamSize: z
    .number({ error: "Team size must be a number" })
    .int("Team size must be a whole number")
    .min(2, "Team size must be at least 2")
    .max(20, "Team size must not exceed 20"),
  githubUrl: z
    .string()
    .regex(/^https?:\/\/.+/, "Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ProjectBasicsFormData = z.infer<typeof projectBasicsSchema>;

/**
 * Project creation wizard — Step 3 (Tasks) individual task validation.
 * Each task in the dynamic list is validated with this schema.
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Task description must not exceed 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type TaskFormData = z.infer<typeof taskSchema>;
