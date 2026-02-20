# CollabHub: Collaborative Platform for College Engineers

## Context

Build a website where college engineers, new grads, and developers can post project ideas, discover projects, join teams, and build real-world experience together. The user needs a full technical plan before any code is written.

**Key decisions:**
- Open registration (email + password only, no OAuth in MVP)
- Join project flow: request + approval by project owner
- In-app notifications only (no email, no real-time chat, poll every 60s)
- School field: frontend dataset file with school names, stored as free-text string on user
- JWT signing: HS256 (shared secret) for simplicity in single-backend MVP
- Custom skills: stored as JSON array on user/project (private, not in global skill table)
- Profile pics: local filesystem for MVP (accept loss on redeploy)
- No password recovery in MVP
- No account deletion in MVP (transfer ownership to first member, then delete -- deferred)
- UI: clean & minimal style, light mode only
- Browse page: grid of cards, filters with "Apply" button, filter state in URL params
- Guest access: can see project title + description + skills; login required for team, tasks, actions
- Project creation: multi-step wizard (basics -> tech stack -> tasks), no drafts
- Join approval: adds as generic "Member", owner can change role later
- Project description: plain text only
- Notifications: dropdown showing 5 recent + "View all" link to full page
- Team display on project page: avatar + name + role (clickable to profile)
- Dashboard join requests: flat list (not grouped by project)

---

## 1. System Architecture

```
[Browser] --> [CloudFront CDN] --> [ALB]
                                    |
                          +---------+---------+
                          |                   |
                   [Next.js/ECS]       [Spring Boot/ECS]
                   (port 3000)          (port 8080, /api/**)
                                          |
                                    [ MySQL 8.0]
                                    
```

- Frontend calls backend REST API directly via Axios
- All API responses use uniform envelope: `{ status, data, message, timestamp }`
- Pagination: offset-based with `page`, `size`, `totalElements`, `totalPages`
- All dates ISO 8601 UTC. All IDs are `BIGINT`.
- CORS configured in Spring Boot to allow the frontend origin

---


## 3. API Design

All endpoints prefixed with `/api/v1`. Auth via `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Returns access + refresh tokens |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | Yes | Revoke refresh token |

#### Register Request
```json
{
  "email": "user@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login Response
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "dGhpcyBpcyBh...",
    "expiresIn": 900,
    "user": { "id": 1, "email": "...", "firstName": "...", "lastName": "...", "profilePicUrl": null }
  }
}
```

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Yes | Current user's profile |
| PUT | `/users/me` | Yes | Update profile |
| PUT | `/users/me/skills` | Yes | Replace skill list |
| POST | `/users/me/profile-pic` | Yes | Upload profile picture |
| GET | `/users/{userId}` | No | Public profile |

### Projects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects` | Yes | Create project |
| GET | `/projects` | No | List/search with filters: `q`, `schoolId`, `skillIds`, `status`, `page`, `size`, `sort` |
| GET | `/projects/{id}` | No | Project detail |
| PUT | `/projects/{id}` | Yes (owner) | Update |
| DELETE | `/projects/{id}` | Yes (owner) | Delete |
| GET | `/projects/me/owned` | Yes | My owned projects |
| GET | `/projects/me/joined` | Yes | My joined projects |
| GET | `/projects/me/interested` | Yes | My bookmarked projects |

#### Create Project Request
```json
{
  "title": "AI-Powered Study Group Matcher",
  "description": "A platform that uses ML to match students...",
  "maxTeamSize": 6,
  "githubUrl": "https://github.com/user/project",
  "skillIds": [1, 5, 12],
  "tasks": [
    { "title": "Frontend Developer", "description": "Build React UI components" },
    { "title": "ML Engineer", "description": "Design matching algorithm" }
  ]
}
```

### Membership
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects/{id}/join-requests` | Yes | Request to join (with `message`) |
| GET | `/projects/{id}/join-requests` | Yes (owner) | List pending |
| PUT | `/projects/{id}/join-requests/{reqId}` | Yes (owner) | Approve/reject |
| DELETE | `/projects/{id}/members/me` | Yes | Leave project |
| DELETE | `/projects/{id}/members/{userId}` | Yes (owner) | Remove member |
| GET | `/projects/{id}/members` | No | List members |

### Interest & Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects/{id}/interest` | Yes | Bookmark |
| DELETE | `/projects/{id}/interest` | Yes | Remove bookmark |
| GET | `/notifications` | Yes | List (paginated) |
| GET | `/notifications/unread-count` | Yes | Unread count |
| PUT | `/notifications/{id}/read` | Yes | Mark read |
| PUT | `/notifications/read-all` | Yes | Mark all read |

### Reference Data
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/skills` | No | List skills (optional `?category=FRAMEWORK`) |

> **Note:** Schools are served from a static frontend dataset (`lib/data/schools.ts`), no backend endpoint needed.

---

## 4. Frontend Architecture

### Tech: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui

### State management
- **Server state:** TanStack Query (React Query) for all API data
- **Auth state:** React Context (`AuthContext`)
- **Form state:** React Hook Form + Zod validation
- **UI state:** `useState` + URL search params for filters

### Folder Structure
```
frontend/
  src/
    app/                              # Next.js App Router
      layout.tsx                      # Root layout (providers, navbar, footer)
      page.tsx                        # Home page (/)
      (auth)/
        login/page.tsx
        register/page.tsx
      projects/
        page.tsx                      # Browse/search projects
        [projectId]/page.tsx          # Project detail
        create/page.tsx               # Create project form
      dashboard/
        page.tsx                      # My Projects Dashboard (3 tabs)
      profile/
        page.tsx                      # Edit own profile
      users/
        [userId]/page.tsx             # Public user profile

    components/
      ui/                             # shadcn/ui primitives (Button, Input, Modal, Badge, etc.)
      layout/                         # Navbar, Footer, MobileMenu, NotificationBell
      auth/                           # LoginForm, RegisterForm, ProtectedRoute
      projects/                       # ProjectCard, ProjectGrid, ProjectFilters, JoinRequestButton, etc.
      profile/                        # ProfileForm, SkillSelector, ProfilePicUpload
      dashboard/                      # OwnedProjectsTab, JoinedProjectsTab, InterestedProjectsTab

    lib/
      api/                            # Axios client + per-domain API modules
        client.ts                     # Axios instance with interceptors
        auth.ts, users.ts, projects.ts, notifications.ts, schools.ts, skills.ts
      hooks/                          # useAuth, useProjects, useNotifications, useDebounce
      context/
        AuthContext.tsx
      types/                          # TypeScript interfaces (user.ts, project.ts, notification.ts, api.ts)
      utils/                          # validators.ts (Zod schemas), formatters.ts, constants.ts
```

### Routing Protection
- `middleware.ts` at root: coarse guard checking for refresh token cookie on protected routes
- `ProtectedRoute` component: client-side auth check with refresh attempt

### API Client
- Axios with request interceptor (attach access token from memory) and response interceptor (401 -> refresh -> retry)
- Access token in memory, refresh token as `httpOnly` cookie
- Schools dataset: static JSON/TS file in `lib/data/schools.ts` used by the school dropdown component
- Profile pic uploads: stored on the Spring Boot server's local filesystem (e.g., `uploads/` directory), served as static files

---

## 5. Auth Strategy

- **Access token:** JWT (HS256), 15-minute expiry, stored in memory (not localStorage)
- **Refresh token:** 7-day expiry, `httpOnly` + `Secure` + `SameSite=Strict` cookie, hashed in DB, rotation on every use
- **Password hashing:** BCrypt (strength 12)
- **Spring Security:** stateless session, JWT filter before `UsernamePasswordAuthenticationFilter`
- No email verification or password reset in MVP (deferred until email service is added)

---


## 6. MVP Scope

### In MVP
- Auth flow (register, login, logout)
- User profiles (edit, view, skills, profile pic, school)
- Project CRUD with tech stack and tasks
- Browse/search with filters (school, skills, industry, full-text search)
- Join request flow (request -> approve/reject)
- Leave project, owner removes members
- Bookmark/interest projects
- Dashboard (owned, joined, interested projects + pending requests)
- In-app notifications (no email)
- Responsive design

### Deferred to post-MVP
- Email notifications (verification, password reset, join request emails)
- Real-time chat/messaging
- WebSocket notifications (use polling for now)
- Project comments/discussion
- Admin panel / moderation
- Recommendation engine
- Elasticsearch
- Project milestones / kanban

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Slow FULLTEXT search at scale | Acceptable for <10K projects. Migrate to Elasticsearch later. |
| JWT key compromise | HS256 secret in env var, rotate periodically |
| Upload abuse | 2MB max, JPEG/PNG/WebP only, server-side validation |
| N+1 queries | `@EntityGraph` / `JOIN FETCH` in JPA, SQL logging during dev |
| Spring Boot cold start on Fargate | Min 2 tasks always warm |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. **Project setup:** Git monorepo (`frontend/`, `backend/`), Spring Boot init, Next.js init, Docker Compose for MySQL
2. **Backend scaffolding:** Package structure, global exception handler, `ApiResponse<T>` wrapper, Flyway migrations for all tables, seed schools/skills
3. **Frontend scaffolding:** Folder structure, Axios client, TanStack Query setup, shadcn/ui init, Tailwind theme
4. **Authentication (backend):** User entity, AuthService (register/login/refresh/logout), JwtService (HS256), JwtAuthFilter, SecurityConfig
5. **Authentication (frontend):** AuthContext, LoginForm, RegisterForm, login/register pages, token refresh interceptor, ProtectedRoute, middleware.ts
6. **Schools dataset:** Create static schools data file for frontend dropdown

### Phase 2: Core Features (Weeks 3-5)
7. **User profiles:** Backend CRUD + skills + profile pic upload to local storage. Frontend profile edit page, public profile page, SkillSelector, Navbar with avatar
8. **Projects CRUD:** Backend entities + ProjectSpecification for filtering + FULLTEXT search. Frontend create form, browse page with filters, detail page
9. **Membership:** Join requests, approve/reject, leave/remove. Interest/bookmark toggle. JoinRequestButton with contextual states

### Phase 3: Dashboard & Notifications (Weeks 6-7)
10. **Dashboard:** Three tabs (owned/joined/interested), pending request badges, JoinRequestCard with approve/reject
11. **Notifications:** Backend NotificationService (in-app only, no email), NotificationBell polling every 60s

### Phase 4: Polish & Deploy (Weeks 8-10)
11. **Home page:** Latest recruiting projects, browse by school, popular stacks
12. **Polish:** Loading skeletons, empty states, error boundaries, responsive design pass
13. **Testing:** Backend unit + integration tests, frontend component tests, Playwright E2E

---

## 10. Spring Boot Package Structure

```
com.collabhub.api/
  CollabhubApplication.java
  config/          SecurityConfig, CorsConfig, WebConfig, AsyncConfig
  security/        JwtService, JwtAuthFilter, UserPrincipal
  controller/      AuthController, UserController, ProjectController, JoinRequestController,
                   NotificationController, SkillController
  service/         AuthService, UserService, ProjectService, JoinRequestService,
                   NotificationService, FileStorageService
  repository/      UserRepository, ProjectRepository, ProjectMemberRepository,
                   JoinRequestRepository, NotificationRepository, SkillRepository,
                   RefreshTokenRepository, ProjectInterestRepository
  model/
    entity/        User, Project, ProjectMember, ProjectTask, JoinRequest,
                   Notification, Skill, RefreshToken, ProjectInterest
    dto/
      request/     RegisterRequest, LoginRequest, CreateProjectRequest, UpdateProjectRequest,
                   JoinRequestRequest, ReviewJoinRequest, UpdateProfileRequest
      response/    AuthResponse, UserResponse, ProjectResponse, JoinRequestResponse,
                   NotificationResponse, ApiResponse, PagedResponse
    enums/         ProjectStatus, JoinRequestStatus, NotificationType, SkillCategory
  exception/       GlobalExceptionHandler, ResourceNotFoundException, UnauthorizedException,
                   BadRequestException, ConflictException
  specification/   ProjectSpecification
```

---

## 11. Verification Plan

1. **Local dev:** `docker-compose up` for MySQL, start Spring Boot and Next.js locally
2. **Auth flow:** Register -> login -> access protected pages -> refresh token -> logout
3. **Project flow:** Create project -> browse/search -> view detail -> join request -> owner approves -> member appears
4. **Dashboard:** Verify owned/joined/interested tabs, join request approve/reject
5. **Notifications:** In-app notifications appear on join request/approval/rejection
6. **E2E test:** Register two users -> user A creates project -> user B finds and requests to join -> user A approves -> both see updated team
