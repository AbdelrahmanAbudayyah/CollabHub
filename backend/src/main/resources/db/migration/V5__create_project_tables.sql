-- ============================================
-- TABLE: project
-- The main project table. Each project has an owner (the user who created it).
-- FULLTEXT index enables search on title and description.
-- ============================================
CREATE TABLE project (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id        BIGINT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    max_team_size   SMALLINT NOT NULL DEFAULT 5,
    github_url      VARCHAR(500),
    status          ENUM('RECRUITING','IN_PROGRESS','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'RECRUITING',
    visibility      ENUM('PUBLIC','UNLISTED') NOT NULL DEFAULT 'PUBLIC',
    custom_skills   JSON,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_project_owner (owner_id),
    INDEX idx_project_status (status),
    INDEX idx_project_created (created_at DESC),
    FULLTEXT INDEX idx_project_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project_skill
-- Join table: which predefined skills a project needs.
-- ============================================
CREATE TABLE project_skill (
    project_id  BIGINT NOT NULL,
    skill_id    BIGINT NOT NULL,
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project_task
-- Roles/tasks that a project needs filled.
-- is_filled tracks whether someone has been assigned.
-- ============================================
CREATE TABLE project_task (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    is_filled       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    INDEX idx_task_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project_member
-- Tracks which users have joined a project and their role.
-- The owner is added as a member with role 'Owner' on creation.
-- ============================================
CREATE TABLE project_member (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id  BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    role        VARCHAR(100) DEFAULT 'Member',
    joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_member_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
