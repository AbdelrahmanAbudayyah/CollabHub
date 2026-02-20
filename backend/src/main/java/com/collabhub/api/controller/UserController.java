package com.collabhub.api.controller;

import com.collabhub.api.model.dto.request.UpdateProfileRequest;
import com.collabhub.api.model.dto.request.UpdateSkillsRequest;
import com.collabhub.api.model.dto.response.ApiResponse;
import com.collabhub.api.model.dto.response.UserResponse;
import com.collabhub.api.security.UserPrincipal;
import com.collabhub.api.service.FileStorageService;
import com.collabhub.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for user profile endpoints.
 *
 * Handles:
 *   GET  /api/v1/users/me          → current user's profile
 *   PUT  /api/v1/users/me          → update profile
 *   PUT  /api/v1/users/me/skills   → replace skill list
 *   GET  /api/v1/users/{userId}    → public profile (no auth needed)
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileStorageService fileStorageService;

    /**
     * GET /api/v1/users/me
     *
     * Returns the full profile of the currently logged-in user.
     *
     * How we know who's logged in:
     * 1. The JwtAuthFilter (runs before this) reads the Bearer token
     * 2. It creates a UserPrincipal and stores it in SecurityContext
     * 3. Here we pull it out using SecurityContextHolder
     *
     * SecurityContextHolder is a thread-local store — each HTTP request
     * runs on its own thread, so each thread has its own authentication.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        Long userId = getAuthenticatedUserId();
        UserResponse user = userService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * PUT /api/v1/users/me
     *
     * Updates the logged-in user's profile fields.
     *
     * @Valid triggers Jakarta Bean Validation on the request body.
     * If any @Size constraint fails, Spring throws
     * MethodArgumentNotValidException → caught by GlobalExceptionHandler
     * → returns 400 with error message.
     *
     * @RequestBody tells Spring to parse the HTTP request body
     * (JSON) into an UpdateProfileRequest Java object using Jackson.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = getAuthenticatedUserId();
        UserResponse user = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile updated successfully"));
    }

    /**
     * PUT /api/v1/users/me/skills
     *
     * Replaces the user's predefined skill set entirely.
     * Send { "skillIds": [1, 5, 11] } to set those as the user's skills.
     * Send { "skillIds": [] } to clear all skills.
     */
    @PutMapping("/me/skills")
    public ResponseEntity<ApiResponse<UserResponse>> updateSkills(
            @Valid @RequestBody UpdateSkillsRequest request) {
        Long userId = getAuthenticatedUserId();
        UserResponse user = userService.updateSkills(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Skills updated successfully"));
    }

    /**
     * POST /api/v1/users/me/profile-pic
     *
     * Uploads a profile picture for the logged-in user.
     *
     * @RequestParam("file") tells Spring to look for a form field
     * named "file" in a multipart/form-data request. The frontend
     * sends this using FormData:
     *   const formData = new FormData();
     *   formData.append("file", selectedFile);
     *   axios.post("/users/me/profile-pic", formData);
     *
     * Spring's MultipartFile wraps the uploaded file with helper
     * methods like getInputStream(), getContentType(), getSize(), etc.
     *
     * Flow:
     * 1. FileStorageService saves the file to disk, returns URL path
     * 2. UserService updates the user's profilePicUrl in the DB
     * 3. Returns the updated user profile
     */
    @PostMapping("/me/profile-pic")
    public ResponseEntity<ApiResponse<UserResponse>> uploadProfilePic(
            @RequestParam("file") MultipartFile file) {
        Long userId = getAuthenticatedUserId();
        String fileUrl = fileStorageService.storeFile(file, "profile-pics");
        UserResponse user = userService.updateProfilePicUrl(userId, fileUrl);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile picture updated"));
    }

    /**
     * GET /api/v1/users/{userId}
     *
     * Returns a public profile for any user by ID.
     * This is a public endpoint (no auth required) — configured
     * in SecurityConfig with .permitAll().
     *
     * @PathVariable extracts {userId} from the URL path.
     * So GET /api/v1/users/42 → userId = 42
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Helper: extract the authenticated user's ID from Spring Security.
     *
     * Flow:
     * 1. SecurityContextHolder stores auth info per-thread
     * 2. getAuthentication() returns the token set by JwtAuthFilter
     * 3. getPrincipal() returns the UserPrincipal object
     * 4. getId() gives us the user's database ID
     *
     * This is reused in every authenticated endpoint.
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }
}
