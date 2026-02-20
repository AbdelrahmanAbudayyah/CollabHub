package com.collabhub.api.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_pic_url", length = 500)
    private String profilePicUrl;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @Column(name = "school_name", length = 200)
    private String schoolName;

    @Column(name = "custom_skills", columnDefinition = "JSON")
    private String customSkills;

    /**
     * Many-to-Many relationship: one user can have many skills,
     * and one skill can belong to many users.
     *
     * @ManyToMany tells JPA this is a M:N relationship.
     *
     * @JoinTable configures the join table in the database:
     *   - name = "user_skill" → the table we created in V4
     *   - joinColumns → the column in user_skill that points to THIS entity (user)
     *   - inverseJoinColumns → the column that points to the OTHER entity (skill)
     *
     * FetchType.LAZY means skills are NOT loaded from DB when you load a user.
     *   They're only fetched when you call user.getSkills(). This avoids
     *   loading tons of data you might not need.
     *
     * We use Set (not List) because a user can't have the same skill twice,
     * and Set enforces uniqueness in Java.
     *
     * @Builder.Default ensures the set is initialized to empty when using
     * the Builder pattern, so you don't get NullPointerException.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_skill",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> skills = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
