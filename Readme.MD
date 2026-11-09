# SRH CodeVerse

**SRH CodeVerse** is a full-stack developer learning and interview-preparation platform by **Siddayya Rudrayya Hiremath**. It combines coding challenges, progress tracking and trainer workflows with a premium, responsive interface with a polished Light/Dark theme inspired by the SRH product family.

## New CodeVerse experiences
- Cinematic responsive landing page with animated code preview, glow effects and micro-interactions
- Interview Arena for Java, DSA, SQL and Spring Boot mock-round flows
- Visual Java Full-Stack Learning Roadmap
- Code Playground with persistent browser drafts
- Study Hub with focus timer, weekly goals, bookmarks, private notes and Java quick snippets
- Daily challenges, achievements, leaderboard and activity analytics
- Student and trainer role-based workflows with JWT authentication

# SRH CodeVerse

**SRH CodeVerse** is a full-stack Java coding practice and learning platform built and customized for **Siddayya Rudrayya Hiremath (SRH)**.

## What is included

### Student platform
- JWT authentication with student/trainer roles
- Java coding problems with Monaco editor
- Run and submit Java solutions against test cases
- Daily challenges, achievements and leaderboard
- Search, difficulty/topic/status filtering
- Submission history and activity analytics
- **SRH Study Hub** with:
  - Bookmark / saved problems
  - Private problem notes stored in the browser
  - 25-minute Focus Forge timer
  - Weekly coding goal tracker
  - Java revision snippets
- Personal profile and settings
- Cached problem loading for a faster UI
- Editor theme and coding preferences

### Trainer platform
- Trainer dashboard
- Problem CRUD and test-case management
- Student roster and individual student analytics
- Submission/activity monitoring
- Achievement and challenge management

## Tech Stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, Monaco Editor, Recharts

**Backend:** Java 21, Spring Boot 4, Spring Security, Spring Data JPA, JWT, MySQL

## Run locally

### Backend
Prerequisites: Java 21, Maven and MySQL.

Create `backend/src/main/resources/application-secrets.properties`:

```properties
spring.datasource.password=YOUR_MYSQL_PASSWORD
jwt.secret=YOUR_LONG_RANDOM_SECRET
trainer.seed.password=YOUR_TRAINER_PASSWORD
```

Then:

```bash
cd backend
./mvnw spring-boot:run
```

Backend: `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Database

The default local database is `srh_codeverse_db`. Hibernate is configured with `ddl-auto=update`, so the required tables are created/updated automatically after the application connects.

## Project identity

- Project: **SRH CodeVerse**
- Developer: **Siddayya Rudrayya Hiremath**
- Version: **1.0.0**

> This project is a customized learning platform derived from a supplied reference project and extended with SRH-specific features and branding.


### Frontend redesign
- Light-first premium education UI using SRH CodeVerse purple/blue/cyan branding
- Persistent Light/Dark theme toggle using `localStorage`
- Animated hero, floating learning cards, gradient accents and responsive navigation
- Redesigned login and signup split layouts with password visibility and strength feedback
- Responsive mobile drawer navigation, active route indicators and client-side search entry
- Theme-aware trainer, roadmap, interview arena and playground surfaces

**Tagline:** Learn. Practice. Build. Grow.

**Developer:** Siddayya Rudrayya Hiremath

## New Portfolio Features

- **AI Code Mentor** — contextual hints, debugging guidance, optimization checklists, and concept coaching inside the problem workspace.
- **Live Coding Arena** — 45-minute timed coding sessions using the existing problem bank and Java run/submit execution APIs.
- **Mock Interview Studio** — Java, DSA, SQL, Spring Boot, React and HR timed interview rounds with scoring.
- **Advanced Developer Analytics** — actual student activity, solved coverage, streak and difficulty mastery charts.

All four features are frontend additions that reuse the existing authentication and problem APIs. No existing backend API contract was removed or renamed.

## Educational Content Seed

The application now includes a repeatable Spring Boot seed for the learning catalog. On a fresh database it creates:

- 10 structured courses: Java, Python, JavaScript, HTML & CSS, React.js, SQL & MySQL, Spring Boot, DSA, Git & GitHub, and Full Stack Web Development.
- 401 lessons grouped into modules.
- 500 course-specific practice tasks (50 per course) with difficulty, topic, examples, explanations, constraints, starter guidance, solution guidance, XP and estimated time.
- 30 guided projects (3 per course).
- 40 free learning resources (4 per course), including official documentation, free courses, reputable practice platforms and verified YouTube videos.
- Per-user course progress with completed lessons, current lesson and progress percentage.

The seed is safe to run repeatedly: it exits when the course catalog already exists, so normal backend restarts do not duplicate the catalog.

### Course API

- `GET /api/courses`
- `GET /api/courses/{slug}`
- `GET /api/courses/{slug}/lessons`
- `GET /api/courses/{slug}/problems`
- `GET /api/courses/{slug}/resources`
- `GET /api/courses/{slug}/projects`
- `POST /api/courses/{slug}/progress`

Course browsing is public; progress updates require authentication.

---

## Health endpoints

- `GET /api/health/live`: process liveness only; no database call. Use this for Render keep-warm monitoring.
- `GET /api/health/ready`: short database connection validation; returns 200 when the DB is reachable and 503 otherwise.
- `GET /api/health`: retained as a backward-compatible alias for liveness.

These routes and `/api/auth/**` are public. All other routes continue through the existing authorization rules. Do not expose database exception messages in health responses.

## Render deployment

Use the existing backend service and repository; do not create a new database.

- Root directory: `backend`
- Runtime: Docker (uses `backend/Dockerfile`) or the existing Maven build configuration
- Java: 21
- Port: Render supplies `PORT`; the application honors it.
- Set environment variables from `backend/.env.example` in Render:
  - `DB_URL`: Aiven JDBC URL, including host, port, database name and SSL parameters required by your Aiven service.
  - `DB_USERNAME`, `DB_PASSWORD`
  - `JWT_SECRET`: long random secret; changing it invalidates existing JWTs.
  - `TRAINER_SEED_PASSWORD`: optional; if omitted, initial trainer creation is skipped.
  - Optional `DB_POOL_MAX_SIZE=3`, `DB_POOL_MIN_IDLE=1`.

Never paste credentials into source code, GitHub, screenshots, or chat. Do not use the sample placeholders literally.

## Vercel deployment

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL=https://srh-codeverse-backend.onrender.com/api`
- Add `VITE_API_TIMEOUT_MS=90000`
- Redeploy after changing Vite environment variables.

## 10-minute GitHub Actions monitor

The repository workflow `.github/workflows/backend-health-ping.yml` sends a lightweight GET to `/api/health/live` every 10 minutes and retries a few times. Enable GitHub Actions for the repository and confirm the workflow is enabled. A successful run proves only that the liveness URL responded for that run.

It does not prove MySQL is ready, keep Render Free continuously awake, or prevent Aiven free-tier suspension. Use `/api/health/ready` separately when diagnosing database availability. Avoid frequent database-heavy monitoring.

## Performance configuration

- Hikari pool defaults: maximum 3, minimum idle 1; connection timeout 10 seconds; validation timeout 3 seconds.
- Public leaderboard cache: Caffeine, 45 seconds, maximum one entry.
- User-specific data, credentials, and tokens are not cached.
- Axios timeout defaults to 90 seconds for cold-start tolerance; POSTs are never retried automatically.
- Identical concurrent GET requests are coalesced.
- SQL logging is disabled by default.

Tune pool settings only after checking Aiven's connection limits and observed connection usage. A larger pool can make a small database slower.

## Verification checklist

```powershell
# Backend
cd backend
.\mvnw.cmd clean test

# Frontend
cd ..\frontend
npm ci
npm run build
```

After deployment, test:
- `GET /api/health/live` (expect 200 and `UP`)
- `GET /api/health/ready` (expect 200/`READY` if Aiven is reachable; otherwise 503/`NOT_READY`)
- Signup with a new test email/username
- Login with that test account
- Student dashboard and trainer workflows with their respective roles
- Public courses, problems, leaderboard, and existing submission flows
- First request after 15–30 minutes idle, then a warm request

Do not repeat a signup POST after a timeout until checking whether the account was created. A network timeout does not prove the server did not commit the transaction.

## Performance report

See [PERFORMANCE-OPTIMIZATION-REPORT.md](PERFORMANCE-OPTIMIZATION-REPORT.md) for changes, limitations, and a measurement plan. No production latency improvement is claimed without before/after measurements.

## Project identity

- Project: SRH CodeVerse
- Developer: Siddayya Rudrayya Hiremath
- Tagline: Learn. Practice. Build. Grow.
