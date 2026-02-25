package com.collabhub.api.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A role/task that a project needs filled.
 * Example: "Frontend Developer", "ML Engineer".
 *
 * @ManyToOne to Project: each task belongs to exactly one project.
 * The project_id column is the foreign key.
 *
 * is_filled tracks whether someone has been assigned to this task.
 */
@Entity
@Table(name = "project_task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_filled", nullable = false)
    @Builder.Default
    private Boolean isFilled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
