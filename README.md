# ResultLens – GGSIPU Result Analyzer & CGPA Calculator (Phase 1 scaffold)

Binding architecture: see `ARCHITECTURE.md`. Do not deviate without approval.

## Prereqs
- Node 20+, local PostgreSQL 16 (running as a Windows service)

## Setup (Phase 1) – local Postgres (no Docker)
```bash
# 1. Create the database once (psql or pgAdmin):
#    CREATE USER resultlens WITH PASSWORD 'resultlens';
#    CREATE DATABASE resultlens OWNER resultlens;
psql -U postgres -h localhost -c "CREATE USER resultlens WITH PASSWORD 'resultlens'" -c "CREATE DATABASE resultlens OWNER resultlens"
cd server && copy .env.example .env && npm install
npm run migrate                 # applies src/db/migrations/*.sql
npm run seed                    # grade_scale + admin + faculty (from env)
npm run dev                     # API on :5000, health at /api/v1/health

cd ../client && copy .env.example .env && npm install
npm run dev                     # Vite on :5173
```

## Env vars
See `server/.env.example` and `client/.env.example`.

## API (Phase 1: stubs return 501 except health)
- `POST /api/v1/auth/login|logout`, `GET /api/v1/auth/me` (faculty/admin only – Phase 2, no student auth)
- `POST|GET /api/v1/uploads` (faculty/admin only – Phase 3)
- `GET /api/v1/students…` public lookup by enrollment + semester (Phase 5)
- `GET /api/v1/toppers…` public ranked lists (Phase 6), `GET /api/v1/analytics…` public (Phase 7)
- `POST /api/v1/admin/faculty` (admin only – Phase 2)

## Access (binding – no student login)
- No student accounts: results are public lookup by enrollment number + semester.
- Professor (`faculty`) accounts created by admin only. No self-signup.
- PDF upload: faculty/admin only (401/403 for visitors).
- Faculty login: ID/username + password (JWT httpOnly cookie); `requireRole()` gates upload + admin pages.
- Result, Toppers, Analytics pages are public.

## Architecture
```
client (Vite) --axios+cookie--> server (/api/v1) --pg Pool--> Postgres
pdfjs-dist extract -> pure parse -> transactional upsert -> semester_summary recompute -> RANK() queries
```
