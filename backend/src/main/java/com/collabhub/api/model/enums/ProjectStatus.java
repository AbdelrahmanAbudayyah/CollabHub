package com.collabhub.api.model.enums;

/**
 * Lifecycle status of a project.
 * Must match the ENUM values in the `project` table's `status` column.
 */
public enum ProjectStatus {
    RECRUITING,
    IN_PROGRESS,
    COMPLETED,
    ARCHIVED
}
