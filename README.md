# PEB CRM — Super Admin

Enterprise control plane for the PEB CRM ecosystem: platform administration, tenant lifecycle, organizations, users, roles, permissions, audit logs, and monitoring.

## Deployment Status

Replace `OWNER/REPO` below with your GitHub organization and repository name (e.g. `acme/peb-crm`).

| App | Platform | Status |
| --- | --- | --- |
| Frontend | Vercel | [![Super Admin Frontend](https://github.com/OWNER/REPO/actions/workflows/super-admin-frontend.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/super-admin-frontend.yml) |
| Backend | Render | [![Super Admin Backend](https://github.com/OWNER/REPO/actions/workflows/super-admin-backend.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/super-admin-backend.yml) |

## Repository Layout

```
PEB-CRM/SUPER-ADMIN/
├── frontend/   Next.js 15 (App Router) — Vercel
├── backend/    NestJS 11 (Fastify) — Render
└── README.md
```

## CI/CD

Fully automated GitHub Actions pipelines — no manual deploys.

### Frontend → Vercel (`.github/workflows/super-admin-frontend.yml`)

Runs on every push/PR touching `PEB-CRM/SUPER-ADMIN/frontend/**`:

1. `npm ci`
2. `npm run lint`
3. `npm run type-check`
4. `npm run build`
5. Deploy to Vercel production on `main`
6. Health check `GET /health` (public route at `frontend/src/app/health/route.ts`)

Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_API_URL`, `VERCEL_DEPLOYMENT_URL`.

### Backend → Render (`.github/workflows/super-admin-backend.yml`)

Runs on every push/PR touching `PEB-CRM/SUPER-ADMIN/backend/**`:

1. `npm ci`
2. `npx prisma generate`
3. `npm run lint:check`
4. `npm run type-check`
5. `npm run build`
6. `npm test -- --passWithNoTests`
7. Environment validation (required secrets present)
8. Trigger Render deploy hook on `main`
9. Health check `GET /api/v1/health` (polled until the new deploy is live)

Required secrets: `DATABASE_URL`, `CRM_DATABASE_URL`, `JWT_SECRET`, `RENDER_DEPLOY_HOOK_URL`, `RENDER_SERVICE_URL`.

Render service settings:

- Build command: `npm ci && npx prisma generate && npm run build`
- Start command: `node dist/main`
- Health check path: `/api/v1/health`

### Render Environment Variables Configuration

Configure these environment variables in your Render service settings:

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string for the platform database
- `CRM_DATABASE_URL` - PostgreSQL connection string for the CRM database
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string)
- `FRONTEND_URL` - Frontend application URL (e.g., `https://your-frontend.vercel.app`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (e.g., `https://your-frontend.vercel.app,https://your-backend.onrender.com`)

**Optional Environment Variables:**
- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Port number (default: 8001)
- `JWT_ACCESS_EXPIRES_IN` - JWT access token expiration (default: `30m`)
- `JWT_EXPIRES_IN` - JWT refresh token expiration (default: `7d`)

**Example for your deployment (placeholders only — never commit real credentials):**
```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<platform-db>?sslmode=require
CRM_DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<crm-db>?sslmode=require
JWT_SECRET=<generate-a-random-secret-at-least-32-chars>
FRONTEND_URL=https://super.example.com
ALLOWED_ORIGINS=https://super.example.com
```

### Vercel Environment Variables Configuration

Configure this environment variable in your Vercel project settings:

**Required Environment Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://your-backend.onrender.com`)

**Example for your deployment:**
```
NEXT_PUBLIC_API_URL=https://crm-super-admin.onrender.com
```

### Failure policy

Deployment is skipped (CI fails) when lint, type-check, build, tests, or environment validation fail. The post-deploy health check marks the run failed if the service does not come up healthy.

## Branch Protection (enable in GitHub repo settings)

Protect the `main` branch:

1. **Settings → Branches → Add rule → `main`**
2. Require a pull request before merging (1 approval minimum)
3. Require status checks to pass before merging — select the `CI` job from both workflows
4. Require branches to be up to date before merging
5. Do not allow bypassing the above settings

## Local Development

```bash
# Backend (port 8001)
cd PEB-CRM/SUPER-ADMIN/backend
cp .env.example .env
npm ci
npx prisma generate
npm run start:dev

# Frontend (port 3001)
cd PEB-CRM/SUPER-ADMIN/frontend
cp .env.example .env.local
npm ci
npm run dev
```

Health endpoints: backend `GET /api/v1/health` · frontend `GET /health`.
