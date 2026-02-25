package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.Project;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Full project DTO returned by the API.
 *
 * Aggregates data from multiple relationships:
 *   - owner (User) → ownerId, ownerFirstName, ownerLastName
 *   - skills (Set<Skill>) → List<SkillResponse>
 *   - customSkills (JSON string) → List<String>
 *   - tasks (List<ProjectTask>) → List<ProjectTaskResponse>
 *   - members (List<ProjectMember>) → List<ProjectMemberResponse>
 *
 * The from() method must be called inside a @Transactional method
 * because it accesses LAZY-loaded relationships.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {

    private Long id;
    private Long ownerId;
    private String ownerFirstName;
    private String ownerLastName;
    private String title;
    private String description;
    private Integer maxTeamSize;
    private String githubUrl;
    private String status;
    private String visibility;
    private List<SkillResponse> skills;
    private List<String> customSkills;
    private List<ProjectTaskResponse> tasks;
    private List<ProjectMemberResponse> members;
    private Instant createdAt;
    private Instant updatedAt;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Converts a Project entity to a ProjectResponse DTO.
     *
     * Steps:
     * 1. Map simple fields (title, description, etc.)
     * 2. Extract owner info (avoids extra API call on frontend)
     * 3. Convert Set<Skill> → List<SkillResponse> via stream + map
     * 4. Parse customSkills JSON → List<String>
     * 5. Convert tasks and members via their own from() methods
     *
     * The .name() call on status/visibility enums converts them to
     * strings (e.g., ProjectStatus.RECRUITING → "RECRUITING").
     */
    public static ProjectResponse from(Project project) {
        List<SkillResponse> skillResponses = project.getSkills().stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());

        List<String> customSkillsList = parseCustomSkills(project.getCustomSkills());

        List<ProjectTaskResponse> taskResponses = project.getTasks().stream()
                .map(ProjectTaskResponse::from)
                .collect(Collectors.toList());

        List<ProjectMemberResponse> memberResponses = project.getMembers().stream()
                .map(ProjectMemberResponse::from)
                .collect(Collectors.toList());

        return ProjectResponse.builder()
                .id(project.getId())
                .ownerId(project.getOwner().getId())
                .ownerFirstName(project.getOwner().getFirstName())
                .ownerLastName(project.getOwner().getLastName())
                .title(project.getTitle())
                .description(project.getDescription())
                .maxTeamSize(project.getMaxTeamSize())
                .githubUrl(project.getGithubUrl())
                .status(project.getStatus().name())
                .visibility(project.getVisibility().name())
                .skills(skillResponses)
                .customSkills(customSkillsList)
                .tasks(taskResponses)
                .members(memberResponses)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    /**
     * Same JSON parsing pattern used in UserResponse.
     * Converts the JSON string from the DB column back to a List<String>.
     * Returns empty list if null or invalid JSON.
     */
    private static List<String> parseCustomSkills(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
