package com.collabhub.api.repository;

import com.collabhub.api.model.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for the Project entity.
 *
 * Extends two interfaces:
 *   - JpaRepository: standard CRUD + findAll with pagination
 *   - JpaSpecificationExecutor: enables findAll(Specification, Pageable)
 *     for dynamic filter queries built in ProjectSpecification
 *
 * The FULLTEXT search query is defined here as a native SQL query
 * because JPA Criteria API doesn't support MySQL's MATCH...AGAINST.
 */
public interface ProjectRepository extends JpaRepository<Project, Long>,
        JpaSpecificationExecutor<Project> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.user.id = :userId AND p.owner.id <> :userId ORDER BY p.createdAt DESC")
    List<Project> findJoinedProjects(@Param("userId") Long userId);

    /**
     * FULLTEXT search on title and description using MySQL's native index.
     *
     * MATCH(title, description) AGAINST(:query IN BOOLEAN MODE):
     *   - Uses the FULLTEXT index created in V5 migration
     *   - BOOLEAN MODE allows partial matching with wildcards
     *   - The caller appends '*' to the search term so "rea" matches "react"
     *
     * We also filter by visibility = 'PUBLIC' so unlisted projects
     * don't appear in search results.
     *
     * Spring Data handles pagination automatically from the Pageable param.
     */
    @Query(value = "SELECT * FROM project " +
            "WHERE MATCH(title, description) AGAINST(:query IN BOOLEAN MODE) " +
            "AND visibility = 'PUBLIC' " +
            "ORDER BY created_at DESC",
            countQuery = "SELECT COUNT(*) FROM project " +
                    "WHERE MATCH(title, description) AGAINST(:query IN BOOLEAN MODE) " +
                    "AND visibility = 'PUBLIC'",
            nativeQuery = true)
    Page<Project> searchByText(@Param("query") String query, Pageable pageable);
}
