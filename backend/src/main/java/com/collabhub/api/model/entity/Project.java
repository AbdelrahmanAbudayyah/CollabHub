package com.collabhub.api.model.entity;

import com.collabhub.api.model.enums.ProjectStatus;
import com.collabhub.api.model.enums.ProjectVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * JPA entity mapping to the `project` table.
 *
 * Relationships:
 *   - owner (User)       → @ManyToOne: each project has one owner
 *   - skills (Set<Skill>) → @ManyToMany: via project_skill join table
 *   - tasks (List<ProjectTask>) → @OneToMany: project owns its tasks
 *   - members (List<ProjectMember>) → @OneToMany: project owns its members
 *
 * cascade = ALL on tasks and members means:
 *   When you save/delete the project, JPA automatically saves/deletes
 *   all its tasks and members too. So you can add a ProjectTask to
 *   project.getTasks(), then call projectRepository.save(project),
 *   and JPA inserts the task row automatically.
 *
 * orphanRemoval = true means:
 *   If you remove a task from project.getTasks(), JPA deletes it from
 *   the database. Without this, removed tasks would become "orphans"
 *   (rows with no parent reference).
 */
@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user who created this project.
     * @ManyToOne: many projects can belong to one user.
     * FetchType.LAZY: don't load the User object until getOwner() is called.
     * @JoinColumn: maps to the owner_id foreign key column in the DB.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_team_size", nullable = false, columnDefinition = "SMALLINT")
    private Integer maxTeamSize;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    /**
     * @Enumerated(STRING) stores the enum value as its name string
     * (e.g., "RECRUITING") rather than its ordinal index (e.g., 0).
     * This is safer because adding new enum values won't shift indices.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.RECRUITING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectVisibility visibility = ProjectVisibility.PUBLIC;

    @Column(name = "custom_skills", columnDefinition = "JSON")
    private String customSkills;

    /**
     * Same pattern as User's skills — @ManyToMany with a join table.
     * The project_skill table has (project_id, skill_id) as composite PK.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "project_skill",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> skills = new HashSet<>();

    /**
     * mappedBy = "project" means ProjectTask.project is the owning side.
     * cascade = ALL: save/delete project cascades to tasks.
     * orphanRemoval = true: removing a task from this list deletes it from DB.
     */
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectTask> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectMember> members = new ArrayList<>();

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
