package com.collabhub.api.service;

import com.collabhub.api.exception.BadRequestException;
import com.collabhub.api.exception.ConflictException;
import com.collabhub.api.exception.ForbiddenException;
import com.collabhub.api.exception.ResourceNotFoundException;
import com.collabhub.api.model.dto.request.JoinRequestRequest;
import com.collabhub.api.model.dto.request.ReviewJoinRequest;
import com.collabhub.api.model.dto.response.JoinRequestResponse;
import com.collabhub.api.model.entity.*;
import com.collabhub.api.model.enums.JoinRequestStatus;
import com.collabhub.api.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for join requests, membership management, and bookmarks.
 *
 * All public methods validate authorization and business rules before
 * performing the operation. Exceptions are caught by GlobalExceptionHandler
 * and returned as proper HTTP error responses.
 */
@Service
@RequiredArgsConstructor
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInterestRepository projectInterestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EntityManager entityManager;

    // ─── JOIN REQUEST: CREATE ────────────────────────────────────────────

    /**
     * Submit a request to join a project.
     *
     * Validation checks (in order):
     *   1. Project exists → 404 if not
     *   2. User can't join their own project → 400
     *   3. User can't be an existing member → 409
     *   4. User can't have a pending request already → 409
     *   5. Team can't be full → 400
     *
     * On success, creates a JoinRequest with PENDING status.
     * The project owner can then approve/reject it.
     */
    @Transactional
    public JoinRequestResponse createJoinRequest(Long projectId, Long userId,
                                                  JoinRequestRequest request) {
        Project project = findProjectOrThrow(projectId);
        User user = findUserOrThrow(userId);

        // Can't join your own project
        if (project.getOwner().getId().equals(userId)) {
            throw new BadRequestException("You cannot request to join your own project");
        }

        // Can't join if already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ConflictException("You are already a member of this project");
        }

        // Can't have duplicate pending request
        if (joinRequestRepository.existsByProjectIdAndUserIdAndStatus(
                projectId, userId, JoinRequestStatus.PENDING)) {
            throw new ConflictException("You already have a pending join request for this project");
        }

        // Can't join if team is full
        long currentMembers = projectMemberRepository.countByProjectId(projectId);
        if (currentMembers >= project.getMaxTeamSize()) {
            throw new BadRequestException("This project's team is full");
        }

        JoinRequest joinRequest = JoinRequest.builder()
                .project(project)
                .user(user)
                .message(request.getMessage() != null ? request.getMessage().trim() : null)
                .build();

        JoinRequest saved = joinRequestRepository.save(joinRequest);
        notificationService.notifyJoinRequestReceived(project, user);
        return JoinRequestResponse.from(saved);
    }

    // ─── JOIN REQUEST: LIST PENDING ──────────────────────────────────────

    /**
     * Get all pending join requests for a project (owner only).
     *
     * Only returns PENDING requests — approved/rejected ones are
     * historical and not shown in the review UI.
     */
    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getPendingJoinRequests(Long projectId, Long currentUserId) {
        Project project = findProjectOrThrow(projectId);
        assertOwner(project, currentUserId);

        return joinRequestRepository
                .findByProjectIdAndStatus(projectId, JoinRequestStatus.PENDING)
                .stream()
                .map(JoinRequestResponse::from)
                .collect(Collectors.toList());
    }

    // ─── JOIN REQUEST: APPROVE / REJECT ──────────────────────────────────

    /**
     * Review (approve or reject) a join request.
     *
     * On APPROVE:
     *   1. Check team isn't full (could have filled up since the request was made)
     *   2. Delete any old join requests with APPROVED/REJECTED status (prevents duplicate key error)
     *   3. Create a new ProjectMember with role "Member"
     *   4. Update request status to APPROVED + set reviewedAt timestamp
     *
     * On REJECT:
     *   1. Delete any old join requests with APPROVED/REJECTED status (prevents duplicate key error)
     *   2. Update status to REJECTED + set reviewedAt.
     *
     * Why delete old requests? The DB has a unique constraint on (project_id, user_id, status).
     * If a user was previously approved, left, and requested again, we'd have an old APPROVED
     * row. Trying to approve the new request would create a duplicate APPROVED row → error.
     *
     * Dirty checking handles the status update — no explicit save() needed
     * for the JoinRequest because it's already in the persistence context.
     * But the new ProjectMember needs explicit save() since it's a new entity.
     */
    @Transactional
    public JoinRequestResponse reviewJoinRequest(Long projectId, Long requestId,
                                                  Long currentUserId, ReviewJoinRequest request) {
        Project project = findProjectOrThrow(projectId);
        assertOwner(project, currentUserId);

        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));

        // Make sure this request belongs to this project
        if (!joinRequest.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Join request not found for this project");
        }

        // Can only review PENDING requests
        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("This join request has already been reviewed");
        }

        JoinRequestStatus newStatus = JoinRequestStatus.valueOf(request.getStatus());

        // Clean up old join requests with the same status to prevent duplicate key errors
        // (unique constraint is on project_id, user_id, status)
        joinRequestRepository.deleteByProjectIdAndUserIdAndStatus(
                projectId, joinRequest.getUser().getId(), newStatus);

        // Flush the delete to the database before updating the current request
        entityManager.flush();

        if (newStatus == JoinRequestStatus.APPROVED) {
            // Check team isn't full before approving
            long currentMembers = projectMemberRepository.countByProjectId(projectId);
            if (currentMembers >= project.getMaxTeamSize()) {
                throw new BadRequestException("Cannot approve — team is full");
            }

            // Create new member with default "Member" role
            ProjectMember newMember = ProjectMember.builder()
                    .project(project)
                    .user(joinRequest.getUser())
                    .role("Member")
                    .build();
            projectMemberRepository.save(newMember);
        }

        // Update the join request status (dirty checking handles the UPDATE)
        joinRequest.setStatus(newStatus);
        joinRequest.setReviewedAt(Instant.now());

        // Notify the requester about the decision
        if (newStatus == JoinRequestStatus.APPROVED) {
            notificationService.notifyJoinRequestApproved(project, joinRequest.getUser());
        } else {
            notificationService.notifyJoinRequestRejected(project, joinRequest.getUser());
        }

        return JoinRequestResponse.from(joinRequest);
    }

    // ─── MEMBERSHIP: LEAVE ──────────────────────────────────────────────

    /**
     * Leave a project (authenticated user removes themselves).
     *
     * The owner cannot leave their own project — they must delete it
     * or transfer ownership first (transfer not implemented in MVP).
     */
    @Transactional
    public void leaveProject(Long projectId, Long userId) {
        Project project = findProjectOrThrow(projectId);

        // Owner can't leave
        if (project.getOwner().getId().equals(userId)) {
            throw new BadRequestException("The project owner cannot leave. Delete the project instead.");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new BadRequestException("You are not a member of this project"));

        User user = member.getUser();
        projectMemberRepository.delete(member);
        notificationService.notifyMemberLeft(project, user);
    }

    // ─── MEMBERSHIP: REMOVE (owner kicks a member) ──────────────────────

    /**
     * Remove a member from a project (owner only).
     *
     * The owner can't remove themselves — use deleteProject for that.
     */
    @Transactional
    public void removeMember(Long projectId, Long memberUserId, Long currentUserId) {
        Project project = findProjectOrThrow(projectId);
        assertOwner(project, currentUserId);

        // Can't remove yourself (the owner)
        if (memberUserId.equals(currentUserId)) {
            throw new BadRequestException("You cannot remove yourself from the project");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this project"));

        User removedUser = member.getUser();
        projectMemberRepository.delete(member);
        notificationService.notifyMemberRemoved(project, removedUser);
    }

    // ─── BOOKMARK: ADD ──────────────────────────────────────────────────

    /**
     * Bookmark (express interest in) a project.
     * Idempotent — if already bookmarked, does nothing (no error).
     *
     * Validation: Users cannot bookmark projects they own.
     */
    @Transactional
    public void addInterest(Long projectId, Long userId) {
        Project project = findProjectOrThrow(projectId);
        User user = findUserOrThrow(userId);

        // Can't bookmark your own project
        if (project.getOwner().getId().equals(userId)) {
            throw new BadRequestException("You cannot bookmark your own project");
        }

        if (projectInterestRepository.existsByUserIdAndProjectId(userId, projectId)) {
            return; // Already bookmarked — idempotent
        }

        ProjectInterest interest = ProjectInterest.builder()
                .user(user)
                .project(project)
                .build();
        projectInterestRepository.save(interest);
    }

    // ─── BOOKMARK: REMOVE ───────────────────────────────────────────────

    /**
     * Remove a bookmark from a project.
     * Idempotent — if not bookmarked, does nothing.
     */
    @Transactional
    public void removeInterest(Long projectId, Long userId) {
        findProjectOrThrow(projectId); // Verify project exists
        projectInterestRepository.deleteByUserIdAndProjectId(userId, projectId);
    }

    // ─── STATUS CHECK (for frontend button state) ───────────────────────

    /**
     * Check the current user's relationship to a project.
     * Returns a simple status string the frontend uses to decide
     * which button to show (Join / Pending / Member / Owner).
     */
    @Transactional(readOnly = true)
    public String getUserProjectStatus(Long projectId, Long userId) {
        Project project = findProjectOrThrow(projectId);

        if (project.getOwner().getId().equals(userId)) {
            return "OWNER";
        }
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            return "MEMBER";
        }
        if (joinRequestRepository.existsByProjectIdAndUserIdAndStatus(
                projectId, userId, JoinRequestStatus.PENDING)) {
            return "PENDING";
        }
        return "NONE";
    }

    /**
     * Check if the current user has bookmarked a project.
     */
    @Transactional(readOnly = true)
    public boolean isInterested(Long projectId, Long userId) {
        return projectInterestRepository.existsByUserIdAndProjectId(userId, projectId);
    }

    // ─── HELPERS ────────────────────────────────────────────────────────

    private Project findProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void assertOwner(Project project, Long currentUserId) {
        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the project owner can perform this action");
        }
    }
}
