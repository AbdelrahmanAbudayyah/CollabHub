/**
 * API module for skill endpoints.
 *
 * Only one endpoint for now: fetch all predefined skills
 * grouped by category. Used by the SkillSelector component.
 */

import apiClient from "./client";
import { ApiResponse } from "../types/api";
import { GroupedSkills } from "../types/skill";

/**
 * GET /skills — fetch all predefined skills grouped by category.
 *
 * Returns an object like:
 * {
 *   "LANGUAGE": [{ id: 1, name: "JavaScript", category: "LANGUAGE" }, ...],
 *   "FRAMEWORK": [{ id: 11, name: "React", category: "FRAMEWORK" }, ...]
 * }
 */
export async function getSkillsGrouped(): Promise<GroupedSkills> {
  const response =
    await apiClient.get<ApiResponse<GroupedSkills>>("/skills");
  return response.data.data;
}
