/**
 * TypeScript interfaces for skill data.
 *
 * These match the SkillResponse DTO from the backend.
 */

/** A single predefined skill (e.g. { id: 1, name: "React", category: "FRAMEWORK" }) */
export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
}

/** Skill categories — matches the Java SkillCategory enum */
export type SkillCategory = "LANGUAGE" | "FRAMEWORK" | "TOOL" | "CONCEPT" | "OTHER";

/**
 * The shape returned by GET /api/v1/skills.
 * Skills grouped by category name.
 *
 * Example:
 * {
 *   "LANGUAGE": [{ id: 1, name: "JavaScript", ... }, ...],
 *   "FRAMEWORK": [{ id: 11, name: "React", ... }, ...]
 * }
 */
export type GroupedSkills = Record<string, Skill[]>;
