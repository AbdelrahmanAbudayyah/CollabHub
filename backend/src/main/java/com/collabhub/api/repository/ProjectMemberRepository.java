package com.collabhub.api.repository;

import com.collabhub.api.model.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    /**
     * Find all members of a specific project.
     * Spring Data derives the SQL from the method name:
     *   SELECT * FROM project_member WHERE project_id = ?
     */
    List<ProjectMember> findByProjectId(Long projectId);

    /**
     * Check if a user is already a member of a project.
     * Used to prevent joining a project you're already in.
     */
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    /**
     * Find a specific membership (for leave/remove operations).
     */
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    /**
     * Count current members of a project.
     * Used to check if the team is full before approving a join request.
     */
    long countByProjectId(Long projectId);
}
