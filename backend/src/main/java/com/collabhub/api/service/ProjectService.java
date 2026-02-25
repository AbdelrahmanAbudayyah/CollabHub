package com.collabhub.api.service;

import com.collabhub.api.exception.ForbiddenException;
import com.collabhub.api.exception.ResourceNotFoundException;
import com.collabhub.api.model.dto.request.CreateProjectRequest;
import com.collabhub.api.model.dto.request.TaskRequest;
import com.collabhub.api.model.dto.request.UpdateProjectRequest;
import com.collabhub.api.model.dto.response.PagedResponse;
import com.collabhub.api.model.dto.response.ProjectMemberResponse;
import com.collabhub.api.model.dto.response.ProjectResponse;
import com.collabhub.api.model.entity.Project;
import com.collabhub.api.model.entity.ProjectMember;
import com.collabhub.api.model.entity.ProjectTask;
import com.collabhub.api.model.entity.Skill;
import com.collabhub.api.model.entity.User;
import com.collabhub.api.model.enums.ProjectStatus;
import com.collabhub.api.repository.ProjectInterestRepository;
import com.collabhub.api.repository.ProjectMemberRepository;
import com.collabhub.api.repository.ProjectRepository;
import com.collabhub.api.repository.SkillRepository;
import com.collabhub.api.repository.UserRepository;
import com.collabhub.api.specification.ProjectSpecification;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Business logic for project operations.
 *
 * @RequiredArgsConstructor generates a constructor with all final fields,
 * which Spring uses for dependency injection.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInterestRepository projectInterestRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;

    // ─── CREATE ──────────────────────────────────────────────────────────

    /**
     * Creates a new project and adds the owner as the first member.
     *
     * Flow:
     * 1. Look up the owner user
     * 2. Build the Project entity from request data
     * 3. Attach predefined skills from the skill table
     * 4. Store custom skills as JSON string
     * 5. Create ProjectTask entities for each requested task
     * 6. Create a ProjectMember for the owner with role "Owner"
     * 7. Save — cascade handles tasks and members
     * 8. Convert to DTO and return
     *
     * Uses explicit save() because this is a new entity (not yet in
     * the persistence context — dirty checking only works for loaded entities).
     */
    @Transactional
    public ProjectResponse createProject(Long ownerId, CreateProjectRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
                .owner(owner)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .maxTeamSize(request.getMaxTeamSize())
                .githubUrl(request.getGithubUrl() != null ? request.getGithubUrl().trim() : null)
                .build();

        if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
            Set<Skill> skills = new HashSet<>(skillRepository.findAllById(request.getSkillIds()));
            project.setSkills(skills);
        }

        if (request.getCustomSkills() != null && !request.getCustomSkills().isEmpty()) {
            project.setCustomSkills(toJson(request.getCustomSkills()));
        }

        if (request.getTasks() != null) {
            for (TaskRequest taskReq : request.getTasks()) {
                ProjectTask task = ProjectTask.builder()
                        .project(project)
                        .title(taskReq.getTitle().trim())
                        .description(taskReq.getDescription() != null ? taskReq.getDescription().trim() : null)
                        .build();
                project.getTasks().add(task);
            }
        }

        ProjectMember ownerMember = ProjectMember.builder()
                .project(project)
                .user(owner)
                .role("Owner")
                .build();
        project.getMembers().add(ownerMember);

        Project saved = projectRepository.save(project);
        return ProjectResponse.from(saved);
    }

    // ─── READ (Browse + Detail) ─────────────────────────────────────────

    /**
     * Search and filter projects with pagination.
     *
     * Two code paths:
     *   1. If `q` is provided → uses native FULLTEXT query (MATCH...AGAINST)
     *      because JPA Criteria API can't express MySQL FULLTEXT syntax.
     *   2. If no `q` → uses JPA Specification for skillIds + status + school filters.
     *
     * Returns PagedResponse with standard pagination fields the frontend expects.
     *
     * @param q        Free-text search (uses FULLTEXT index). Null = skip.
     * @param skillIds Filter by skill IDs. Null = skip.
     * @param status   Filter by status string (e.g., "RECRUITING"). Null = skip.
     * @param school   Filter by owner's school name. Null = skip.
     * @param page     Zero-indexed page number.
     * @param size     Items per page.
     */
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getProjects(
            String q, Set<Long> skillIds, String status, String school, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Project> projectPage;

        if (q != null && !q.isBlank()) {
            // FULLTEXT search — append '*' for prefix matching ("rea" → matches "react")
            projectPage = projectRepository.searchByText(q.trim() + "*", pageable);
        } else {
            // Filter-only query using JPA Specification
            Specification<Project> spec = ProjectSpecification.withFilters(skillIds, status, school);
            projectPage = projectRepository.findAll(spec, pageable);
        }

        // Convert entities → DTOs (works because we're inside @Transactional)
        List<ProjectResponse> content = projectPage.getContent().stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());

        return PagedResponse.<ProjectResponse>builder()
                .content(content)
                .page(projectPage.getNumber())
                .size(projectPage.getSize())
                .totalElements(projectPage.getTotalElements())
                .totalPages(projectPage.getTotalPages())
                .build();
    }

    /**
     * Get a single project by ID (public endpoint, no auth needed).
     * Returns full ProjectResponse with owner, skills, tasks, members.
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId) {
        Project project = findProjectOrThrow(projectId);
        return ProjectResponse.from(project);
    }

    /**
     * Get all members of a project (public endpoint).
     * Returns just the members list — lighter than full project response.
     */
    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        findProjectOrThrow(projectId); // verify project exists → 404 if not
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(ProjectMemberResponse::from)
                .collect(Collectors.toList());
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────

    /**
     * Update a project (owner only).
     *
     * Authorization: checks that the current user is the project owner.
     * If not → ForbiddenException → GlobalExceptionHandler returns 403.
     *
     * Partial update pattern: only non-null fields get applied.
     * Null fields mean "don't change".
     *
     * For tasks: if request includes a tasks list, we clear old tasks
     * and replace entirely. orphanRemoval = true on Project.tasks means
     * JPA deletes the old task rows automatically.
     *
     * Dirty checking handles the SQL UPDATE — no explicit save() needed
     * because the entity was loaded by findById (already in persistence context).
     */
    @Transactional
    public ProjectResponse updateProject(Long projectId, Long currentUserId,
                                         UpdateProjectRequest request) {
        Project project = findProjectOrThrow(projectId);
        assertOwner(project, currentUserId);

        if (request.getTitle() != null) {
            project.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription().trim());
        }
        if (request.getMaxTeamSize() != null) {
            project.setMaxTeamSize(request.getMaxTeamSize());
        }
        if (request.getGithubUrl() != null) {
            // Empty string means "remove the URL"
            project.setGithubUrl(request.getGithubUrl().trim().isEmpty()
                    ? null : request.getGithubUrl().trim());
        }

        // Update status — valueOf throws IllegalArgumentException if invalid
        if (request.getStatus() != null) {
            project.setStatus(ProjectStatus.valueOf(request.getStatus()));
        }

        // Replace skills entirely
        if (request.getSkillIds() != null) {
            Set<Skill> skills = new HashSet<>(skillRepository.findAllById(request.getSkillIds()));
            project.setSkills(skills);
        }

        // Replace custom skills
        if (request.getCustomSkills() != null) {
            project.setCustomSkills(
                    request.getCustomSkills().isEmpty() ? null : toJson(request.getCustomSkills()));
        }

        // Replace tasks entirely (orphanRemoval deletes old rows)
        if (request.getTasks() != null) {
            project.getTasks().clear();
            for (TaskRequest taskReq : request.getTasks()) {
                ProjectTask task = ProjectTask.builder()
                        .project(project)
                        .title(taskReq.getTitle().trim())
                        .description(taskReq.getDescription() != null
                                ? taskReq.getDescription().trim() : null)
                        .build();
                project.getTasks().add(task);
            }
        }

        return ProjectResponse.from(project);
    }

    // ─── DELETE ──────────────────────────────────────────────────────────

    /**
     * Delete a project (owner only, hard delete).
     *
     * cascade = ALL on tasks and members means deleting the project
     * automatically deletes all tasks and members.
     * ON DELETE CASCADE on project_skill FK handles the join table.
     */
    @Transactional
    public void deleteProject(Long projectId, Long currentUserId) {
        Project project = findProjectOrThrow(projectId);
        assertOwner(project, currentUserId);
        projectRepository.delete(project);
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProjectResponse> getOwnedProjects(Long userId) {
        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getJoinedProjects(Long userId) {
        return projectRepository.findJoinedProjects(userId).stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getInterestedProjects(Long userId) {
        return projectInterestRepository.findByUserId(userId).stream()
                .map(interest -> ProjectResponse.from(interest.getProject()))
                .collect(Collectors.toList());
    }

    // ─── HELPERS ────────────────────────────────────────────────────────

    private Project findProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    /**
     * Checks that the current user is the project owner.
     * Throws 403 Forbidden if not.
     */
    private void assertOwner(Project project, Long currentUserId) {
        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the project owner can perform this action");
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}