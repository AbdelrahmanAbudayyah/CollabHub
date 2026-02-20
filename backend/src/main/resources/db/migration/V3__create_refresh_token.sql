CREATE TABLE refresh_token (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_refresh_user (user_id),
    INDEX idx_refresh_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
