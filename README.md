# Gym Tracker V1 - Production Strength & Workout Platform

A production-quality **Gym Tracker web application** built from scratch using a scalable monorepo architecture. Features set logging, RIR tracking, automatic rest timers, 1RM estimated calculations (Epley formula with rep capping), personal record tracking, weekly volume trends, and a **deterministic TypeScript Personal Intelligence Engine**.

---

## Technical Stack

### Frontend
- **Framework**: Web app (App Router, TypeScript)
- **Styling**: Tailwind CSS (Dark-mode-first aesthetic with Glassmorphism)
- **Icons**: Lucide React
- **Data Fetching & State**: TanStack React Query
- **Charts**: Recharts

### Backend
- **Framework**: REST API (Node.js, TypeScript)
- **Validation**: Zod
- **Plugins**: CORS, signed cookies

### Database
- **Database**: SQL database (Docker container)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Migrations

### Authentication
- **Engine**: Session-based auth
- **Provider**: Google OAuth 2.0 (Social Sign-In) + email/password + persistent sessions

### Monorepo Infrastructure
- **PackageManager**: pnpm
- **Orchestration**: Turborepo

---

## Monorepo Architecture

```text
gym-tracker/
├── apps/
│   ├── web/                     # Web frontend (port 3000)
│   │   ├── src/app/             # Pages: /, /dashboard, /workout, /workout/[id], /history, /exercises, /progress, /records, /body, /settings
│   │   └── src/components/      # UI components: Navbar, RestTimer, ExerciseSearchModal, Providers
│   │
│   └── api/                     # REST API backend (port 3001)
│       ├── src/plugins/         # Auth session verification middleware
│       ├── src/routes/          # REST Endpoints (/api/auth, /api/users, /api/exercises, /api/workouts, /api/progress, /api/records, /api/body-measurements, /api/insights)
│       └── src/__tests__/       # REST API integration tests
│
├── packages/
│   ├── db/                      # Drizzle ORM database schema, connection, migrations, seed script (35+ exercises)
│   ├── auth/                    # Auth configuration with Google OAuth & Drizzle adapter
│   ├── intelligence/            # Pure TypeScript Intelligence Engine (1RM, Volume, Plateaus, Consistency, PRs, Overload advice)
│   ├── types/                   # Shared TypeScript interfaces
│   └── validation/              # Shared Zod validation schemas
│
├── docker-compose.yml           # Local database container config
├── .env.example                 # Environment variables template
├── package.json                 # Monorepo root package
├── pnpm-workspace.yaml          # pnpm workspace config
└── turbo.json                   # Turborepo pipeline tasks
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: >= 18.0.0
- **pnpm**: >= 9.0.0
- **Docker**: For running the database locally

### 2. Installation
Clone the repository and install workspace dependencies:
```bash
pnpm install --ignore-scripts
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
DATABASE_URL="postgres://postgres:postgrespassword@localhost:5432/gym_tracker"
PORT=3001
HOST="0.0.0.0"
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
BETTER_AUTH_SECRET="gym-tracker-local-dev-secret-key-32-bytes-long"
BETTER_AUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Database Setup & Seeding

### 1. Start the database with Docker
```bash
docker compose up -d
```

### 2. Run Database Migrations
```bash
pnpm db:migrate
```

### 3. Seed Standard Exercise Library
Pre-populates 35+ standard exercises categorized by Chest, Back, Shoulders, Legs, and Arms:
```bash
pnpm db:seed
```

---

## Running the Application

Start both API (`http://localhost:3001`) and web frontend (`http://localhost:3000`) in parallel:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Quality Checks & Tests

```bash
# Typecheck TypeScript across all 7 workspace packages
pnpm typecheck

# Run Vitest test suites (1RM, Volume, Plateau rules, PR engine & API tests)
pnpm test

# Build production bundles
pnpm build
```

---

## Key Features Implemented

1. **Google OAuth & Authentication**: Persistent sessions with social Google login and server-side user isolation.
2. **Workout Logger UX**: Fast gym logging interface with weight/reps/RIR input, set duplication, exercise search modal, workout timer, and live rest countdown timer with sound/visual alerts.
3. **Automated PR & 1RM Engine**: Epley formula (`weight * (1 + reps / 30)`) with rep capping to prevent unrealistic 1RM estimates, plus auto-detection of heaviest weight, rep, and volume PRs.
4. **Personal Fitness Intelligence**: Deterministic rule engine detecting performance plateaus, weekly volume shifts, training consistency streaks, and progressive overload recommendations without third-party AI keys.
5. **Body Weight & Measurements**: Body tracking with trend charts for weight, body fat %, chest, waist, arms, and thighs.
6. **Future-Proof Mobile API Architecture**: Clean separation between web frontend and REST API, allowing future Expo React Native mobile apps to share the exact same backend endpoints.

---

## Deployment

The web frontend deploys to Cloudflare Workers (see `apps/web/wrangler.toml`). The API is a long-running Node process and runs on any Node host (Render, Railway, Fly, VPS). The database is managed serverless SQL (see `.env` / Neon console).

### Web (Workers)

Build command:

```bash
pnpm install && pnpm --filter @gym-tracker/web exec opennextjs-cloudflare build
```

Deploy command:

```bash
pnpm --filter @gym-tracker/web exec opennextjs-cloudflare deploy
```

Or from `apps/web`: `pnpm preview` (local) / `pnpm deploy` (production).

Required Worker variable:

```env
NEXT_PUBLIC_API_URL="https://your-api-host"
```

This is baked into the browser bundle at build time. Guest mode works without it; sign-in and cloud sync need the API reachable over HTTPS.

### API (Node host)

```bash
# Set env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
# WEB_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
pnpm install
pnpm --filter @gym-tracker/db migrate
pnpm --filter @gym-tracker/db seed   # first time only
pnpm --filter @gym-tracker/api start # or run src/index.ts with tsx
```

Register the production URLs in Google Cloud Console (authorized origins + redirect URIs) or Google sign-in will fail.
