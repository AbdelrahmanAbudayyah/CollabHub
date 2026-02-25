-- ============================================
-- TABLE: notification
-- In-app notifications for events like join
-- requests, approvals, rejections, etc.
-- ============================================
CREATE TABLE notification (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id    BIGINT NOT NULL,
    type            ENUM(
                        'JOIN_REQUEST_RECEIVED',
                        'JOIN_REQUEST_APPROVED',
                        'JOIN_REQUEST_REJECTED',
                        'MEMBER_LEFT',
                        'MEMBER_REMOVED',
                        'PROJECT_UPDATED'
                    ) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT,
    reference_id    BIGINT,
    reference_type  VARCHAR(50),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (recipient_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_notif_recipient_read (recipient_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
