# PEB-CRM Backend

Production-ready NestJS backend for PEB-CRM application.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Installation

```bash
npm install
```

## Environment Configuration

1. Copy `.env.example` to `.env.development`:
```bash
cp .env.example .env.development
```

2. Update `.env.development` with your database credentials:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/peb_crm?schema=public"
```

## Database Setup

1. Ensure PostgreSQL is running
2. Run Prisma migrations (when models are defined):
```bash
npx prisma migrate dev
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Health Check

The application includes a health check endpoint:

```bash
GET http://localhost:3000/health
```

Response:
```json
{
  "status": "ok"
}
```

## Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## Project Structure

```
backend/
├── src/
│   ├── common/           # Shared utilities (filters, pipes, logger)
│   ├── config/           # Configuration module
│   ├── health/           # Health check module
│   ├── prisma/           # Prisma service and module
│   ├── main.ts           # Application entry point
│   └── app.module.ts     # Root module
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## Technology Stack

- NestJS 11
- TypeScript 5.7
- Prisma 6
- PostgreSQL
- class-validator
- class-transformer
