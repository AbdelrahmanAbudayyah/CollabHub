package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Full user profile DTO returned by the API.
 *
 * This is what the frontend receives when it calls GET /users/me
 * or GET /users/{id}. It includes everything except the password hash.
 *
 * The static from() method converts a User entity into this DTO.
 * We never expose the entity directly — that would leak internal
 * details like passwordHash to the API consumer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String bio;
    private String profilePicUrl;
    private String linkedinUrl;
    private String githubUrl;
    private String schoolName;
    private List<SkillResponse> skills;
    private List<String> customSkills;
    private Instant createdAt;

    /**
     * ObjectMapper for parsing the custom_skills JSON column.
     * Static because it's thread-safe and expensive to create —
     * we only need one instance shared across all conversions.
     */
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Converts a User entity to a UserResponse DTO.
     *
     * Key things happening:
     * 1. Maps all simple fields directly (firstName, bio, etc.)
     * 2. Converts the Set<Skill> to List<SkillResponse> using streams
     * 3. Parses the custom_skills JSON string back into a List<String>
     *
     * The skills set might not be loaded yet (LAZY fetch). If you call
     * this inside a @Transactional method, Hibernate will auto-fetch them.
     * Outside a transaction, you'd get a LazyInitializationException.
     */
    public static UserResponse from(User user) {
        // Convert Set<Skill> entities to List<SkillResponse> DTOs
        List<SkillResponse> skillResponses = user.getSkills().stream()
                .map(SkillResponse::from)
                .collect(Collectors.toList());

        // Parse JSON string "["Solidity","Unity"]" into List<String>
        List<String> customSkillsList = parseCustomSkills(user.getCustomSkills());

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .bio(user.getBio())
                .profilePicUrl(user.getProfilePicUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .schoolName(user.getSchoolName())
                .skills(skillResponses)
                .customSkills(customSkillsList)
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Helper: parse the JSON string stored in DB into a Java list.
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
