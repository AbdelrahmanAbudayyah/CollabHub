package com.collabhub.api.repository;

import com.collabhub.api.model.entity.ProjectInterest;
import com.collabhub.api.model.entity.ProjectInterestId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectInterestRepository extends JpaRepository<ProjectInterest, ProjectInterestId> {

    /**
     * Check if a user has bookmarked a specific project.
     * Uses the composite key fields (user.id, project.id).
     */
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);

    /**
     * Delete a bookmark by user and project.
     * Spring Data generates: DELETE FROM project_interest WHERE user_id = ? AND project_id = ?
     */
    void deleteByUserIdAndProjectId(Long userId, Long projectId);

    /**
     * Get all bookmarks for a user (for the dashboard "interested" tab later).
     */
    List<ProjectInterest> findByUserId(Long userId);
}
