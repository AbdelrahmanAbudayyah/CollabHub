package com.collabhub.api.controller;

import com.collabhub.api.model.dto.request.JoinRequestRequest;
import com.collabhub.api.model.dto.request.ReviewJoinRequest;
import com.collabhub.api.model.dto.response.ApiResponse;
import com.collabhub.api.model.dto.response.JoinRequestResponse;
import com.collabhub.api.security.UserPrincipal;
import com.collabhub.api.service.JoinRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for membership and join request endpoints.
 *
 * All endpoints are nested under /api/v1/projects/{projectId}/...
 * because join requests and membership are scoped to a specific project.
 *
 * Endpoints:
 *   POST   /projects/{id}/join-requests           → request to join
 *   GET    /projects/{id}/join-requests            → list pending (owner only)
 *   PUT    /projects/{id}/join-requests/{reqId}    → approve/reject (owner only)
 *   DELETE /projects/{id}/members/me               → leave project
 *   DELETE /projects/{id}/members/{userId}         → remove member (owner only)
 *   POST   /projects/{id}/interest                 → bookmark
 *   DELETE /projects/{id}/interest                 → remove bookmark
 *   GET    /projects/{id}/membership-status        → get user's status for this project
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}")
@RequiredArgsConstructor
public class JoinRequestController {

    private final JoinRequestService joinRequestService;

    // ─── JOIN REQUESTS ──────────────────────────────────────────────────

    /**
     * POST /projects/{id}/join-requests — request to join a project.
     *
     * Returns 201 CREATED with the join request data.
     * The request body is optional (message field).
     */
    @PostMapping("/join-requests")
    public ResponseEntity<ApiResponse<JoinRequestResponse>> createJoinRequest(
            @PathVariable Long projectId,
            @Valid @RequestBody(required = false) JoinRequestRequest request) {
        Long userId = getAuthenticatedUserId();
        // If no body was sent, create an empty request
        if (request == null) {
            request = new JoinRequestRequest();
        }
        JoinRequestResponse response = joinRequestService.createJoinRequest(projectId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Join request submitted successfully"));
    }

    /**
     * GET /projects/{id}/join-requests — list pending requests (owner only).
     *
     * The service checks ownership and throws 403 if the current user
     * is not the project owner.
     */
    @GetMapping("/join-requests")
    public ResponseEntity<ApiResponse<List<JoinRequestResponse>>> getPendingJoinRequests(
            @PathVariable Long projectId) {
        Long userId = getAuthenticatedUserId();
        List<JoinRequestResponse> requests = joinRequestService.getPendingJoinRequests(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    /**
     * PUT /projects/{id}/join-requests/{reqId} — approve or reject (owner only).
     *
     * Request body must contain { "status": "APPROVED" } or { "status": "REJECTED" }.
     * On approval, the requesting user is automatically added as a "Member".
     */
    @PutMapping("/join-requests/{requestId}")
    public ResponseEntity<ApiResponse<JoinRequestResponse>> reviewJoinRequest(
            @PathVariable Long projectId,
            @PathVariable Long requestId,
            @Valid @RequestBody ReviewJoinRequest request) {
        Long userId = getAuthenticatedUserId();
        JoinRequestResponse response = joinRequestService.reviewJoinRequest(
                projectId, requestId, userId, request);
        String action = "APPROVED".equals(request.getStatus()) ? "approved" : "rejected";
        return ResponseEntity.ok(ApiResponse.success(response, "Join request " + action));
    }

    // ─── MEMBERSHIP ─────────────────────────────────────────────────────

    /**
     * DELETE /projects/{id}/members/me — leave a project.
     *
     * The authenticated user removes themselves from the team.
     * The owner cannot leave (must delete the project instead).
     */
    @DeleteMapping("/members/me")
    public ResponseEntity<ApiResponse<Void>> leaveProject(
            @PathVariable Long projectId) {
        Long userId = getAuthenticatedUserId();
        joinRequestService.leaveProject(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "You have left the project"));
    }

    /**
     * DELETE /projects/{id}/members/{userId} — remove a member (owner only).
     *
     * The owner kicks a member out of the project.
     */
    @DeleteMapping("/members/{memberUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long memberUserId) {
        Long currentUserId = getAuthenticatedUserId();
        joinRequestService.removeMember(projectId, memberUserId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed from project"));
    }

    // ─── INTEREST (BOOKMARKS) ───────────────────────────────────────────

    /**
     * POST /projects/{id}/interest — bookmark a project.
     * Idempotent: bookmarking an already-bookmarked project is a no-op.
     */
    @PostMapping("/interest")
    public ResponseEntity<ApiResponse<Void>> addInterest(
            @PathVariable Long projectId) {
        Long userId = getAuthenticatedUserId();
        joinRequestService.addInterest(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Project bookmarked"));
    }

    /**
     * DELETE /projects/{id}/interest — remove bookmark.
     * Idempotent: removing a non-existent bookmark is a no-op.
     */
    @DeleteMapping("/interest")
    public ResponseEntity<ApiResponse<Void>> removeInterest(
            @PathVariable Long projectId) {
        Long userId = getAuthenticatedUserId();
        joinRequestService.removeInterest(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Bookmark removed"));
    }

    // ─── STATUS CHECK ───────────────────────────────────────────────────

    /**
     * GET /projects/{id}/membership-status — get current user's relationship.
     *
     * Returns { "status": "OWNER|MEMBER|PENDING|NONE", "interested": true/false }
     * The frontend uses this to decide which button to show.
     */
    @GetMapping("/membership-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMembershipStatus(
            @PathVariable Long projectId) {
        Long userId = getAuthenticatedUserId();
        String status = joinRequestService.getUserProjectStatus(projectId, userId);
        boolean interested = joinRequestService.isInterested(projectId, userId);
        Map<String, Object> result = Map.of("status", status, "interested", interested);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ─── HELPERS ────────────────────────────────────────────────────────

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }
}
