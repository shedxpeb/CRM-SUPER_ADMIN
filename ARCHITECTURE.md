# SUPER-ADMIN Platform Architecture

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SUPER-ADMIN Platform                   │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Frontend    │  │  Backend API │  │  WebSocket GW  │  │
│  │  Next.js 16  │  │  NestJS 11   │  │  Socket.IO     │  │
│  │  Port 3001   │  │  Port 8001   │  │  Port 8002     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                  │            │
│         └─────────────────┼──────────────────┘            │
│                           │                               │
│                    ┌──────┴───────┐                       │
│                    │   PostgreSQL │                       │
│                    │   + Prisma   │                       │
│                    └──────────────┘                       │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Redis        │  │  Bull Queue  │  │  Background    │  │
│  │  Cache/Sess   │  │  Jobs        │  │  Workers       │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Separation from PEB-CRM

SUPER-ADMIN is an **independent platform**. It shares NO code, NO database tables,
NO authentication, and NO services with PEB-CRM. The only relationship is that
SUPER-ADMIN manages PEB-CRM tenants from the outside.

Communication with tenants:
- SUPER-ADMIN reads tenant data via its own API (separate DB queries)
- Tenant impersonation routes through SUPER-ADMIN backend as a proxy
- No direct tenant DB access from SUPER-ADMIN frontend

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, Zustand, Recharts, Socket.IO Client |
| Backend | NestJS 11, Fastify |
| Database | PostgreSQL via Prisma 6 |
| Auth | JWT + Refresh Tokens + HttpOnly Cookies |
| Cache | Redis (sessions, rate limits, health cache) |
| Queue | Bull/BullMQ (background jobs, email, health checks) |
| Real-time | Socket.IO (WebSocket gateway on separate port) |
| Monitoring | Self-contained health check aggregator |
| Deployment | Docker Compose |

---

## 2. Database Design (Prisma Schema)

### 2.1 Platform Users (Super Admins)

```prisma
model PlatformUser {
  id              String   @id @default(uuid())
  email           String   @unique
  passwordHash    String
  name            String
  role            PlatformRole @default(SUPER_ADMIN)
  isActive        Boolean  @default(true)
  isLocked        Boolean  @default(false)
  lockedUntil     DateTime?
  loginAttempts   Int      @default(0)
  lastLoginAt     DateTime?
  lastLoginIP     String?
  passwordVersion Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  sessions        PlatformSession[]
  auditLogs       PlatformAuditLog[]
  passwordHistory PlatformPasswordHistory[]

  @@map("platform_users")
}

enum PlatformRole {
  SUPER_ADMIN
  PLATFORM_OPERATOR   // Limited admin — can view but not modify
  PLATFORM_AUDITOR    // Read-only access to audit/logs
  PLATFORM_SUPPORT    // Can impersonate, view tenants, reset passwords
}

model PlatformPasswordHistory {
  id           String   @id @default(uuid())
  userId       String
  passwordHash String
  createdAt    DateTime @default(now())

  user PlatformUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("platform_password_history")
}
```

### 2.2 Sessions

```prisma
model PlatformSession {
  id              String   @id @default(uuid())
  userId          String
  refreshToken    String   @unique
  deviceInfo      String?  // User-Agent
  ipAddress       String?
  location        String?  // GeoIP
  isActive        Boolean  @default(true)
  lastActivityAt  DateTime @default(now())
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  user PlatformUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("platform_sessions")
}
```

### 2.3 Companies (Tenants)

```prisma
model Company {
  id              String        @id @default(uuid())
  name            String        @unique
  slug            String        @unique  // URL-safe identifier
  email           String?
  phone           String?
  domain          String?       // Custom domain
  logo            String?       // URL
  favicon         String?
  primaryColor    String?       @default("#2563eb")
  status          CompanyStatus @default(TRIAL)
  planId          String?
  trialEndsAt     DateTime?
  subscriptionId  String?       @unique
  maxUsers        Int           @default(10)
  maxStorageGB    Int           @default(5)
  storageUsedGB   Float         @default(0)
  modules         String        @default("[]")  // JSON array of enabled module IDs
  featureFlags    String        @default("{}")  // JSON object of feature flags
  allowCustomBranding Boolean   @default(false)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?     // Soft delete

  plan            SubscriptionPlan? @relation(fields: [planId], references: [id])
  subscription    Subscription?

  @@map("companies")
}

enum CompanyStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  EXPIRED
  BLOCKED
  DELETED
}
```

### 2.4 Subscription Plans

```prisma
model SubscriptionPlan {
  id              String   @id @default(uuid())
  name            String   @unique        // Free, Starter, Professional, Enterprise
  slug            String   @unique
  description     String?
  priceMonthly    Decimal  @default(0)
  priceYearly     Decimal  @default(0)
  maxUsers        Int      @default(10)
  maxStorageGB    Int      @default(5)
  trialDays       Int      @default(14)
  isPublic        Boolean  @default(true)
  sortOrder       Int      @default(0)
  features        String   @default("[]") // JSON array of included features
  createdAt       DateTime @default(now())

  companies       Company[]
  subscriptions   Subscription[]

  @@map("subscription_plans")
}

model Subscription {
  id              String           @id @default(uuid())
  companyId       String           @unique
  planId          String
  status          SubscriptionStatus @default(ACTIVE)
  billingCycle    BillingCycle     @default(MONTHLY)
  currentPeriodStart DateTime       @default(now())
  currentPeriodEnd   DateTime
  trialEndsAt     DateTime?
  cancelledAt     DateTime?
  endsAt          DateTime?        // When subscription terminates after cancellation
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  company Company            @relation(fields: [companyId], references: [id])
  plan    SubscriptionPlan   @relation(fields: [planId], references: [id])
  invoices SubscriptionInvoice[]

  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
  TRIALING
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

model SubscriptionInvoice {
  id             String         @id @default(uuid())
  subscriptionId String
  amount         Decimal
  currency       String         @default("USD")
  status         InvoiceStatus  @default(PENDING)
  dueDate        DateTime
  paidAt         DateTime?
  pdfUrl         String?
  createdAt      DateTime       @default(now())

  subscription Subscription @relation(fields: [subscriptionId], references: [id])

  @@map("subscription_invoices")
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELED
  REFUNDED
}
```

### 2.5 Modules & Feature Flags

```prisma
model PlatformModule {
  id          String        @id @default(uuid())
  name        String        @unique     // "leads", "customers", "projects", etc.
  label       String                    // "Leads", "Customers"
  description String?
  version     String        @default("1.0.0")
  icon        String?
  isEnabled   Boolean       @default(true)
  isInternal  Boolean       @default(false) // Hidden from tenant UI
  dependencies String       @default("[]") // JSON array of module IDs
  configSchema String?      // JSON Schema for module configuration
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("platform_modules")
}

model FeatureFlag {
  id          String   @id @default(uuid())
  name        String   @unique
  label       String
  description String?
  isGloballyEnabled Boolean @default(false)
  isBeta      Boolean  @default(false)
  isInternal  Boolean  @default(false)
  tenantOverrides String @default("{}") // JSON: { "companyId": true/false }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("feature_flags")
}
```

### 2.6 Audit Logging

```prisma
model PlatformAuditLog {
  id             String   @id @default(uuid())
  actorId        String?  // PlatformUser who performed the action
  actorEmail     String?
  action         String   // "company.created", "user.impersonated", etc.
  targetType     String?  // "company", "user", "subscription", etc.
  targetId       String?  // ID of the affected resource
  targetName     String?  // Human-readable name of the target
  metadata       String   @default("{}") // JSON with action-specific details
  ipAddress      String?
  userAgent      String?
  severity       AuditSeverity @default(INFO)
  createdAt      DateTime @default(now())

  @@index([action])
  @@index([targetType, targetId])
  @@index([actorId])
  @@index([createdAt])
  @@map("platform_audit_logs")
}

enum AuditSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

### 2.7 System Health

```prisma
model HealthCheck {
  id             String          @id @default(uuid())
  service        String          // "backend", "database", "redis", "api", etc.
  status         HealthStatus
  responseTimeMs Int?
  message        String?         // Human-readable status
  errorDetails   String?         // Error message if unhealthy
  lastCheckedAt  DateTime        @default(now())
  createdAt      DateTime        @default(now())

  @@index([service, createdAt])
  @@map("health_checks")
}

enum HealthStatus {
  HEALTHY
  WARNING
  CRITICAL
  OFFLINE
}

model HealthCheckHistory {
  id             String        @id @default(uuid())
  service        String
  status         HealthStatus
  responseTimeMs Int?
  message        String?
  errorDetails   String?
  checkedAt      DateTime      @default(now())

  @@index([service, checkedAt])
  @@map("health_check_history")
}
```

### 2.8 Error Logging

```prisma
model PlatformError {
  id             String   @id @default(uuid())
  service        String   // "backend", "frontend", "database", "api"
  type           String   // "exception", "unhandled_rejection", "db_error", "auth_failure"
  message        String
  stackTrace     String?
  file           String?
  method         String?
  lineNumber     Int?
  metadata       String   @default("{}") // JSON with request context
  severity       ErrorSeverity @default(ERROR)
  status         ErrorStatus @default(OPEN)
  resolvedBy     String?  // PlatformUser ID
  resolvedAt     DateTime?
  resolution     String?
  createdAt      DateTime @default(now())

  @@index([service, createdAt])
  @@index([status])
  @@map("platform_errors")
}

enum ErrorSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ErrorStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  DISMISSED
}
```

### 2.9 Impersonation Logs

```prisma
model ImpersonationLog {
  id              String   @id @default(uuid())
  superAdminId    String
  superAdminEmail String
  targetCompanyId String
  targetCompanyName String
  targetUserId    String?
  targetUserEmail String?
  reason          String?
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?

  @@map("impersonation_logs")
}
```

### 2.10 Platform Settings (Key-Value)

```prisma
model PlatformSetting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String   // JSON value
  type        String   @default("string") // "string", "number", "boolean", "json"
  description String?
  category    String   @default("general") // "email", "auth", "security", "storage"
  isSecret    Boolean  @default(false)     // Masked in responses
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("platform_settings")
}
```

---

## 3. Authentication Flow

### 3.1 Super Admin Login

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  Browser │     │  Frontend    │     │  Backend  │     │  DB      │
│  (Login) │     │  Auth Page   │     │  API      │     │          │
└────┬─────┘     └──────┬───────┘     └────┬───────┘     └────┬─────┘
     │                  │                  │                  │
     │  POST /auth/login│                  │                  │
     │  {email,password}│                  │                  │
     │─────────────────>│                  │                  │
     │                  │  POST /auth/login│                  │
     │                  │─────────────────>│                  │
     │                  │                  │  SELECT user     │
     │                  │                  │─────────────────>│
     │                  │                  │  user found      │
     │                  │                  │<─────────────────│
     │                  │                  │                  │
     │                  │                  │  Verify password │
     │                  │                  │  Check lockout   │
     │                  │                  │  Check isActive  │
     │                  │                  │                  │
     │                  │                  │  If invalid:     │
     │                  │                  │  Increment       │
     │                  │                  │  loginAttempts   │
     │                  │                  │  >7: lock 10min  │
     │                  │                  │  >14: lock 30min │
     │                  │                  │  >21: lock 1hr   │
     │                  │                  │                  │
     │                  │                  │  Generate:       │
     │                  │                  │  accessToken (JWT)│
     │                  │                  │  refreshToken    │
     │                  │                  │                  │
     │                  │                  │  Create session  │
     │                  │                  │  Log audit       │
     │                  │                  │                  │
     │                  │  Set-Cookie:     │                  │
     │                  │  refreshToken    │                  │
     │                  │  (HttpOnly)      │                  │
     │                  │  {accessToken    │                  │
     │                  │   user}          │                  │
     │                  │<─────────────────│                  │
     │  Redirect to     │                  │                  │
     │  /super-admin    │                  │                  │
     │<─────────────────│                  │                  │
```

### 3.2 Token Management

- **Access Token**: JWT, 30min expiry, in-memory only (never stored in localStorage)
- **Refresh Token**: Random UUID, HttpOnly cookie, `SameSite=Strict`, `Secure` in prod
- **Session ID**: Embedded in JWT for server-side session management
- **Password Version**: Incremented on password change; invalidates all existing tokens
- **Refresh Rotation**: Refresh token is rotated on every use; old one revoked

### 3.3 Token Payloads

```
Access Token:
{
  sub: "platform_user_id",
  email: "admin@platform.com",
  role: "SUPER_ADMIN",
  sessionId: "session_uuid",
  pv: 1,  // password version
  iat: 1710000000,
  exp: 1710001800
}

Refresh Token:
- Random UUID stored in DB tied to session
- One-time use
- 1d default, 30d with "remember me"
```

### 3.4 Endpoints

```
POST   /auth/login          { email, password, rememberMe? }
POST   /auth/refresh        (cookie)
POST   /auth/logout         (cookie)
POST   /auth/logout-all     (cookie) — terminate all sessions
GET    /auth/me             (access token)
PATCH  /auth/change-password { currentPassword, newPassword }
```

### 3.5 Seeded Super Admin Account

Created via `prisma/seed.ts` — never through registration:

```ts
// seed.ts
const email = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
const password = process.env.SUPER_ADMIN_PASSWORD || 'change-me-on-deploy';

await prisma.platformUser.create({
  data: {
    email,
    passwordHash: await bcrypt.hash(password, 12),
    name: 'Platform Admin',
    role: 'SUPER_ADMIN',
  }
});
```

---

## 4. Authorization (Platform RBAC)

### 4.1 Permissions Matrix

| Permission | SUPER_ADMIN | PLATFORM_OPERATOR | PLATFORM_AUDITOR | PLATFORM_SUPPORT |
|---|---|---|---|---|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Companies | ✅ | ✅ | ✅ | ✅ |
| Create Company | ✅ | ✅ | ❌ | ❌ |
| Edit Company | ✅ | ✅ | ❌ | ❌ |
| Suspend/Delete Company | ✅ | ❌ | ❌ | ❌ |
| View Users | ✅ | ✅ | ✅ | ✅ |
| Edit Users | ✅ | ✅ | ❌ | ✅ |
| Impersonate | ✅ | ❌ | ❌ | ✅ |
| View Subscriptions | ✅ | ✅ | ✅ | ❌ |
| Manage Plans | ✅ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ✅ | ❌ |
| View System Health | ✅ | ✅ | ✅ | ✅ |
| View Errors | ✅ | ✅ | ✅ | ✅ |
| Manage Modules | ✅ | ❌ | ❌ | ❌ |
| Manage Feature Flags | ✅ | ❌ | ❌ | ❌ |
| Configure Settings | ✅ | ❌ | ❌ | ❌ |
| Force Logout | ✅ | ✅ | ❌ | ✅ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |

### 4.2 Guard Implementation

```typescript
@Controller('companies')
@UseGuards(PlatformJwtAuthGuard, PlatformPermissionsGuard)
export class CompanyController {
  @Get()
  @RequirePlatformPermission('companies:read')
  findAll() { ... }

  @Post()
  @RequirePlatformPermission('companies:create')
  create() { ... }

  @Delete(':id')
  @RequirePlatformPermission('companies:delete')
  delete() { ... }
}
```

### 4.3 Permission Decorator

```typescript
export const PLATFORM_PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  COMPANIES_READ: 'companies:read',
  COMPANIES_CREATE: 'companies:create',
  COMPANIES_EDIT: 'companies:edit',
  COMPANIES_DELETE: 'companies:delete',
  USERS_READ: 'users:read',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  SUBSCRIPTIONS_READ: 'subscriptions:read',
  SUBSCRIPTIONS_MANAGE: 'subscriptions:manage',
  AUDIT_READ: 'audit:read',
  HEALTH_READ: 'health:read',
  ERRORS_READ: 'errors:read',
  ERRORS_RESOLVE: 'errors:resolve',
  MODULES_MANAGE: 'modules:manage',
  FEATURES_MANAGE: 'features:manage',
  SETTINGS_MANAGE: 'settings:manage',
  IMPERSONATE: 'impersonate',
  FORCE_LOGOUT: 'force-logout',
};
```

---

## 5. Complete API Structure

```
API Base: /api/v1

### Authentication
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
GET    /auth/me
PATCH  /auth/change-password

### Dashboard
GET    /dashboard/overview          — Platform-wide KPIs
GET    /dashboard/growth            — Company/user growth charts
GET    /dashboard/revenue           — Revenue data
GET    /dashboard/recent-activities — Latest audit log entries

### Companies
GET    /companies                   — List (paginated, filterable, searchable)
GET    /companies/:id               — Detail
POST   /companies                   — Create
PATCH  /companies/:id               — Update
DELETE /companies/:id               — Soft delete
POST   /companies/:id/restore       — Restore soft-deleted
POST   /companies/:id/suspend       — Suspend
POST   /companies/:id/unsuspend     — Unsuspend
POST   /companies/:id/transfer-ownership
GET    /companies/:id/users         — Users belonging to this tenant
GET    /companies/:id/activity      — Activity timeline
GET    /companies/:id/audit         — Audit logs for this tenant
GET    /companies/:id/usage         — Storage, API usage, user count

### Users (Global user management)
GET    /users                       — All platform users (from all tenants)
GET    /users/:id
POST   /users                       — Create user in a tenant
PATCH  /users/:id
DELETE /users/:id
POST   /users/:id/suspend
POST   /users/:id/unsuspend
POST   /users/:id/reset-password
POST   /users/:id/force-logout      — Terminate all sessions
POST   /users/:id/impersonate       — Start impersonation
POST   /users/:id/impersonate/stop  — End impersonation
GET    /users/:id/sessions          — Active sessions
GET    /users/:id/login-history

### Sessions
GET    /sessions                    — All active sessions (paginated)
DELETE /sessions/:id                — Terminate specific session
DELETE /sessions                    — Bulk terminate

### Subscriptions/Plans
GET    /plans
POST   /plans
PATCH  /plans/:id
DELETE /plans/:id
GET    /subscriptions
GET    /subscriptions/:id
PATCH  /subscriptions/:id
GET    /subscriptions/:id/invoices
POST   /subscriptions/:id/cancel
POST   /subscriptions/:id/renew

### Modules
GET    /modules
POST   /modules
PATCH  /modules/:id
DELETE /modules/:id

### Feature Flags
GET    /feature-flags
POST   /feature-flags
PATCH  /feature-flags/:id
DELETE /feature-flags/:id

### Audit Logs
GET    /audit-logs                  — Searchable, filterable, paginated
GET    /audit-logs/:id              — Detail
GET    /audit-logs/export           — CSV/JSON export

### System Health
GET    /health                      — All services status
GET    /health/:service             — Specific service detail
GET    /health/history/:service     — Historical health data
GET    /health/uptime               — System uptime

### Errors
GET    /errors                      — All errors
GET    /errors/:id                  — Detail with stack trace
PATCH  /errors/:id/resolve          — Mark resolved
PATCH  /errors/:id/dismiss          — Mark dismissed

### Platform Settings
GET    /settings                    — All settings (values masked for secrets)
GET    /settings/:key
PATCH  /settings/:key
PATCH  /settings                    — Bulk update
POST   /settings                    — Create setting

### Backups (Platform-level)
POST   /backups                     — Create backup
GET    /backups                     — List backups
GET    /backups/:id                 — Detail
POST   /backups/:id/restore         — Restore
DELETE /backups/:id                 — Delete backup file
GET    /backups/:id/download        — Download backup
```

---

## 6. Real-Time Monitoring Architecture

```
┌────────────────────────────────────────────────────┐
│              WebSocket Gateway (Port 8002)          │
│              Socket.IO Server                       │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard │  │ Health   │  │ Notification     │ │
│  │ Channel   │  │ Channel  │  │ Channel          │ │
│  └──────────┘  └──────────┘  └──────────────────┘ │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────┴───────────────────────────────┐
│              Event Bus / Internal Events            │
│                                                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Health     │ │ Audit    │ │ System           │  │
│  │ Checker    │ │ Logger   │ │ Events           │  │
│  │ (cron 30s) │ │          │ │                  │  │
│  └────────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 6.1 WebSocket Channels

| Channel | Payload | Frequency |
|---------|---------|-----------|
| `dashboard:metrics` | { totalCompanies, activeUsers, ... } | Every 10s |
| `health:update` | { service, status, responseTime } | On check |
| `health:alert` | { service, severity, message } | On failure |
| `audit:new` | { action, actor, target } | On action |
| `notification` | { type, title, message } | On event |
| `error:new` | { severity, message } | On error |

### 6.2 Health Check Endpoints (Server-side)

```typescript
@Injectable()
export class HealthAggregatorService {
  private checks: Map<string, HealthChecker> = new Map();

  constructor() {
    this.register('backend', new HttpHealthChecker('http://localhost:8001/health/ping'));
    this.register('database', new PrismaHealthChecker(this.prisma));
    this.register('redis', new RedisHealthChecker(this.redis));
    this.register('queue', new QueueHealthChecker(this.queue));
    this.register('storage', new DiskHealthChecker('/data'));
  }

  async checkAll(): Promise<HealthReport> {
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(([name, checker]) =>
        checker.check().then(status => ({ name, status }))
      )
    );
    // Emit via WebSocket
    this.events.emit('health:results', results);
    return { services: results, overall: this.calculateOverall(results) };
  }
}
```

### 6.3 Health Check Schedule

- All services checked every 30 seconds via Bull cron job
- Results stored in `health_check_history`
- Unhealthy status triggers an alert notification and WebSocket push
- 3 consecutive failures = CRITICAL status

---

## 7. Module Architecture

### 7.1 Module Definition

Each module is a feature area that can be enabled/disabled per company:

| Module ID | Label | Dependencies |
|-----------|-------|-------------|
| `leads` | Leads | none |
| `customers` | Customers | `leads` (optional) |
| `projects` | Projects | `customers` (optional) |
| `documents` | Documents | none |
| `inventory` | Inventory | none |
| `finance` | Finance | `customers` (optional) |
| `task-management` | Task Management | `projects` (optional) |
| `accounting` | Accounting | `finance` |
| `reports` | Reports | none |

### 7.2 Module Control Flow

```
SUPER-ADMIN Platform Modules Page
         │
         ├── Enable/Disable globally (all tenants)
         ├── Set as "Beta" (visible but flagged)
         ├── Set as "Internal" (hidden from tenants)
         ├── View dependency graph
         │
         └── Per-Company Override
              └── Company Detail → Modules tab
                   └── Enable/disable for this specific tenant
```

---

## 8. Company (Tenant) Lifecycle

```
                  ┌──────────┐
                  │  SEED    │
                  │  (DB)    │
                  └────┬─────┘
                       │ SUPER-ADMIN creates
                       v
                  ┌──────────┐
                  │  TRIAL   │──── (trial expired) ────>┌──────────┐
                  └────┬─────┘                          │ EXPIRED  │
                       │ Subscribe                       └────┬─────┘
                       v                                     │
                  ┌──────────┐                                │
                  │  ACTIVE  │──── (payment fails) ──────>┌──────────┐
                  └────┬─────┘                             │ PAST_DUE │
                       │                                   └────┬─────┘
                       ├── SUPER-ADMIN suspends ───>┌──────────┐  │
                       │                            │ SUSPENDED│<─┘
                       │                            └────┬─────┘
                       │                                 │
                       ├── SUPER-ADMIN blocks ─────>┌──────────┐
                       │                            │ BLOCKED  │
                       │                            └──────────┘
                       │
                       └── SUPER-ADMIN deletes ──>┌──────────┐
                                                   │ DELETED  │
                                                   │ (soft)   │
                                                   └──────────┘
                                                        │
                                                   (can restore)
```

### Transition Rules

| From | To | Condition | Audit Action |
|------|----|-----------|-------------|
| SEED | TRIAL | Company created | `company.created` |
| TRIAL | ACTIVE | Subscription activated | `subscription.activated` |
| TRIAL | EXPIRED | trialEndsAt passed + no subscription | `company.expired` |
| ACTIVE | SUSPENDED | SUPER-ADMIN action | `company.suspended` |
| SUSPENDED | ACTIVE | SUPER-ADMIN unsuspend | `company.unsuspended` |
| ACTIVE | BLOCKED | TOS violation / abuse | `company.blocked` |
| BLOCKED | SUSPENDED | Review passed | `company.unblocked` |
| ACTIVE | DELETED | SUPER-ADMIN delete | `company.deleted` |
| DELETED | ACTIVE | SUPER-ADMIN restore | `company.restored` |
| ACTIVE | PAST_DUE | Payment failure | `subscription.past_due` |
| PAST_DUE | ACTIVE | Payment resolved | `subscription.renewed` |
| PAST_DUE | SUSPENDED | Overdue > 30 days | `company.suspended` |

---

## 9. Subscription System

### Plan Tiers

| Tier | Price/Month | Users | Storage | Key Features |
|------|------------|-------|---------|-------------|
| Free | $0 | 3 | 500MB | Core CRM |
| Starter | $29 | 10 | 5GB | + Documents, API |
| Professional | $99 | 50 | 25GB | + Projects, Inventory, Finance |
| Enterprise | Custom | Unlimited | 100GB+ | + Accounting, Custom Branding, SSO |

### Subscription Events (Audited)

- `subscription.created`
- `subscription.activated`
- `subscription.renewed`
- `subscription.canceled`
- `subscription.expired`
- `subscription.plan_changed` { from, to }
- `subscription.billing_cycle_changed`
- `subscription.payment_received` { amount }
- `subscription.payment_failed` { attempt }

---

## 10. Audit System

### 10.1 All Actions Audited

Every mutation in the system creates a `PlatformAuditLog` entry:

```typescript
// Decorator-based auditing
@Audit({
  action: 'company.created',
  targetType: 'company',
  getTargetName: (result) => result.name,
  getMetadata: (args, result) => ({
    plan: result.planId,
    maxUsers: result.maxUsers,
  }),
})
```

### 10.2 Audit Event Categories

| Category | Actions |
|----------|---------|
| Authentication | login, logout, refresh, login_failed, password_changed |
| Companies | created, updated, suspended, unsuspended, deleted, restored, blocked, unblocked |
| Users | created, updated, suspended, unsuspended, deleted, password_reset |
| Sessions | terminated, force_logout, bulk_terminated |
| Subscriptions | created, activated, plan_changed, cancelled, renewed, expired |
| Modules | enabled, disabled, version_changed |
| Feature Flags | created, updated, globally_enabled, globally_disabled |
| Impersonation | started, ended |
| Settings | updated |
| System | health_alert, error_resolved, backup_created, backup_restored |

### 10.3 Audit UI

The audit log page supports:
- Free-text search across all fields
- Filter by action, actor, target type, severity, date range
- Sort by timestamp
- CSV/JSON export
- Detail drawer showing full metadata JSON

---

## 11. System Health Monitoring

### 11.1 Services Monitored

| Service | Check Type | Expected Response |
|---------|-----------|------------------|
| Backend API | HTTP GET /health/ping | 200 < 500ms |
| Database | Prisma $queryRaw `SELECT 1` | < 200ms |
| Redis | PING | < 50ms |
| Queue | Bull queue status | Active workers > 0 |
| Storage | Disk space check | < 90% usage |
| Frontend | HTTP GET / | 200 < 1000ms |
| Auth | JWT sign + verify roundtrip | < 100ms |
| Email | SMTP connection test | < 2000ms |
| Background Workers | Queue worker count | Expected count |
| Uploads | Temp file write + delete | < 500ms |
| SSL | Certificate expiry check | > 30 days remaining |

### 11.2 Health Status Definitions

| Status | Criteria | UI Color |
|--------|----------|----------|
| HEALTHY | Response < threshold, no errors | Green |
| WARNING | Response > threshold but < 2x, or 1 failure | Yellow |
| CRITICAL | 3+ consecutive failures, or service down | Red |
| OFFLINE | No response, connection refused | Gray |

### 11.3 Health Dashboard

```
┌─────────────────────────────────────────────────┐
│  System Health                           ONLINE  │
│  Overall: HEALTHY   Uptime: 99.97%              │
│                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │API   │ │ DB   │ │Redis │ │Queue │ │Email │  │
│  │100%  │ │100%  │ │100%  │ │ 98%  │ │100%  │  │
│  │12ms  │ │ 8ms  │ │ 2ms  │ │ 45ms │ │120ms │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Storage│ │Auth  │ │ Worker│ │SSL   │ │Front │  │
│  │ 67%  │ │100%  │ │100%  │ │ 45d  │ │100%  │  │
│  │ 340ms│ │ 15ms │ │ 23ms │ │ left │ │890ms │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────────────┘
```

---

## 12. Deployment & Version Management

### 12.1 Version Tracking

```prisma
model Deployment {
  id          String   @id @default(uuid())
  version     String   // semver
  branch      String
  commitHash  String
  deployedBy  String   // PlatformUser email
  status      DeploymentStatus @default(DEPLOYING)
  releaseNotes String?
  rollbackTo  String?  // Previous version for rollback capability
  startedAt   DateTime @default(now())
  completedAt DateTime?
  createdAt   DateTime @default(now())

  @@map("deployments")
}

enum DeploymentStatus {
  DEPLOYING
  ACTIVE
  FAILED
  ROLLED_BACK
}
```

### 12.2 Deployment Flow

1. SUPER-ADMIN triggers deployment from UI
2. Backend pulls git tag, runs migrations, builds, restarts services
3. Health checks verify new deployment
4. On failure: automatic rollback to previous version
5. Status broadcast via WebSocket

---

## 13. Complete Page & Module Structure

### Navigation

```
SUPER-ADMIN Sidebar
├── Dashboard
├── Companies
│   ├── All Companies
│   ├── Trials
│   ├── Suspended
│   └── Create Company
├── Users
│   ├── All Users
│   ├── Active Sessions
│   └── Login History
├── Subscriptions
│   ├── Plans
│   ├── Subscriptions
│   └── Invoices
├── System
│   ├── Health
│   ├── Errors
│   ├── Audit Logs
│   ├── Modules
│   ├── Feature Flags
│   └── Backups
├── Settings
│   ├── General
│   ├── Email
│   ├── Authentication
│   ├── Security
│   └── Maintenance
└── Admin
    ├── Platform Users
    ├── Impersonation Logs
    └── Deployments
```

### Page Specifications

**1. Dashboard** `/super-admin`
- KPI cards: Total Companies, Active Companies, Total Users, Active Users, Revenue MTD, Platform Health Score
- Charts: Company Growth (line), Revenue (bar), User Growth (area)
- Table: Recent Activities (latest 10 audit entries)
- Alerts: Current health warnings/errors
- Real-time: WebSocket updates every 10s

**2. Companies** `/super-admin/companies`
- Table: name, status, plan, users, storage, created, actions
- Filters: status, plan, date range, search (name/email/domain)
- Actions: create, edit, suspend, delete, restore, impersonate
- Detail view: tabs for Info, Users, Subscription, Activity, Audit, Usage

**3. Users** `/super-admin/users`
- Table: name, email, company, role, status, last login, actions
- Filters: company, role, status, date range, search
- Actions: create, edit, suspend, reset password, force logout, impersonate
- Detail view: tabs for Info, Sessions, Login History, Permissions

**4. Sessions** `/super-admin/sessions`
- Table: user, company, browser, OS, IP, location, login time, last activity
- Actions: terminate single session, force logout user
- Search/filter by user, company, status

**5. Subscriptions** `/super-admin/subscriptions`
- Plans: card grid with price, features, user limit, storage limit
- Subscriptions: table with company, plan, status, billing cycle, period end
- Invoices: table with amount, status, due date, paid date
- Actions: create plan, edit plan, change subscription, cancel, renew

**6. Modules** `/super-admin/modules`
- Grid of module cards: name, version, status, dependencies, health
- Toggle globally enabled/disabled
- Per-company overrides
- Version management

**7. Feature Flags** `/super-admin/feature-flags`
- Table: name, globally enabled, beta, internal
- Toggle global state
- Per-tenant overrides
- Search/filter

**8. Audit Logs** `/super-admin/audit-logs`
- Table: timestamp, action, actor, target, severity
- Searchable, filterable by action/actor/target/severity/date
- Detail drawer with full metadata
- CSV/JSON export

**9. System Health** `/super-admin/health`
- Overview cards per service (status, response time, last check)
- History charts (response time over time, uptime percentage)
- Alert list
- Overall score

**10. Errors** `/super-admin/errors`
- Table: timestamp, service, type, message, severity, status
- Detail view: stack trace, metadata, request context
- Actions: mark investigating, resolve, dismiss

**11. Backups** `/super-admin/backups`
- Table: timestamp, size, status, type (manual/scheduled)
- Actions: create, download, restore, delete
- Schedule configuration

**12. Settings** `/super-admin/settings`
- Categorized sections: General, Email, Auth, Security, Storage, Maintenance
- Key-value editor with type validation
- Secret values masked
- Audit trail for changes

**13. Platform Users** `/super-admin/admin/users`
- Table: name, email, role, last login, status
- Actions: create, edit, suspend, change role
- Only for managing SUPER-ADMIN platform accounts

**14. Impersonation Logs** `/super-admin/admin/impersonations`
- Table: super admin, target company, target user, start, end, duration
- Search/filter/export

**15. Deployments** `/super-admin/admin/deployments`
- Table: version, date, status, deployed by
- Rollback capability

---

## 14. Frontend Directory Structure

```
SUPER-ADMIN/frontend/src/
├── app/
│   ├── layout.tsx                    // Root layout (no auth wrapper)
│   ├── page.tsx                      // Redirect to /super-admin
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx                  // Super Admin login page
│   └── super-admin/
│       ├── layout.tsx                // Auth-protected layout with sidebar
│       ├── page.tsx                  // Dashboard
│       ├── companies/
│       │   ├── page.tsx              // All companies table
│       │   ├── create/page.tsx       // Create company form
│       │   └── [id]/page.tsx         // Company detail
│       ├── users/
│       │   ├── page.tsx              // All users table
│       │   └── [id]/page.tsx         // User detail
│       ├── sessions/
│       │   └── page.tsx              // Active sessions
│       ├── subscriptions/
│       │   ├── page.tsx              // Subscriptions + plans
│       │   └── plans/
│       │       └── page.tsx          // Plan management
│       ├── health/
│       │   └── page.tsx              // System health
│       ├── errors/
│       │   └── page.tsx              // Error monitoring
│       ├── audit-logs/
│       │   └── page.tsx              // Audit log viewer
│       ├── modules/
│       │   └── page.tsx              // Module management
│       ├── feature-flags/
│       │   └── page.tsx              // Feature flags
│       ├── backups/
│       │   └── page.tsx              // Backup center
│       ├── settings/
│       │   └── page.tsx              // Platform settings
│       └── admin/
│           ├── users/page.tsx        // Platform user management
│           ├── impersonations/page.tsx // Impersonation logs
│           └── deployments/page.tsx  // Deployment history
│
├── components/
│   ├── ui/                           // shadcn/ui primitives
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   ├── ChartCard.tsx
│   │   ├── RecentActivityTable.tsx
│   │   └── SystemAlerts.tsx
│   ├── companies/
│   │   ├── CompanyTable.tsx
│   │   ├── CompanyForm.tsx
│   │   ├── CompanyDetailTabs.tsx
│   │   ├── CompanyStatusBadge.tsx
│   │   └── CompanyActions.tsx
│   ├── users/
│   │   ├── UserTable.tsx
│   │   ├── UserForm.tsx
│   │   ├── UserDetailTabs.tsx
│   │   └── SessionTable.tsx
│   ├── subscriptions/
│   │   ├── PlanCard.tsx
│   │   ├── SubscriptionTable.tsx
│   │   ├── InvoiceTable.tsx
│   │   └── PlanForm.tsx
│   ├── health/
│   │   ├── HealthCard.tsx
│   │   ├── HealthHistoryChart.tsx
│   │   └── ServiceStatusBadge.tsx
│   ├── errors/
│   │   ├── ErrorTable.tsx
│   │   ├── ErrorDetailDrawer.tsx
│   │   └── ErrorSeverityBadge.tsx
│   ├── audit/
│   │   ├── AuditLogTable.tsx
│   │   ├── AuditDetailDrawer.tsx
│   │   └── AuditExportButton.tsx
│   ├── modules/
│   │   ├── ModuleCard.tsx
│   │   └── ModuleDependencyGraph.tsx
│   ├── flags/
│   │   └── FeatureFlagTable.tsx
│   ├── backups/
│   │   ├── BackupTable.tsx
│   │   └── BackupScheduleForm.tsx
│   ├── settings/
│   │   └── SettingEditor.tsx
│   ├── admin/
│   │   ├── PlatformUserTable.tsx
│   │   ├── ImpersonationLogTable.tsx
│   │   └── DeploymentTable.tsx
│   ├── shared/
│   │   ├── DataTable.tsx             // Reusable table with sort/filter/page
│   │   ├── FilterPanel.tsx           // Reusable filter bar
│   │   ├── SearchInput.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorState.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       └── Breadcrumbs.tsx
│
├── features/
│   └── auth/
│       ├── AuthContext.tsx            // Platform auth context (separate from PEB)
│       ├── authService.ts            // API calls
│       └── validations.ts
│
├── lib/
│   ├── api.ts                        // Axios client with platform auth
│   ├── utils.ts
│   └── websocket.ts                  // Socket.IO client
│
├── store/
│   ├── useDashboardStore.ts
│   ├── useCompanyStore.ts
│   ├── useUserStore.ts
│   ├── useHealthStore.ts
│   └── useSidebarStore.ts
│
└── types/
    ├── index.ts                      // Shared types
    ├── company.ts
    ├── user.ts
    ├── subscription.ts
    ├── health.ts
    └── audit.ts
```

---

## 15. Backend Directory Structure

```
SUPER-ADMIN/backend/src/
├── main.ts
├── app.module.ts
├── config/
│   ├── config.module.ts
│   └── configuration.ts
├── common/
│   ├── decorators/
│   │   ├── platform-permissions.decorator.ts
│   │   └── platform-public.decorator.ts
│   ├── guards/
│   │   ├── platform-jwt-auth.guard.ts
│   │   └── platform-permissions.guard.ts
│   ├── interceptors/
│   │   ├── audit.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── middleware/
│   │   └── request-id.middleware.ts
│   └── pipes/
│       └── validation.pipe.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── cookie.interceptor.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── change-password.dto.ts
│   └── strategies/
│       └── platform-jwt.strategy.ts
├── platform-users/
│   ├── platform-users.controller.ts
│   ├── platform-users.module.ts
│   ├── platform-users.service.ts
│   └── dto/
│       ├── create-platform-user.dto.ts
│       └── update-platform-user.dto.ts
├── companies/
│   ├── companies.controller.ts
│   ├── companies.module.ts
│   ├── companies.service.ts
│   └── dto/
│       ├── create-company.dto.ts
│       ├── update-company.dto.ts
│       └── query-companies.dto.ts
├── users/                            // Tenant users (global user management)
│   ├── users.controller.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   └── dto/
├── sessions/
│   ├── sessions.controller.ts
│   ├── sessions.module.ts
│   └── sessions.service.ts
├── subscriptions/
│   ├── plans.controller.ts
│   ├── plans.module.ts
│   ├── plans.service.ts
│   ├── subscriptions.controller.ts
│   ├── subscriptions.module.ts
│   ├── subscriptions.service.ts
│   └── dto/
├── modules/
│   ├── modules.controller.ts
│   ├── modules.module.ts
│   ├── modules.service.ts
│   └── dto/
├── feature-flags/
│   ├── feature-flags.controller.ts
│   ├── feature-flags.module.ts
│   └── feature-flags.service.ts
├── audit/
│   ├── audit.controller.ts
│   ├── audit.module.ts
│   ├── audit.service.ts
│   └── dto/
├── health/
│   ├── health.controller.ts
│   ├── health.module.ts
│   ├── health.service.ts             // Aggregator
│   └── checkers/
│       ├── backend.checker.ts
│       ├── database.checker.ts
│       ├── redis.checker.ts
│       ├── queue.checker.ts
│       ├── storage.checker.ts
│       └── ssl.checker.ts
├── errors/
│   ├── errors.controller.ts
│   ├── errors.module.ts
│   └── errors.service.ts
├── settings/
│   ├── settings.controller.ts
│   ├── settings.module.ts
│   └── settings.service.ts
├── backups/
│   ├── backups.controller.ts
│   ├── backups.module.ts
│   └── backups.service.ts
├── impersonation/
│   ├── impersonation.controller.ts
│   ├── impersonation.module.ts
│   └── impersonation.service.ts
├── deployments/
│   ├── deployments.controller.ts
│   ├── deployments.module.ts
│   └── deployments.service.ts
├── dashboard/
│   ├── dashboard.controller.ts
│   ├── dashboard.module.ts
│   └── dashboard.service.ts
├── websocket/
│   ├── websocket.gateway.ts
│   └── websocket.module.ts
├── queue/
│   ├── queue.module.ts
│   └── jobs/
│       ├── health-check.job.ts
│       └── backup.job.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── logger/
    └── logger.service.ts
```

---

## Architecture is Ready for Review

This document covers:

- ✅ System architecture & tech stack
- ✅ Full database schema (11 models)
- ✅ Authentication flow (diagram, tokens, endpoints, seeding)
- ✅ Platform RBAC (4 roles, permission matrix, guards)
- ✅ Complete REST API (80+ endpoints)
- ✅ Real-time WebSocket monitoring architecture
- ✅ Module & feature flag system
- ✅ Company/tenant lifecycle (9 states, transition rules)
- ✅ Subscription system (4 tiers, billing, invoices)
- ✅ Enterprise audit system (20+ action categories)
- ✅ System health monitoring (11 services, 4 status levels)
- ✅ Deployment/version management
- ✅ 15 pages with full specifications
- ✅ Frontend directory structure
- ✅ Backend directory structure

Ready for your review and feedback before implementation begins.
