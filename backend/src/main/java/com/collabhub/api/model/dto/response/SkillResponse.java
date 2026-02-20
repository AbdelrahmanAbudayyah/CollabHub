package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.Skill;
import com.collabhub.api.model.enums.SkillCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returned to the frontend for a single skill.
 *
 * Why not return the entity directly? Entities are tied to JPA
 * (lazy loading, proxies, internal fields). DTOs give you full
 * control over what the API exposes. If your entity adds a field
 * later, the API response won't accidentally leak it.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {
    private Long id;
    private String name;
    private SkillCategory category;

    /**
     * Static factory: converts a Skill entity to a SkillResponse DTO.
     * This pattern keeps conversion logic close to the DTO class.
     */
    public static SkillResponse from(Skill skill) {
        return SkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .category(skill.getCategory())
                .build();
    }
}
