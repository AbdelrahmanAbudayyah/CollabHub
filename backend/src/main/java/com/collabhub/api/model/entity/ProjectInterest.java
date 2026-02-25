package com.collabhub.api.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity for the `project_interest` table (bookmarks).
 *
 * Uses @IdClass for the composite primary key (user_id, project_id).
 * The field names in this entity ("user", "project") must match
 * the field names in ProjectInterestId exactly — JPA uses name
 * matching to wire them together.
 *
 * No separate ID column — the combination of user + project IS the key.
 */
@Entity
@Table(name = "project_interest")
@IdClass(ProjectInterestId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectInterest {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
