package com.collabhub.api.specification;

import com.collabhub.api.model.entity.Project;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Builds dynamic JPA Criteria queries for filtering projects.
 *
 * Spring Data JPA's Specification interface lets us compose WHERE clauses
 * at runtime. Each filter parameter adds a predicate to the query only
 * if it's provided — avoiding dozens of separate repository methods.
 *
 * Usage:
 *   Specification<Project> spec = ProjectSpecification.withFilters(Set.of(1L, 5L), "RECRUITING");
 *   Page<Project> results = projectRepository.findAll(spec, pageable);
 *
 * FULLTEXT search is handled separately via a native @Query in the
 * repository, because JPA Criteria API doesn't support MySQL's
 * MATCH...AGAINST syntax natively.
 */
public class ProjectSpecification {

    /**
     * Builds a composed specification from optional filters.
     *
     * @param skillIds  Filter by required skills. Null/empty = skip.
     * @param status    Filter by project status (e.g., "RECRUITING"). Null = skip.
     * @param school    Filter by owner's school name. Null = skip.
     * @return A Specification combining all active filters with AND.
     */
    public static Specification<Project> withFilters(Set<Long> skillIds, String status, String school) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by skill IDs — project must have at least one of the given skills
            if (skillIds != null && !skillIds.isEmpty()) {
                predicates.add(hasSkills(skillIds).toPredicate(root, query, cb));
            }

            // Filter by project status
            if (status != null && !status.isBlank()) {
                predicates.add(hasStatus(status).toPredicate(root, query, cb));
            }

            // Filter by owner's school
            if (school != null && !school.isBlank()) {
                predicates.add(hasSchool(school).toPredicate(root, query, cb));
            }

            // Only show PUBLIC projects on the browse page
            predicates.add(cb.equal(root.get("visibility").as(String.class), "PUBLIC"));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Filter projects that have at least one of the given skill IDs.
     *
     * Uses root.join("skills") to navigate the @ManyToMany relationship.
     * JPA translates this to a JOIN on the project_skill table.
     * query.distinct(true) prevents duplicate rows when a project
     * matches multiple skills in the set.
     */
    private static Specification<Project> hasSkills(Set<Long> skillIds) {
        return (root, query, cb) -> {
            Join<Object, Object> skillJoin = root.join("skills");
            query.distinct(true);
            return skillJoin.get("id").in(skillIds);
        };
    }

    /**
     * Simple equality filter on the status column.
     * Status is stored as an ENUM string in MySQL (RECRUITING, IN_PROGRESS, etc.).
     */
    private static Specification<Project> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("status").as(String.class), status);
    }

    /**
     * Filter projects by the owner's school name.
     * Joins to the owner (User) table and filters on school_name.
     */
    private static Specification<Project> hasSchool(String school) {
        return (root, query, cb) -> {
            Join<Object, Object> ownerJoin = root.join("owner");
            return cb.equal(ownerJoin.get("schoolName"), school);
        };
    }
}
