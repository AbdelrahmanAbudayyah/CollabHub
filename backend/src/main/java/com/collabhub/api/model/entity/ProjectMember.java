package com.collabhub.api.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Tracks which users have joined a project and their role.
 *
 * The database has a unique constraint on (project_id, user_id),
 * so a user can only be a member of a project once. If someone
 * tries to add a duplicate, the DB throws a constraint violation.
 *
 * role defaults to "Member". The project creator gets "Owner".
 */
@Entity
@Table(name = "project_member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 100)
    @Builder.Default
    private String role = "Member";

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = Instant.now();
    }
}
