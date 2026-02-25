/**
 * TypeScript interfaces for project-related data.
 *
 * These match the backend's ProjectResponse, ProjectTaskResponse,
 * and ProjectMemberResponse DTOs. TypeScript uses them at compile
 * time to catch property name typos and type mismatches.
 */

import { Skill } from "./skill";

/**
 * Full project as returned by POST /projects and GET /projects/{id}.
 * Matches the ProjectResponse DTO on the backend.
 */
export interface Project {
  id: number;
  ownerId: number;
  ownerFirstName: string;
  ownerLastName: string;
  title: string;
  description: string;
  maxTeamSize: number;
  githubUrl: string | null;
  status: string;
  visibility: string;
  skills: Skill[];
  customSkills: string[];
  tasks: ProjectTask[];
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

/** A task/role that a project needs filled. */
export interface ProjectTask {
  id: number;
  title: string;
  description: string | null;
  isFilled: boolean;
}

/** A user who has joined a project, with their role. */
export interface ProjectMember {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  profilePicUrl: string | null;
  role: string;
  joinedAt: string;
}

/**
 * Data sent to POST /projects to create a new project.
 * Matches the CreateProjectRequest DTO on the backend.
 */
export interface CreateProjectData {
  title: string;
  description: string;
  maxTeamSize: number;
  githubUrl?: string;
  skillIds?: number[];
  customSkills?: string[];
  tasks?: { title: string; description?: string }[];
}

/**
 * Data sent to PUT /projects/{id} to update a project.
 * All fields are optional — only non-null fields get applied (partial update).
 * Matches the UpdateProjectRequest DTO on the backend.
 */
export interface UpdateProjectData {
  title?: string;
  description?: string;
  maxTeamSize?: number;
  githubUrl?: string;
  skillIds?: number[];
  customSkills?: string[];
  tasks?: { title: string; description?: string }[];
  status?: string;
}

/**
 * Query parameters for GET /projects (browse/search).
 * All fields optional — omitted fields are ignored by the backend.
 */
export interface ProjectSearchParams {
  q?: string;
  skillIds?: number[];
  status?: string;
  school?: string;
  page?: number;
  size?: number;
}

/**
 * A join request as returned by the API.
 * Matches JoinRequestResponse DTO on the backend.
 * Includes requester's user info so the owner can see who wants to join.
 */
export interface JoinRequest {
  id: number;
  projectId: number;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userProfilePicUrl: string | null;
  message: string | null;
  status: string;
  reviewedAt: string | null;
  createdAt: string;
}

/**
 * The current user's relationship to a project + bookmark state.
 * Returned by GET /projects/{id}/membership-status.
 * The frontend uses this to decide which button to show.
 */
export interface MembershipStatus {
  status: "OWNER" | "MEMBER" | "PENDING" | "NONE";
  interested: boolean;
}
