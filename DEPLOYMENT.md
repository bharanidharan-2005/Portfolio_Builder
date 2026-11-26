# AuraBuild — Environment Variables & Deployment Guide

## 1. Environment Variables

Never commit `.env`, `API KEYS.txt`, or SQLite databases to version control. Configure environment variables via `.env` locally or your hosting provider's secret manager in production.

### Backend (`backend/.env` or Render Environment)

| Variable | Required | Purpose |
|---|---|---|
| `DEBUG` | Yes (`False` in prod) | Enables Django debug mode and SQLite fallback when `True`. |
| `SECRET_KEY` | Yes (when `DEBUG=False`) | Cryptographic signing key for Django sessions and tokens. |
| `DATABASE_URL` | Yes (when `DEBUG=False`) | PostgreSQL connection string (`postgres://...` via `dj-database-url` + `psycopg[binary]`). |
| `ALLOWED_HOSTS` | Recommended | Comma-separated allowed hostnames (e.g., `api.yourdomain.com,.onrender.com`). |
| `CORS_ALLOWED_ORIGINS` | Recommended | Comma-separated frontend origins allowed to send credentials/cookies. |
| `CSRF_TRUSTED_ORIGINS` | Recommended | Comma-separated trusted HTTPS origins for CSRF protection. |
| `GEMINI_API_KEY` | AI features | Google Gemini API key (`gemini-2.5-flash` text/resume extraction and image generation). |
| `GROQ_API_KEY` | Optional fallback | Groq API key used as text fallback if Gemini fails or hits quota limits. |
| `GOOGLE_CLIENT_ID` | Google OAuth | Google Identity OAuth client ID verified on the backend (`/api/auth/social/`). |
| `GITHUB_CLIENT_ID` | GitHub OAuth | GitHub OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | GitHub OAuth App secret used only by the backend token exchange. |
| `RESEND_API_KEY` | Optional email | Resend API key for transactional workspace code & password reset emails. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | Optional email | SMTP fallback credentials when `RESEND_API_KEY` is unset. |
| `VERCEL_DEPLOY_HOOK_URL` | Optional hosting | Vercel Deploy Hook triggered when publishing via `/api/deploy/`. |
| `REDIS_URL` | Optional cache/Celery | Redis URL (falls back to `LocMemCache` / in-memory when omitted). |

### Frontend (`frontend/.env` or Vercel Environment)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes (in prod) | Backend REST API base URL ending cleanly with `/api/` (auto-switches to `127.0.0.1:8080/api/` on `localhost`). |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth | Google OAuth Client ID for `@react-oauth/google`. |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth | GitHub OAuth Client ID (public ID only — never store the secret in frontend env vars). |

---

## 2. Local Development Setup

### Backend (Django 5.0 / DRF / SimpleJWT)

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8080
```

Run backend checks & automated tests:

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

### Frontend (React 19 + Vite + Tailwind CSS 4)

```bash
cd frontend
npm install
npm run dev
```

Run frontend checks, tests, and production bundle:

```bash
cd frontend
npm run lint
npm test
npm run build
```

---

## 3. Production Deployment

### Backend on Render / Docker / PaaS

1. Provision a PostgreSQL instance and set `DATABASE_URL`, `DEBUG=False`, a high-entropy `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
2. Build command:
   ```bash
   pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate --noinput
   ```
3. Start command (Gunicorn / WSGI):
   ```bash
   cd backend && gunicorn main_config.wsgi:application --bind 0.0.0.0:$PORT --timeout 120
   ```

### Frontend on Vercel

1. Set Root Directory to `frontend`.
2. Set Build Command `npm run build` and Output Directory `dist`.
3. `frontend/vercel.json` rewrites SPA routes cleanly to `/index.html`.

### Mobile Android Shell (Capacitor)

`capacitor.config.json` points `webDir` to `frontend/dist`.

1. Build web assets first:
   ```bash
   cd frontend && npm run build
   ```
2. Sync web assets into Android (run from `frontend/` where `@capacitor/cli` `^8.5.2` matches `android/variables.gradle` SDK 36):
   ```bash
   npx cap sync android
   npx cap open android
   ```
3. Note: Root `package.json` still lists legacy `@capacitor/*: ^6.0.0` dependencies; run Capacitor CLI commands from `frontend/` (or align root `package.json` to `^8.5.2`) before generating release APKs/AABs in Android Studio.

