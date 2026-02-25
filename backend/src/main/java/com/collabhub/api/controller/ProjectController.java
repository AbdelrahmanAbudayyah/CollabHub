package com.collabhub.api.controller;

import com.collabhub.api.model.dto.request.CreateProjectRequest;
import com.collabhub.api.model.dto.request.UpdateProjectRequest;
import com.collabhub.api.model.dto.response.ApiResponse;
import com.collabhub.api.model.dto.response.PagedResponse;
import com.collabhub.api.model.dto.response.ProjectMemberResponse;
import com.collabhub.api.model.dto.response.ProjectResponse;
import com.collabhub.api.security.UserPrincipal;
import com.collabhub.api.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * REST controller for project endpoints.
 *
 * Public (no auth):
 *   GET  /projects           → browse/search with filters + pagination
 *   GET  /projects/{id}      → single project detail
 *   GET  /projects/{id}/members → project members list
 *
 * Auth required:
 *   POST /projects           → create project
 *   PUT  /projects/{id}      → update project (owner only)
 *   DELETE /projects/{id}    → delete project (owner only)
 *
 * SecurityConfig already permits the GET endpoints as public.
 * POST/PUT/DELETE fall under .anyRequest().authenticated().
 * Owner-level authorization is checked in ProjectService.
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ─── CREATE ──────────────────────────────────────────────────────────

    /**
     * POST /api/v1/projects — create a new project.
     *
     * Returns 201 CREATED (REST convention for resource creation).
     * @Valid triggers Jakarta validation on the request body.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        Long userId = getAuthenticatedUserId();
        ProjectResponse project = projectService.createProject(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(project, "Project created successfully"));
    }

    // ─── READ ────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/projects — browse/search projects with filters.
     *
     * Query parameters (all optional):
     *   q        — free-text search (uses FULLTEXT index)
     *   skillIds — comma-separated skill IDs (e.g., ?skillIds=1,5,12)
     *   status   — project status filter (e.g., ?status=RECRUITING)
     *   page     — zero-indexed page number (default 0)
     *   size     — items per page (default 9, good for 3-column grid)
     *
     * Spring automatically parses "skillIds=1,5,12" into Set<Long>
     * because of the @RequestParam annotation on a Set<Long> parameter.
     *
     * Returns paginated results wrapped in PagedResponse inside ApiResponse.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getProjects(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Set<Long> skillIds,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String school,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        PagedResponse<ProjectResponse> projects = projectService.getProjects(q, skillIds, status, school, page, size);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    /**
     * GET /api/v1/projects/{id} — get a single project.
     *
     * Public endpoint — guests can see project details.
     * The frontend decides what to show/hide based on auth state.
     *
     * @PathVariable maps the {id} URL segment to the method parameter.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable Long id) {
        ProjectResponse project = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    /**
     * GET /api/v1/projects/{id}/members — list project members.
     *
     * Public endpoint. Returns a simpler response than the full
     * project detail — useful if you only need the team list.
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getProjectMembers(
            @PathVariable Long id) {
        List<ProjectMemberResponse> members = projectService.getProjectMembers(id);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    // ─── DASHBOARD (my projects) ───────────────────────────────────────

    @GetMapping("/me/owned")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getOwnedProjects() {
        Long userId = getAuthenticatedUserId();
        List<ProjectResponse> projects = projectService.getOwnedProjects(userId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/me/joined")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getJoinedProjects() {
        Long userId = getAuthenticatedUserId();
        List<ProjectResponse> projects = projectService.getJoinedProjects(userId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/me/interested")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getInterestedProjects() {
        Long userId = getAuthenticatedUserId();
        List<ProjectResponse> projects = projectService.getInterestedProjects(userId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────

    /**
     * PUT /api/v1/projects/{id} — update a project (owner only).
     *
     * The service layer checks ownership and throws 403 if the
     * authenticated user is not the project owner.
     *
     * Partial update: only non-null fields in the request body
     * get applied. Null fields mean "don't change".
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {
        Long userId = getAuthenticatedUserId();
        ProjectResponse project = projectService.updateProject(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success(project, "Project updated successfully"));
    }

    // ─── DELETE ──────────────────────────────────────────────────────────

    /**
     * DELETE /api/v1/projects/{id} — delete a project (owner only, hard delete).
     *
     * Returns 200 with a success message (no data body needed).
     * cascade = ALL means tasks and members are deleted automatically.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        projectService.deleteProject(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted successfully"));
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }
}
