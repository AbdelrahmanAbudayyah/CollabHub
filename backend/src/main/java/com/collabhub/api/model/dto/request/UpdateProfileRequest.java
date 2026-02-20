package com.collabhub.api.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for PUT /users/me — update the logged-in user's profile.
 *
 * Unlike RegisterRequest, most fields here are optional (no @NotBlank).
 * The user might only want to update their bio and leave everything
 * else unchanged. Null fields mean "don't change this."
 *
 * @Size sets maximum lengths to match the database column sizes.
 * If someone sends a 1000-char first name, validation fails before
 * it even hits the database.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;

    @Size(max = 500, message = "LinkedIn URL must not exceed 500 characters")
    private String linkedinUrl;

    @Size(max = 500, message = "GitHub URL must not exceed 500 characters")
    private String githubUrl;

    @Size(max = 200, message = "School name must not exceed 200 characters")
    private String schoolName;

    /**
     * Custom skills are free-text strings the user types in
     * (not from the predefined skill list). Stored as JSON array
     * in the app_user.custom_skills column.
     *
     * Example: ["Solidity", "Blender", "Unity"]
     */
    private List<String> customSkills;
}
