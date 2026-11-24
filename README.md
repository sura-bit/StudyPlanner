# Study Planner API

## About

Study Planner helps university students plan their coursework. An **admin** manages the list of
courses, and each course sets how many open tasks one student may keep in it. **Students** sign up,
log in, and create tasks (assignments, labs, exam revision) under a course, then move each task from
`TODO` to `DOING` to `DONE`. Only the owner of a task may change it.

- **Parent:** `Course` (code, name, taskLimit, instructor, credits), managed by the admin
- **Child:** `Task` (title, description, priority, status, startDate, dueDate, createdAt), created by a
  logged-in user, who becomes its owner
- **Accounts:** `AppUser` (username, BCrypt password hash, role `USER` or `ADMIN`)

Spring Boot 4.1, Spring Data JPA on MySQL 8, Spring Security with JWT (HS256), Bean Validation,
springdoc (Swagger UI). **JDK 21.**

## Setup

You need JDK 21 and MySQL 8.

**1. Create the database and its account (once, as root).** The root password is never stored in the project.

```bash
mysql -u root -p < setup.sql
```

This creates the database `studyplanner` and the account `plannerapp` / `plannerapp1234`.

**2. Create the tables and the sample data.** Run this again whenever you want the starting state back
(before api.http, before the tests).

```bash
mysql -u plannerapp -p studyplanner < reset.sql      # password: plannerapp1234
```

On macOS, if you get `command not found: mysql`, use the full path `/usr/local/mysql/bin/mysql`.

With **MySQL Workbench** instead: open `setup.sql` in a root connection and click ⚡ (Execute);
then open a connection as `plannerapp`, open `reset.sql` and click ⚡.

Spring never creates the tables: `spring.jpa.hibernate.ddl-auto=validate` only checks that the
entities match the tables that `reset.sql` made.

**Sample data (reset.sql)**

| Accounts | Courses | Tasks |
|---|---|---|
| admin / admin1234 (ADMIN) | 1 ASP101 Advanced Server Programming, taskLimit 3 | sura: 3 open + 1 DONE in ASP101, 1 open in DB101 |
| sura / sura1234 (USER) | 2 DB101 Databases, taskLimit 5 | kenny: 1 open in ASP101, 1 open + 1 DONE in DB101 |
| kenny / kenny1234 (USER) | 3 WEB101 Web Basics, taskLimit 5, no tasks | 8 tasks in total |

The data is chosen so that every rule can refuse a request right after a reset: sura's next task in
ASP101 hits Rule A, sura changing kenny's task 6 hits Rule C, and deleting ASP101 hits P5's 409
while WEB101 can be deleted.

**Settings from the environment** (all optional on your own computer):

| Variable | Used for | Default |
|---|---|---|
| `DB_PASSWORD` | the `plannerapp` password | `plannerapp1234` |
| `JWT_SECRET` | the key that signs tokens (at least 32 bytes) | a class-only development value |
| `CORS_ORIGINS` | browser pages allowed to call the API | `http://localhost:3000` |
| `DB_URL`, `DB_USERNAME` | another database (e.g. Docker) | `jdbc:mysql://localhost:3306/studyplanner`, `plannerapp` |

## Run

After `reset.sql`:

```bash
./gradlew bootRun          # macOS / Linux
gradlew.bat bootRun        # Windows
```

With your own secret:

```bash
export JWT_SECRET="put-a-long-random-secret-of-at-least-32-bytes-here"
./gradlew bootRun
```

The API runs on http://localhost:8080. Swagger UI: http://localhost:8080/swagger-ui.html
(log in with `POST /api/auth/login`, click **Authorize** and paste the `accessToken`).

### Docker (bonus)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose).
One command starts MySQL and the API together:

```bash
docker compose up --build
```

- API: http://localhost:8080 (Swagger: http://localhost:8080/swagger-ui.html)
- MySQL inside Compose: host `db`, database `studyplanner`, user `plannerapp` / `plannerapp1234`
- MySQL on the host machine (optional, e.g. Workbench): `localhost:3307` (mapped so it does not clash with a local MySQL on 3306)
- First start loads `reset.sql` into a fresh volume (tables + sample accounts)

Stop with `Ctrl+C`, or in another terminal `docker compose down`.  
To wipe the database volume and reload sample data: `docker compose down -v` then `docker compose up --build` again.

The Next.js client is not in Compose. Run it on the host as usual (`cd client && npm run dev`); it talks to http://localhost:8080.

### Tests

```bash
./gradlew test             # gradlew.bat test on Windows
```

The tests use the same MySQL database, so run `setup.sql` and `reset.sql` first. Every controller
test runs inside a transaction that is rolled back, so the tests never change the data.

- `TaskServiceTest`, `CourseServiceTest` — service tests with Mockito (no Spring, no database)
- `ApiTest` — controller tests with MockMvc through the whole app (security, validation, MySQL)

| The seven required failures | Test |
|---|---|
| Rule A → 409 | `TaskServiceTest.create_ruleA_atLimit_throwsConflict`, `ApiTest.ruleA_fourthOpenTaskInCourse_409` |
| Rule B → 400 | `TaskServiceTest.create_ruleB_startAfterDue_throwsBeforeTouchingTheDatabase`, `ApiTest.ruleB_startAfterDue_400` |
| Rule C → 403 | `TaskServiceTest.update_ruleC_notTheOwner_throwsForbidden`, `ApiTest.ruleC_userChangesAnotherUsersTask_403` |
| Rule D → 403 | `ApiTest.ruleD_userCreatesCourse_403` |
| No token → 401 | `ApiTest.noToken_createTask_401` |
| P5 with children → 409 | `CourseServiceTest.delete_courseWithTasks_throwsConflict`, `ApiTest.deleteCourseWithTasks_409` |
| Validation → 400 | `ApiTest.validation_blankTitle_400` |

## API

| # | Method | Path | Who | Success | Failures |
|---|---|---|---|---|---|
| A1 | POST | `/api/auth/signup` | anyone | 201 | 400, 409 username taken |
| A2 | POST | `/api/auth/login` | anyone | 200 + token | 400, 401 |
| P1 | POST | `/api/courses` | admin | 201 + Location | 400, 401, 403, 409 code taken |
| P2 | GET | `/api/courses?minTaskLimit=` | anyone | 200 | 400 bad filter |
| P3 | GET | `/api/courses/{id}` | anyone | 200 | 404 |
| P4 | PUT | `/api/courses/{id}` | admin | 200 | 400, 401, 403, 404, 409 code taken |
| P5 | DELETE | `/api/courses/{id}` | admin | 204 | 401, 403, 404, 409 has tasks |
| C1 | POST | `/api/courses/{id}/tasks` | logged in → owner | 201 + Location | 400 (B), 401, 404, 409 (A) |
| C2 | GET | `/api/courses/{id}/tasks` | anyone | 200 | 404 |
| C3 | GET | `/api/tasks/mine` | logged in | 200 | 401 |
| C4 | GET | `/api/tasks/{id}` | owner or admin | 200 | 401, 403, 404 |
| C5 | PUT | `/api/tasks/{id}` | owner only | 200 | 400 (B), 401, 403, 404, 409 (A) |
| C6 | DELETE | `/api/tasks/{id}` | owner or admin | 204 | 401, 403, 404 |

**Bodies**

```json
// A1, A2
{ "username": "lee", "password": "lee12345" }

// P1, P4  (code: 2–20 capital letters or digits, unique; taskLimit 1–20; credits 1–6)
{ "code": "NET101", "name": "Networks", "taskLimit": 4, "instructor": "Professor Choi", "credits": 3 }

// C1  (no status: a new task is always TODO; no owner: the owner is the login)
{ "title": "Lab G: Docker", "description": "compose file", "priority": "HIGH",
  "startDate": "2026-12-01", "dueDate": "2026-12-08" }

// C5  (the same, plus status: TODO, DOING or DONE)
{ "title": "Lab G: Docker", "description": "compose file", "priority": "HIGH", "status": "DOING",
  "startDate": "2026-12-01", "dueDate": "2026-12-08" }
```

`priority` is `LOW`, `MEDIUM` or `HIGH`. Task responses also carry `courseId`, `courseName`,
`ownerUsername` and `createdAt` (set by the server).

**api.http** calls all 13 endpoints and every failure. Run `reset.sql`, start the app, then run the
requests **in order from 1 to 54** (IntelliJ HTTP client). Requests 4–6 log in and keep the tokens of
admin, sura and kenny; the later requests send them as `Authorization: Bearer {{...}}`. Each request
says what it expects in its title.

## Rules

| Rule | What | Where in the code | Answer |
|---|---|---|---|
| A | A student may have at most the course's `taskLimit` open tasks (status not `DONE`) in one course. Checked on C1, and on C5 when a `DONE` task is set back to `TODO` or `DOING`. | `TaskService.checkOpenLimit`, using the count query `TaskRepository.countOpen` | 409 `you already have 3 open tasks in course 1 (limit 3)` |
| B | A task's `startDate` must be on or before its `dueDate`. Checked on C1 and C5. | `TaskService.checkDates` | 400 `startDate must be on or before dueDate` |
| C | Only the owner may change a task (C5). Only the owner or an admin may read (C4) or delete (C6) it. | `TaskService.update`, `TaskService.requireOwnerOrAdmin` | 403 `task 6 belongs to another user` |
| D | Only an admin may create, change or delete courses (P1, P4, P5). | URL rules in `SecurityConfig` (`hasRole("ADMIN")`) | 403 `admin role required` |

The checks run in this order: 401 (no login, in the security filters) → 400 → 404 → 403 → 409.
A course code is unique (409 `course code ASP101 is taken`; on P4 a course may keep its own code),
and a course that still has tasks cannot be deleted (409 `course 1 has tasks`).

## Authentication

**Public:** `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/courses/**` (P2, P3, C2), Swagger UI.
**Everything else** needs `Authorization: Bearer <accessToken>`.

1. Log in:

   ```http
   POST http://localhost:8080/api/auth/login
   Content-Type: application/json

   { "username": "sura", "password": "sura1234" }
   ```

   Answer (200): `{ "accessToken": "eyJhbGciOiJIUzI1NiJ9...", "tokenType": "Bearer", "expiresIn": 1800 }`

2. Send the token with every protected request: `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...`

- The token is a JWT signed with HS256 with the key from `JWT_SECRET`, valid for 30 minutes.
  Its `sub` is the username and its `role` claim becomes `ROLE_USER` or `ROLE_ADMIN`.
- Passwords are stored only as BCrypt hashes. No password or hash appears in any response or log.
- Sign-up: `username` is 3–20 lowercase letters or digits and unique; `password` is 8–72 characters.
  Every new account is a `USER`.

| 401 message | When |
|---|---|
| `login required` | no token was sent |
| `wrong username or password` | login with an unknown username or a wrong password |
| `token is invalid or expired` | a token that is broken, changed or expired |

## Errors

Every failure, including 401 and 403 from the security filters, answers with the same `ApiError` body:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "request has invalid fields",
  "path": "/api/courses/1/tasks",
  "fieldErrors": [ { "field": "title", "message": "title is required" } ]
}
```

| Status | When |
|---|---|
| 400 | invalid fields (listed in `fieldErrors`), Rule B, a filter below 1, a wrong type in the path or query, broken JSON or an unknown enum value |
| 401 | not logged in, wrong username or password, invalid or expired token |
| 403 | Rule C (not your task) or Rule D (admin role required) |
| 404 | the course, task or URL does not exist |
| 409 | Rule A, course code taken, course still has tasks, username taken |
| 500 | an unexpected server error only; the details are logged, never sent to the client |

## Client

*(To be added with the client: a Next.js app in `client/` that logs in and keeps the token, lists the
courses (P2), adds a task (C1), shows my tasks (C3), and shows the `ApiError` message when the server
refuses. It runs on http://localhost:3000, which `CORS_ORIGINS` allows.)*

## AI use

No AI Used.