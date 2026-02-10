# All in Bloom FastAPI Backend

This folder contains a FastAPI backend that mirrors the existing Next.js API and database models.

## Requirements
- Python 3.11+
- PostgreSQL

## Setup
1. Copy `.env.example` to `.env` and fill in the values.
2. Create the database and run Alembic migrations:
   ```bash
   cd allinbloomfastapi
   alembic upgrade head
   ```
3. Seed data (optional, mirrors `prisma/seed.js`):
   ```bash
   python scripts/seed.py
   ```
4. Run the API:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Notes
- Auth uses JWT tokens. Use `/api/auth/request-code` + `/api/auth/verify-code` for email OTP.
- Google sign-in accepts an `id_token` at `/api/auth/google`.
- For the Next.js frontend, configure your reverse proxy to forward `/api` requests to this service.
