package com.collabhub.api.repository;

import com.collabhub.api.model.entity.JoinRequest;
import com.collabhub.api.model.enums.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    /**
     * Find all join requests for a project with a specific status.
     * Used by the owner to list pending requests.
     * SQL: SELECT * FROM join_request WHERE project_id = ? AND status = ?
     */
    List<JoinRequest> findByProjectIdAndStatus(Long projectId, JoinRequestStatus status);

    /**
     * Check if a user already has a pending request for a project.
     * Used to prevent duplicate pending requests.
     */
    Optional<JoinRequest> findByProjectIdAndUserIdAndStatus(
            Long projectId, Long userId, JoinRequestStatus status);

    /**
     * Check if a user has any pending request for a project.
     * Returns true/false — more efficient than loading the full entity.
     */
    boolean existsByProjectIdAndUserIdAndStatus(
            Long projectId, Long userId, JoinRequestStatus status);

    /**
     * Delete old join requests with a specific status.
     * Used when reviewing a request to prevent duplicate key errors.
     * The unique constraint is on (project_id, user_id, status), so we need
     * to delete any old request with the same status before updating a new one.
     *
     * @Modifying ensures this executes as a DELETE query and flushes immediately
     */
    @Modifying
    @Query("DELETE FROM JoinRequest jr WHERE jr.project.id = :projectId " +
           "AND jr.user.id = :userId AND jr.status = :status")
    void deleteByProjectIdAndUserIdAndStatus(
            @Param("projectId") Long projectId,
            @Param("userId") Long userId,
            @Param("status") JoinRequestStatus status);
}
