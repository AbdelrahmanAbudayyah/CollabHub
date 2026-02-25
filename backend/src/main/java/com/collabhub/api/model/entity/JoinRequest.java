package com.collabhub.api.model.entity;

import com.collabhub.api.model.enums.JoinRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity for the `join_request` table.
 *
 * Represents a user's request to join a project. The owner reviews
 * it and sets status to APPROVED or REJECTED. On approval, a new
 * ProjectMember row is created by the service layer.
 *
 * @ManyToOne(LAZY) on project and user means these are only loaded
 * when accessed — avoids pulling full User/Project graphs on every query.
 *
 * reviewedAt is null until the owner takes action on the request.
 */
@Entity
@Table(name = "join_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JoinRequestStatus status = JoinRequestStatus.PENDING;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
