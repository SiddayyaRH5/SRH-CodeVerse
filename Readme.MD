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
