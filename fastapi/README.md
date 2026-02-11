# All in Bloom FastAPI Backend

## Requirements
- Python 3.11+
- PostgreSQL

## Setup
1. Open backend directory:
   ```bash
   cd fastapi
   ```
2. Copy `.env.example` to `.env` and fill in values.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   alembic upgrade head
   ```
5. Seed data (optional):
   ```bash
   python scripts/seed.py
   ```
6. Start API:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Auth
- Email OTP: `POST /api/auth/request-code` -> `POST /api/auth/verify-code`
- Google sign-in: `POST /api/auth/google`
- Refresh token: `httpOnly` cookie (`POST /api/auth/refresh`)
- Logout: `POST /api/auth/logout`

## Integration
Next.js frontend should proxy `/api/*` traffic to this service.
