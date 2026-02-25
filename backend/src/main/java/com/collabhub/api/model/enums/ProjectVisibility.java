package com.collabhub.api.model.enums;

/**
 * Controls who can see a project.
 * PUBLIC = visible in browse/search.
 * UNLISTED = only accessible via direct link.
 * Must match the ENUM values in the `project` table's `visibility` column.
 */
public enum ProjectVisibility {
    PUBLIC,
    UNLISTED
}
