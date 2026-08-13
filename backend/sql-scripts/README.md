# SQL Scripts Directory

This directory contains manual SQL scripts for specific database operations.

## Files

### crm-migration.sql
- **Target Database**: `peb-crm` (CRM database)
- **Purpose**: Updates CRM database tables for Organization, User, Role, Permission, and related entities
- **Usage**: 
  ```bash
  psql -h 127.0.0.1 -p 5432 -U postgres -d peb-crm -f crm-migration.sql
  ```
- **Note**: This script should NOT be run against the Platform database (`peb-platform`)

## Important Notes

- **Platform DB (`peb-platform`)**: Use Prisma migrations in `prisma/migrations/` directory
- **CRM DB (`peb-crm`)**: Use manual SQL scripts in this directory
- Never mix the two - they target different databases
