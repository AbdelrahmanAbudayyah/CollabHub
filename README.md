# CollabHub

A platform where college engineers, new grads, and developers can post project ideas, discover projects, join teams, and build real-world experience together.

## Features

- **Authentication** — Register, login, JWT-based sessions with secure refresh token rotation
- **User Profiles** — Bio, school, skills (predefined + custom), profile picture upload, social links
- **Project Creation** — Multi-step wizard to define project details, tech stack, and open roles/tasks
- **Browse & Search** — Filter projects by skills, status, and keywords with paginated results
- **Join Requests** — Request to join projects, owners approve/reject applicants
- **Bookmarks** — Save interesting projects for later
- **Dashboard** — View owned, joined, and bookmarked projects in one place
- **Notifications** — In-app notifications for join requests, approvals, and team changes

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2.5**
- **Spring Security** — Stateless JWT authentication (HS384)
- **Spring Data JPA / Hibernate** — ORM with MySQL
- **Flyway** — Database migration management
- **Lombok** — Boilerplate reduction
- **JJWT** — JWT token generation and validation
- **BCrypt** (strength 12) — Password hashing

### Frontend
- **Next.js 16** (App Router) with **TypeScript**
- **React 19** with **Tailwind CSS 4**
- **shadcn/ui** — UI component library (Radix primitives)
- **TanStack Query** — Server state management
- **React Hook Form** + **Zod 4** — Form handling and validation
- **Axios** — HTTP client with interceptors for auth
- **Lucide React** — Icons

### Infrastructure
- **MySQL 8.0** via Docker Compose
- **Flyway** migrations for schema versioning

## Project Structure



## Getting Started

### Prerequisites

- **Java 17** (JDK)
- **Maven** 3.8+
- **Node.js** 18+
- **Docker** & **Docker Compose**

### 1. Start the Database

```bash
docker-compose up -d
```

This starts MySQL 8.0 on **port 3307** (to avoid conflicts with a local MySQL instance on 3306).

### 2. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080/api/v1`. Flyway automatically runs migrations on startup.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:3000`.

## Auth Strategy

- **Access token** — JWT (HS384), 15-minute expiry, stored in memory (not localStorage)
- **Refresh token** — 7-day expiry, `httpOnly` cookie, SHA-256 hashed in DB, rotated on every use
- **Password hashing** — BCrypt with strength 12
- **401 handling** — Axios interceptor automatically refreshes the token and retries the request

## Running Tests

```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```


## License

This project is licensed under the MIT License.
