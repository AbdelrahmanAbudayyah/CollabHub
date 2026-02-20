package com.collabhub.api.repository;

import com.collabhub.api.model.entity.Skill;
import com.collabhub.api.model.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for the Skill entity.
 *
 * You don't write SQL here — Spring auto-generates queries from
 * method names. "findByCategory" becomes:
 *   SELECT * FROM skill WHERE category = ?
 *
 * "findAllByOrderByNameAsc" becomes:
 *   SELECT * FROM skill ORDER BY name ASC
 */
public interface SkillRepository extends JpaRepository<Skill, Long> {

    // Find all skills in a specific category, sorted alphabetically
    List<Skill> findByCategoryOrderByNameAsc(SkillCategory category);

    // Find all skills sorted alphabetically (for the full list)
    List<Skill> findAllByOrderByNameAsc();
}
