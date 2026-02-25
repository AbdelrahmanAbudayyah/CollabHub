package com.collabhub.api.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * DTO for PUT /projects/{id} — update an existing project.
 *
 * All fields are nullable (partial update pattern).
 * Only non-null fields get applied to the entity.
 * For example, if the request only sends { "title": "New Title" },
 * only the title changes — everything else stays the same.
 *
 * This is the same approach used by UpdateProfileRequest for user profiles.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectRequest {

    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @Min(value = 2, message = "Team size must be at least 2")
    @Max(value = 20, message = "Team size must not exceed 20")
    private Integer maxTeamSize;

    @Size(max = 500, message = "GitHub URL must not exceed 500 characters")
    private String githubUrl;

    /** Replace the entire skill set. Null = don't change. */
    private Set<Long> skillIds;

    /** Replace custom skills list. Null = don't change. */
    private List<String> customSkills;

    /** Replace all tasks. Null = don't change. */
    @Valid
    private List<TaskRequest> tasks;

    /** Change project status (RECRUITING, IN_PROGRESS, COMPLETED, ARCHIVED). */
    private String status;
}
