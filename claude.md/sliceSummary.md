slice 0 summary: 

Monorepo structure:

backend/ — Spring Boot 3.2.5 (Java 17, Maven)
frontend/ — Next.js 16 (TypeScript, Tailwind CSS, App Router)
docker-compose.yml — MySQL 8.0 on port 3307 (since local MySQL occupies 3306)

Backend includes:

ApiResponse.java — uniform { status, data, message, timestamp } envelope
PagedResponse.java — pagination wrapper
GlobalExceptionHandler.java — handles all exception types with proper HTTP codes
SecurityConfig.java — stateless sessions, BCrypt(12), all routes open for now
CorsConfig.java — allows http://localhost:3000 with credentials
HealthController.java — GET /api/v1/health
Flyway migrations enabled, JWT dependencies ready

Frontend includes:

client.ts — Axios with auth interceptor + 401 refresh/retry
QueryProvider.tsx — TanStack Query setup
Full folder structure for components, lib, types, hooks, context
Verified:

Backend compiles, connects to MySQL, Flyway runs, health endpoint returns 200
CORS preflight responds correctly for localhost:3000
Frontend builds successfully

---

## Slice 3 Summary — User Profile (end-to-end)

### Backend files created/modified:

**New files:**
- `db/migration/V4__create_skill_and_user_skill.sql` — creates `skill` + `user_skill` tables, seeds ~33 skills across 5 categories (LANGUAGE, FRAMEWORK, TOOL, CONCEPT, OTHER)
- `model/entity/Skill.java` — Skill entity with @Enumerated(STRING) category
- `model/enums/SkillCategory.java` — enum: LANGUAGE, FRAMEWORK, TOOL, CONCEPT, OTHER
- `repository/SkillRepository.java` — findByCategoryOrderByNameAsc, findAllByOrderByNameAsc
- `service/SkillService.java` — getAllGroupedByCategory() returns Map<String, List<SkillResponse>>
- `controller/SkillController.java` — GET /api/v1/skills (public, no auth)
- `model/dto/request/UpdateProfileRequest.java` — optional fields with @Size validation + customSkills List<String>
- `model/dto/request/UpdateSkillsRequest.java` — Set<Long> skillIds with @NotNull
- `service/UserService.java` — getCurrentUser, getUserById, updateProfile (null-safe partial update), updateSkills (full replace), updateProfilePicUrl
- `controller/UserController.java` — GET/PUT /users/me, PUT /users/me/skills, POST /users/me/profile-pic, GET /users/{userId}
- `service/FileStorageService.java` — stores files to uploads/ dir, validates type+size, returns URL path
- `config/WebConfig.java` — maps /uploads/** to filesystem for static file serving

**Modified files:**
- `model/entity/User.java` — added @ManyToMany(fetch=LAZY) Set<Skill> skills with @JoinTable("user_skill") + @Builder.Default
- `model/dto/response/UserResponse.java` — expanded with all profile fields, skills list, customSkills JSON parsing via ObjectMapper
- `config/SecurityConfig.java` — already had /skills/**, /uploads/**, GET /users/{id} as permitAll (no changes needed)

### Frontend files created/modified:

**New files:**
- `lib/types/user.ts` — UserProfile, UpdateProfileData, UpdateSkillsData interfaces
- `lib/types/skill.ts` — Skill, SkillCategory, GroupedSkills types
- `lib/api/users.ts` — getCurrentUser, getUserById, updateProfile, updateSkills, uploadProfilePic
- `lib/api/skills.ts` — getSkillsGrouped
- `lib/data/schools.ts` — static array of ~30 US universities
- `components/profile/SkillSelector.tsx` — fetches skills, renders as clickable pills grouped by category, controlled component
- `components/profile/CustomSkillInput.tsx` — tag input (Enter to add, X to remove, Backspace to remove last)
- `components/profile/ProfilePicUpload.tsx` — file upload with instant preview (createObjectURL), validates client-side
- `app/profile/page.tsx` — profile edit form with RHF + Zod, SkillSelector, CustomSkillInput, ProfilePicUpload, school dropdown
- `app/users/[userId]/page.tsx` — public read-only profile with avatar, bio, skills badges, links
- `components/ui/badge.tsx` — shadcn Badge component (newly installed)

**Modified files:**
- `lib/utils/validators.ts` — added profileSchema (uses regex for URL validation, Zod 4 compatible — .url() is deprecated)
- `lib/context/AuthContext.tsx` — added refreshUser() that calls GET /users/me and updates context user data
- `components/layout/Navbar.tsx` — added clickable avatar circle + firstName linking to /profile, imports User icon from lucide-react

### Key patterns established:
- Controlled component pattern for skills (parent owns state, child renders + reports changes)
- Profile pic URL construction: server root + relative path (e.g. http://localhost:8080 + /uploads/profile-pics/uuid.jpg)
- Partial updates: null fields in UpdateProfileRequest mean "don't change"
- Custom skills stored as JSON string in DB, parsed via ObjectMapper in UserResponse.from()
- Dirty checking: no explicit save() needed inside @Transactional methods
- @Transactional(readOnly=true) for read-only methods, plain @Transactional for mutations
- Promise.all for parallel API calls in profile form submit (profile + skills)

### Current Flyway state: V4 (next migration is V5)
### Current SecurityConfig public routes: /auth/**, /health, /skills/**, /uploads/**, GET /projects, GET /projects/{id}, GET /projects/{id}/members, GET /users/{id}