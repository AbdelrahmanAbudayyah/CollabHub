# Session Summary — CollabHub Planning

## What was accomplished
This session was entirely **planning and design** — no code was written. We created a comprehensive technical plan for CollabHub, a collaborative platform for college engineers and regular engineers to share project ideas and form teams.

## Files created
- **plan.md** — Full technical plan (architecture, API design, frontend architecture, auth strategy, MVP scope, risks, roadmap, package structure, verification plan)
- **Todos.md** — Implementation broken into 10 vertical slices (Slice 0–9), each delivering end-to-end functionality
- **prompt.txt** — Original user prompt/requirements (pre-existing)
- ** databaseSchema.md - database tables and schemas for the project.

## Tech stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Spring Boot (Java) + REST API
- **Database:** MySQL 8.0 (Docker Compose locally)
- **State management:** TanStack Query (server), React Context (auth), React Hook Form + Zod (forms)

## Key decisions made

### Auth
- Email + password only (no OAuth in MVP)
- JWT with HS256 (shared secret, not RS256)
- Access token: 15min, stored in memory (not localStorage)
- Refresh token: 7 days, httpOnly/Secure/SameSite=Strict cookie, rotation on every use, hashed in DB
- Password hashing: BCrypt strength 12
- No password recovery in MVP
- No email verification in MVP

### Data & Schema
- 11 tables: app_user, skill, user_skill, project, project_skill, project_task, project_member, join_request, project_interest, notification, refresh_token
- School name stored as VARCHAR(200) on app_user (no school table — static frontend dataset for dropdown)
- Custom skills stored as JSON column on app_user and project (private, not in global skill table)
- Predefined skills in normalized skill table (shared by users and projects)
- Skills endpoint returns grouped by category
- Project description: plain text only
- Project deletion: hard delete
- Projects are fully editable after creation

### UI/UX
- Clean & minimal style, light mode only
- Browse page: grid of cards, filters with "Apply Filters" button, filter state in URL params (shareable)
- Project creation: multi-step wizard (basics -> tech stack -> tasks), no drafts, complete in one session
- Guest access: can see project title + description + skills; login required for team, tasks, GitHub, and all actions
- Join approval: adds user as generic "Member", owner can change role later
- Team display on project page: avatar + name + role (clickable to profile)
- Notifications: bell dropdown showing 5 recent + "View all" link to full page, poll every 60s
- Dashboard join requests: flat list (not grouped by project)
- Join request management: on both project detail page AND dashboard
- Public user profile: profile info only (no project list)
- Browse page sorting: always newest first (no sort dropdown)
- No dark mode, no reporting system, no rate limiting in MVP
- No account deletion in MVP

### Deployment
- Deployment section removed from plan (to be addressed later)
- Profile pics stored on Spring Boot server's local filesystem (accept loss on redeploy)
- User has AWS account but no infra set up yet
- User has Java + Node.js installed locally, Docker only needed for MySQL

## Implementation approach
Work is organized into **vertical slices** (not horizontal layers). Each slice delivers a working feature end-to-end (backend + frontend + tests):

| Slice | Feature |
|-------|---------|
| 0 | Project Foundation — monorepo, Docker Compose, both apps run and talk |
| 1 | Auth: Register (end-to-end) |
| 2 | Auth: Login, refresh, logout, session management |
| 3 | User Profile — CRUD, skills, school, profile pic, navbar |
| 4 | Project Creation — entity, multi-step wizard, owner as member |
| 5 | Project Browse & Detail — search, filters, pagination, edit/delete, guest access |
| 6 | Membership — join requests, approve/reject, leave/remove, bookmarks |
| 7 | Dashboard & Notifications — 3 tabs, pending requests, notification bell |
| 8 | Home Page & Discovery |
| 9 | Polish & Quality — skeletons, empty states, responsive, tests, E2E |

Migrations are created per-slice (not all upfront). Each slice's migration creates only the tables needed for that slice.

## API overview
All endpoints prefixed with `/api/v1`. ~30 REST endpoints across: auth (4), users (5), projects (8), membership (6), interest (2), notifications (4), skills (1).

## What's next
Start implementing **Slice 0** — project foundation. The goal is to get the monorepo set up, Docker Compose running MySQL, Spring Boot and Next.js scaffolded, Axios client configured, and verify the frontend can talk to the backend.
