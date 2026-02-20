/**
 * TypeScript interfaces for user-related data.
 *
 * These define the SHAPE of data flowing between frontend and backend.
 * TypeScript uses these at compile time to catch bugs like:
 *   user.firstname  ← ERROR: should be user.firstName
 *
 * They don't exist at runtime — they're erased during compilation.
 * Think of them as documentation that the compiler enforces.
 */

import { Skill } from "./skill";

/**
 * Full user profile as returned by GET /users/me and GET /users/{id}.
 * Matches the UserResponse DTO on the backend.
 */
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  profilePicUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  schoolName: string | null;
  skills: Skill[];
  customSkills: string[];
  createdAt: string;
}

/**
 * Data sent to PUT /users/me to update profile fields.
 * All fields are optional — only send what changed.
 */
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  schoolName?: string;
  customSkills?: string[];
}

/**
 * Data sent to PUT /users/me/skills to replace predefined skills.
 */
export interface UpdateSkillsData {
  skillIds: number[];
}
