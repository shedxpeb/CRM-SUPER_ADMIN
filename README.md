# PEB CRM — Super Admin

Enterprise control plane for the PEB CRM ecosystem: platform administration, tenant lifecycle, organizations, users, roles, permissions, audit logs, and monitoring.

## Deployment

| App | Platform | Port | PM2 Process |
| --- | --- | --- | --- |
| Frontend | Hostinger (Next.js) | 3004 | super-admin-frontend |
| Backend | Hostinger (NestJS) | 8001 | super-admin-backend |

Production deployment is managed via PM2 on the Hostinger server. See `PEB-CRM/deploy.sh` and `PEB-CRM/ecosystem.config.js` for deployment details.

## Repository Layout

```
PEB-CRM/SUPER-ADMIN/
├── frontend/   Next.js 15 (App Router)
├── backend/    NestJS 11 (Fastify)
└── README.md
```

## CI

GitHub Actions runs validation on every push/PR:

- `npm ci`
- `npx prisma generate`
- `npm run lint:check`
- `npm run type-check`
- `npm run build`
- `npm test -- --passWithNoTests`

See `.github/workflows/super-admin-backend.yml` and `.github/workflows/super-admin-frontend.yml`.

## Production Deployment

Production runs on Hostinger with PM2:

```bash
# From PEB-CRM directory on Hostinger server
pm2 restart super-admin-frontend
pm2 restart super-admin-backend
```

⚠️ **NEVER run `pm2 restart all`** — always restart individual services.

## Environment Variables

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string for the platform database
- `CRM_DATABASE_URL` - PostgreSQL connection string for the CRM database
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string)
- `FRONTEND_URL` - Frontend application URL (e.g., `https://admin.buildxcrm.com`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

**Optional Environment Variables:**
- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Port number (default: 8001)
- `JWT_ACCESS_EXPIRES_IN` - JWT access token expiration (default: `30m`)
- `JWT_EXPIRES_IN` - JWT refresh token expiration (default: `7d`)

**Example for your deployment (placeholders only — never commit real credentials):**
```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/peb-platform?sslmode=require
CRM_DATABASE_URL=postgresql://<user>:<password>@<host>:5432/peb-crm?sslmode=require
JWT_SECRET=<generate-a-random-secret-at-least-32-chars>
FRONTEND_URL=https://admin.buildxcrm.com
ALLOWED_ORIGINS=https://admin.buildxcrm.com
```

## Failure policy

CI fails when lint, type-check, build, tests, or environment validation fail.

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
