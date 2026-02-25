-- ============================================
-- TABLE: join_request
-- Tracks requests from users wanting to join a project.
-- Status flow: PENDING → APPROVED or REJECTED (or CANCELLED by requester).
-- The unique constraint on (project_id, user_id, status) allows a user
-- to re-request after a previous rejection (different status = different row).
-- ============================================
CREATE TABLE join_request (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    message         TEXT,
    status          ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    reviewed_at     TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_request_project_user (project_id, user_id, status),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_request_project_status (project_id, status),
    INDEX idx_request_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project_interest
-- Simple bookmark/interest table — users can bookmark projects
-- they want to follow. Composite PK ensures one bookmark per user per project.
-- ============================================
CREATE TABLE project_interest (
    user_id     BIGINT NOT NULL,
    project_id  BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
