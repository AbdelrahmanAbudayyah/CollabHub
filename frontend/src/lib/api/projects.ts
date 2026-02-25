/**
 * API module for project endpoints.
 *
 * Same pattern as users.ts — each function maps to one backend endpoint.
 * The shared apiClient automatically attaches the Bearer token
 * and handles 401 refresh/retry.
 */

import apiClient from "./client";
import { ApiResponse, PagedResponse } from "../types/api";
import {
  Project,
  ProjectMember,
  CreateProjectData,
  UpdateProjectData,
  ProjectSearchParams,
  JoinRequest,
  MembershipStatus,
} from "../types/project";

/**
 * POST /projects — create a new project.
 * The authenticated user becomes the owner and is automatically
 * added as a member with role "Owner".
 */
export async function createProject(data: CreateProjectData): Promise<Project> {
  const response = await apiClient.post<ApiResponse<Project>>(
    "/projects",
    data
  );
  return response.data.data;
}

/**
 * GET /projects — browse/search projects with filters + pagination.
 *
 * Builds query string from the params object. Axios `params` option
 * automatically serializes the object to URL search params:
 *   { q: "react", page: 0, size: 9 } → ?q=react&page=0&size=9
 *
 * For skillIds array, we join them into a comma-separated string
 * because that's what Spring's @RequestParam expects for Set<Long>.
 */
export async function getProjects(
  params: ProjectSearchParams
): Promise<PagedResponse<Project>> {
  const queryParams: Record<string, string | number> = {};

  if (params.q) queryParams.q = params.q;
  if (params.skillIds && params.skillIds.length > 0) {
    queryParams.skillIds = params.skillIds.join(",");
  }
  if (params.status) queryParams.status = params.status;
  if (params.school) queryParams.school = params.school;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.size !== undefined) queryParams.size = params.size;

  const response = await apiClient.get<ApiResponse<PagedResponse<Project>>>(
    "/projects",
    { params: queryParams }
  );
  return response.data.data;
}

/**
 * GET /projects/{id} — get a single project's full details.
 * Public endpoint — no auth required.
 */
export async function getProjectById(id: number): Promise<Project> {
  const response = await apiClient.get<ApiResponse<Project>>(
    `/projects/${id}`
  );
  return response.data.data;
}

/**
 * GET /projects/{id}/members — get project members list.
 * Public endpoint — lighter than full project response.
 */
export async function getProjectMembers(
  projectId: number
): Promise<ProjectMember[]> {
  const response = await apiClient.get<ApiResponse<ProjectMember[]>>(
    `/projects/${projectId}/members`
  );
  return response.data.data;
}

/**
 * PUT /projects/{id} — update a project (owner only).
 * Partial update: only send the fields you want to change.
 */
export async function updateProject(
  id: number,
  data: UpdateProjectData
): Promise<Project> {
  const response = await apiClient.put<ApiResponse<Project>>(
    `/projects/${id}`,
    data
  );
  return response.data.data;
}

/**
 * DELETE /projects/{id} — delete a project (owner only, hard delete).
 * Returns void — no data in the response body.
 */
export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

// ─── JOIN REQUESTS ────────────────────────────────────────────────────

/**
 * POST /projects/{id}/join-requests — request to join a project.
 * Optionally include a message explaining why you want to join.
 */
export async function createJoinRequest(
  projectId: number,
  message?: string
): Promise<JoinRequest> {
  const response = await apiClient.post<ApiResponse<JoinRequest>>(
    `/projects/${projectId}/join-requests`,
    { message }
  );
  return response.data.data;
}

/**
 * GET /projects/{id}/join-requests — list pending requests (owner only).
 * Returns only PENDING requests for the owner's review UI.
 */
export async function getPendingJoinRequests(
  projectId: number
): Promise<JoinRequest[]> {
  const response = await apiClient.get<ApiResponse<JoinRequest[]>>(
    `/projects/${projectId}/join-requests`
  );
  return response.data.data;
}

/**
 * PUT /projects/{id}/join-requests/{reqId} — approve or reject.
 * Owner sends { status: "APPROVED" } or { status: "REJECTED" }.
 */
export async function reviewJoinRequest(
  projectId: number,
  requestId: number,
  status: "APPROVED" | "REJECTED"
): Promise<JoinRequest> {
  const response = await apiClient.put<ApiResponse<JoinRequest>>(
    `/projects/${projectId}/join-requests/${requestId}`,
    { status }
  );
  return response.data.data;
}

// ─── MEMBERSHIP ──────────────────────────────────────────────────────

/**
 * DELETE /projects/{id}/members/me — leave a project.
 * The authenticated user removes themselves from the team.
 */
export async function leaveProject(projectId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/me`);
}

/**
 * DELETE /projects/{id}/members/{userId} — remove a member (owner only).
 */
export async function removeMember(
  projectId: number,
  userId: number
): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${userId}`);
}

/**
 * GET /projects/{id}/membership-status — get current user's relationship.
 * Returns { status: "OWNER"|"MEMBER"|"PENDING"|"NONE", interested: boolean }
 */
export async function getMembershipStatus(
  projectId: number
): Promise<MembershipStatus> {
  const response = await apiClient.get<ApiResponse<MembershipStatus>>(
    `/projects/${projectId}/membership-status`
  );
  return response.data.data;
}

// ─── INTEREST (BOOKMARKS) ────────────────────────────────────────────

/**
 * POST /projects/{id}/interest — bookmark a project.
 */
export async function addInterest(projectId: number): Promise<void> {
  await apiClient.post(`/projects/${projectId}/interest`);
}

/**
 * DELETE /projects/{id}/interest — remove bookmark.
 */
export async function removeInterest(projectId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/interest`);
}

// ─── DASHBOARD (my projects) ────────────────────────────────────────

export async function getMyOwnedProjects(): Promise<Project[]> {
  const response = await apiClient.get<ApiResponse<Project[]>>(
    "/projects/me/owned"
  );
  return response.data.data;
}

export async function getMyJoinedProjects(): Promise<Project[]> {
  const response = await apiClient.get<ApiResponse<Project[]>>(
    "/projects/me/joined"
  );
  return response.data.data;
}

export async function getMyInterestedProjects(): Promise<Project[]> {
  const response = await apiClient.get<ApiResponse<Project[]>>(
    "/projects/me/interested"
  );
  return response.data.data;
}
