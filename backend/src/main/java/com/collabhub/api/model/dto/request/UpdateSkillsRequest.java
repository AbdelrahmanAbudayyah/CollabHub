package com.collabhub.api.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for PUT /users/me/skills — replace the user's predefined skills.
 *
 * Contains a set of skill IDs (from the `skill` table).
 * This is a "replace" operation — whatever IDs you send become
 * the user's complete skill list. Send an empty set to clear all skills.
 *
 * Example JSON: { "skillIds": [1, 5, 11, 15] }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSkillsRequest {

    @NotNull(message = "Skill IDs list is required")
    private Set<Long> skillIds;
}
