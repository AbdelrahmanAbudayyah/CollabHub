package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.ProjectTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for a single task within a project response.
 * Keeps the API contract separate from the JPA entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTaskResponse {

    private Long id;
    private String title;
    private String description;
    private Boolean isFilled;

    public static ProjectTaskResponse from(ProjectTask task) {
        return ProjectTaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .isFilled(task.getIsFilled())
                .build();
    }
}
