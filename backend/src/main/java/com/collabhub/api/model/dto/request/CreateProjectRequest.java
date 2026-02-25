package com.collabhub.api.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * DTO for POST /projects — create a new project.
 *
 * Required fields: title, description, maxTeamSize
 * Optional fields: githubUrl, skillIds, customSkills, tasks
 *
 * @Valid on the tasks list tells Jakarta to validate each
 * TaskRequest inside the list (checking their @NotBlank etc.).
 * Without @Valid here, nested validation would be skipped.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @NotNull(message = "Max team size is required")
    @Min(value = 2, message = "Team size must be at least 2")
    @Max(value = 20, message = "Team size must not exceed 20")
    private Integer maxTeamSize;

    @Size(max = 500, message = "GitHub URL must not exceed 500 characters")
    private String githubUrl;

    private Set<Long> skillIds;

    private List<String> customSkills;

    @Valid
    private List<TaskRequest> tasks;
}
