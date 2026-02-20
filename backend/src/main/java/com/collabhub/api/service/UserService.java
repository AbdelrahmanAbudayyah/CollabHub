package com.collabhub.api.service;

import com.collabhub.api.exception.ResourceNotFoundException;
import com.collabhub.api.model.dto.request.UpdateProfileRequest;
import com.collabhub.api.model.dto.request.UpdateSkillsRequest;
import com.collabhub.api.model.dto.response.UserResponse;
import com.collabhub.api.model.entity.Skill;
import com.collabhub.api.model.entity.User;
import com.collabhub.api.repository.SkillRepository;
import com.collabhub.api.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Business logic for user profile operations.
 *
 * Every method that reads the user's skills must be @Transactional
 * because the skills relationship is LAZY-loaded. Without a transaction,
 * calling user.getSkills() would throw LazyInitializationException
 * because the database session is already closed.
 *
 * @Transactional keeps the session open for the entire method,
 * so LAZY relationships can be loaded on demand.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;

    /**
     * GET /users/me — get the logged-in user's full profile.
     *
     * @Transactional(readOnly = true) is an optimization hint:
     * it tells Hibernate "don't track changes to these entities"
     * which avoids unnecessary dirty-checking overhead.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = findUserOrThrow(userId);
        return UserResponse.from(user);
    }

    /**
     * GET /users/{id} — view any user's public profile.
     * Same as above, but uses an arbitrary user ID.
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = findUserOrThrow(userId);
        return UserResponse.from(user);
    }

    /**
     * PUT /users/me — update profile fields.
     *
     * Only updates fields that are non-null in the request.
     * This way, the frontend can send just { "bio": "new bio" }
     * without overwriting firstName, lastName, etc.
     *
     * For customSkills, we convert the List<String> to a JSON string
     * before saving (the DB column is a JSON type).
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserOrThrow(userId);

        // Only update fields that were sent (not null)
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }
        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl().trim());
        }
        if (request.getGithubUrl() != null) {
            user.setGithubUrl(request.getGithubUrl().trim());
        }
        if (request.getSchoolName() != null) {
            user.setSchoolName(request.getSchoolName().trim());
        }
        if (request.getCustomSkills() != null) {
            user.setCustomSkills(toJson(request.getCustomSkills()));
        }

        // No need to call userRepository.save() explicitly!
        // Because we're inside @Transactional, Hibernate tracks
        // changes to the `user` object. When the method ends and
        // the transaction commits, Hibernate auto-generates an
        // UPDATE SQL statement for any changed fields.
        // This is called "dirty checking."

        return UserResponse.from(user);
    }

    /**
     * PUT /users/me/skills — replace the user's predefined skill set.
     *
     * This is a full replacement: whatever IDs you send become the
     * complete list. To remove all skills, send an empty set.
     *
     * Steps:
     * 1. Load all Skill entities matching the given IDs
     * 2. Replace the user's skill set entirely
     * 3. Hibernate detects the change and updates the user_skill
     *    join table (deletes old rows, inserts new ones)
     */
    @Transactional
    public UserResponse updateSkills(Long userId, UpdateSkillsRequest request) {
        User user = findUserOrThrow(userId);

        // findAllById returns only skills that exist in DB.
        // If someone sends [1, 2, 999], and 999 doesn't exist,
        // we just get skills 1 and 2 — no error.
        Set<Skill> skills = new HashSet<>(skillRepository.findAllById(request.getSkillIds()));
        user.setSkills(skills);

        return UserResponse.from(user);
    }

    /**
     * Updates the user's profile picture URL in the database.
     *
     * Called after FileStorageService saves the file to disk.
     * We just store the URL path (e.g. "/uploads/profile-pics/uuid.jpg"),
     * not the file itself — the DB only holds the reference.
     */
    @Transactional
    public UserResponse updateProfilePicUrl(Long userId, String profilePicUrl) {
        User user = findUserOrThrow(userId);
        user.setProfilePicUrl(profilePicUrl);
        return UserResponse.from(user);
    }

    /**
     * Helper: find user by ID or throw 404.
     * Reused by every method — DRY principle.
     */
    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Helper: convert List<String> to JSON string for the DB.
     * Example: ["React", "Vue"] → '["React","Vue"]'
     */
    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
