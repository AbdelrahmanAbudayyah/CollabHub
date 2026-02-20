-- ============================================
-- TABLE: skill
-- Stores predefined skill tags (e.g. "React", "Python")
-- shared across users and projects.
-- ============================================
CREATE TABLE skill (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    ENUM('LANGUAGE','FRAMEWORK','TOOL','CONCEPT','OTHER') NOT NULL DEFAULT 'OTHER',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: user_skill
-- Many-to-many join table: which users have which skills.
-- Composite primary key (user_id, skill_id) prevents duplicates.
-- ON DELETE CASCADE means if a user or skill is deleted,
-- the linking row is automatically removed.
-- ============================================
CREATE TABLE user_skill (
    user_id     BIGINT NOT NULL,
    skill_id    BIGINT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED: Predefined skills (~30 across 5 categories)
-- These give users a curated list to pick from.
-- ============================================

-- Languages
INSERT INTO skill (name, category) VALUES
    ('JavaScript', 'LANGUAGE'),
    ('TypeScript', 'LANGUAGE'),
    ('Python', 'LANGUAGE'),
    ('Java', 'LANGUAGE'),
    ('C++', 'LANGUAGE'),
    ('C#', 'LANGUAGE'),
    ('Go', 'LANGUAGE'),
    ('Rust', 'LANGUAGE'),
    ('Swift', 'LANGUAGE'),
    ('Kotlin', 'LANGUAGE');

-- Frameworks
INSERT INTO skill (name, category) VALUES
    ('React', 'FRAMEWORK'),
    ('Next.js', 'FRAMEWORK'),
    ('Angular', 'FRAMEWORK'),
    ('Vue.js', 'FRAMEWORK'),
    ('Spring Boot', 'FRAMEWORK'),
    ('Django', 'FRAMEWORK'),
    ('Express.js', 'FRAMEWORK'),
    ('Flask', 'FRAMEWORK'),
    ('React Native', 'FRAMEWORK'),
    ('Flutter', 'FRAMEWORK');

-- Tools
INSERT INTO skill (name, category) VALUES
    ('Git', 'TOOL'),
    ('Docker', 'TOOL'),
    ('AWS', 'TOOL'),
    ('PostgreSQL', 'TOOL'),
    ('MongoDB', 'TOOL'),
    ('MySQL', 'TOOL'),
    ('Redis', 'TOOL'),
    ('Figma', 'TOOL');

-- Concepts
INSERT INTO skill (name, category) VALUES
    ('Machine Learning', 'CONCEPT'),
    ('REST APIs', 'CONCEPT'),
    ('GraphQL', 'CONCEPT'),
    ('CI/CD', 'CONCEPT'),
    ('Agile/Scrum', 'CONCEPT');
