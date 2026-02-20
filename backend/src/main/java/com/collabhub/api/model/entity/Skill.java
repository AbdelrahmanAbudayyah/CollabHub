package com.collabhub.api.model.entity;

import com.collabhub.api.model.enums.SkillCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Represents a predefined skill tag (e.g. "React", "Python").
 *
 * Maps to the `skill` table. Skills are shared — both users and
 * projects reference the same skill rows via join tables
 * (user_skill, project_skill).
 */
@Entity
@Table(name = "skill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique name like "React" or "Python"
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    // Category groups skills for display (e.g. LANGUAGE, FRAMEWORK)
    // @Enumerated(EnumType.STRING) tells JPA to store the enum as
    // its name ("LANGUAGE") rather than its ordinal (0).
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillCategory category;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
