/**
 * API module for user profile endpoints.
 *
 * Each function maps to one backend endpoint. They all use the
 * shared `apiClient` (from client.ts) which automatically:
 *   - Attaches the Bearer token (request interceptor)
 *   - Retries on 401 after refreshing (response interceptor)
 *   - Sends cookies for refresh token (withCredentials: true)
 *
 * Pattern: function calls apiClient → returns the unwrapped data.
 * We dig into response.data.data because:
 *   response.data = { status: "success", data: { ...actual data }, timestamp: "..." }
 *   response.data.data = the actual payload we need
 */

import apiClient from "./client";
import { ApiResponse } from "../types/api";
import {
  UserProfile,
  UpdateProfileData,
  UpdateSkillsData,
} from "../types/user";

/** GET /users/me — fetch the logged-in user's full profile */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<UserProfile>>("/users/me");
  return response.data.data;
}

/** GET /users/{userId} — fetch any user's public profile */
export async function getUserById(userId: number): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<UserProfile>>(
    `/users/${userId}`
  );
  return response.data.data;
}

/**
 * PUT /users/me — update profile fields.
 * Only include fields you want to change.
 */
export async function updateProfile(
  data: UpdateProfileData
): Promise<UserProfile> {
  const response = await apiClient.put<ApiResponse<UserProfile>>(
    "/users/me",
    data
  );
  return response.data.data;
}

/**
 * PUT /users/me/skills — replace predefined skills.
 * Send the complete set of skill IDs (not a diff).
 */
export async function updateSkills(
  data: UpdateSkillsData
): Promise<UserProfile> {
  const response = await apiClient.put<ApiResponse<UserProfile>>(
    "/users/me/skills",
    data
  );
  return response.data.data;
}

/**
 * POST /users/me/profile-pic — upload a profile picture.
 *
 * This is different from other endpoints because we send a FILE,
 * not JSON. We use FormData (the browser API for multipart uploads).
 *
 * Key detail: we set Content-Type to "multipart/form-data".
 * Normally apiClient sends "application/json", but file uploads
 * need "multipart/form-data" so the browser correctly encodes
 * the file bytes with boundary markers.
 *
 * Actually, we DON'T set Content-Type explicitly — we let Axios
 * detect it from the FormData object. If we set it manually,
 * we'd be missing the "boundary" string that separates form fields,
 * and the server would reject the request.
 */
export async function uploadProfilePic(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ApiResponse<UserProfile>>(
    "/users/me/profile-pic",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
}
