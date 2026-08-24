@echo off
cd /d "%~dp0"
set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/peb-platform?sslmode=disable
set CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/BuildX?sslmode=disable
set NODE_ENV=development
set PORT=8001
set FRONTEND_URL=http://localhost:3001
set ALLOWED_ORIGINS=http://localhost:3001
call npm run start