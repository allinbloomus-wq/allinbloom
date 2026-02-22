# All in Bloom

Frontend and backend are fully separated:
- `Next.js` in `src/` is UI only.
- `FastAPI` in `fastapi/` owns all business logic, auth, database, email, Stripe, delivery, and uploads.

## Architecture
- Browser calls only `/api/*` on Next.js origin.
- Next.js rewrites `/api/*` to FastAPI.
- FastAPI handles auth (`JWT access token + httpOnly refresh cookie`) and data access.

## Frontend setup (Next.js)
1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Run:
   - `npm run dev`

## Backend setup (FastAPI)
1. Copy `fastapi/.env.example` to `fastapi/.env`.
2. Create database and run migrations:
   - `cd fastapi`
   - `alembic upgrade head`
3. Optional seed:
   - `python scripts/seed.py`
4. Run API:
   - `uvicorn app.main:app --reload --port 8000`

## Tests
### Frontend
- Run all frontend unit tests:
  - `npm run test`
- Run tests in watch mode:
  - `npm run test:watch`
- Generate coverage report:
  - `npm run test:coverage`

### Backend
- Open backend directory:
  - `cd fastapi`
- Run backend unit tests:
  - `python -m unittest discover -s tests -v`

## Docker
Use `docker-compose.yml` to run:
- `frontend` (Next.js on `:3000`)
- `backend` (FastAPI on `:8000`)
- `postgres` (PostgreSQL on `:5432`)
