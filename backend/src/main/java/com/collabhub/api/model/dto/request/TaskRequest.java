package com.collabhub.api.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Nested DTO for tasks inside CreateProjectRequest.
 *
 * When the frontend sends:
 *   "tasks": [{ "title": "Frontend Dev", "description": "Build UI" }]
 *
 * Jackson deserializes each array element into a TaskRequest.
 * @Valid on the List<TaskRequest> field in CreateProjectRequest
 * ensures each task is validated individually.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Task title must not exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Task description must not exceed 2000 characters")
    private String description;
}
