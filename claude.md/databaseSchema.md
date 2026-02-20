## 2. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `app_user` | User accounts (renamed from `user` to avoid MySQL reserved word) |
| `skill` | Normalized skill tags shared by users and projects |
| `user_skill` | Many-to-many: user <-> skill |
| `project` | Projects with FULLTEXT index on title/description |
| `project_skill` | Many-to-many: project tech stack |
| `project_task` | Roles/tasks needed on a project |
| `project_member` | Approved team members |
| `join_request` | Pending/processed join requests (PENDING/APPROVED/REJECTED/CANCELLED) |
| `project_interest` | Bookmarked projects |
| `notification` | In-app notifications |
| `refresh_token` | JWT refresh token rotation tracking |

### Key relationships
- `app_user` 1-->* `project` (owner)
- `app_user` *--* `project` (through `project_member`)
- `app_user` *--* `project` (through `join_request`)
- `app_user` *--* `project` (through `project_interest`)
- `app_user` *--* `skill` (through `user_skill`)
- `project` *--* `skill` (through `project_skill`)
- `project` 1-->* `project_task`

### Key design decisions
- Skills are normalized into a shared table so filtering is consistent across users and projects
- `join_request` allows re-requesting after rejection (unique on `project_id, user_id, status`)
- FULLTEXT index on `project(title, description)` for search
- `project.status`: RECRUITING, IN_PROGRESS, COMPLETED, ARCHIVED

### Complete DDL

```sql
-- ============================================
-- TABLE: app_user
-- ============================================
CREATE TABLE app_user (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    bio             TEXT,
    profile_pic_url VARCHAR(500),
    linkedin_url    VARCHAR(500),
    github_url      VARCHAR(500),
    school_name     VARCHAR(200),
    custom_skills   JSON,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: skill
-- ============================================
CREATE TABLE skill (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    ENUM('LANGUAGE','FRAMEWORK','TOOL','CONCEPT','OTHER') NOT NULL DEFAULT 'OTHER',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: user_skill
-- ============================================
CREATE TABLE user_skill (
    user_id     BIGINT NOT NULL,
    skill_id    BIGINT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project
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
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE,
    INDEX idx_project_owner (owner_id),
    INDEX idx_project_status (status),
    INDEX idx_project_created (created_at DESC),
    custom_skills   JSON,
    FULLTEXT INDEX idx_project_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: project_skill
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

-- ============================================
-- TABLE: join_request
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
-- ============================================
CREATE TABLE project_interest (
    user_id     BIGINT NOT NULL,
    project_id  BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: notification
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

-- ============================================
-- TABLE: refresh_token
-- ============================================
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
```

---
