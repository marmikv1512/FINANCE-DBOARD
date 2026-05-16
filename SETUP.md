# Finance Dashboard — Setup Guide

## Architecture
- **Frontend**: Vite + React → `artifacts/finance-tracker` → runs on `:5173`
- **Backend**: Express API → `artifacts/api-server` → runs on `:3000`
- **Database**: Drizzle ORM + Supabase Postgres
- **Workspace**: pnpm monorepo

## Root Cause of "Failed to fetch" (Fixed)
`main.tsx` was intercepting `/api` calls and rewriting them to `http://localhost:8080` (wrong port, bypassed Vite proxy). Now fixed: Vite proxy correctly forwards `/api` to backend on `:3000`.

---

## Step 1 — Install Dependencies
```bash
pnpm install
```

---

## Step 2 — Database Setup

### Option A: Drizzle Push (recommended)
```bash
cd lib/db
pnpm run push
cd ../..
```
This creates all tables in Supabase automatically.

### Option B: Manual SQL
1. Open Supabase → SQL Editor
2. Paste and run `deploy/schema.sql`
3. Paste and run `deploy/seed.sql`

---

## Step 3 — Seed Demo Data
```bash
cd scripts
pnpm run seed-finance
cd ..
```

---

## Step 4 — Run Locally

**Terminal 1 — Backend:**
```bash
cd artifacts/api-server
pnpm run dev
# Server starts on http://localhost:3000
# Test: curl http://localhost:3000/api/healthz
```

**Terminal 2 — Frontend:**
```bash
cd artifacts/finance-tracker
pnpm run dev
# Opens http://localhost:5173
# Vite proxies /api → localhost:3000
```

---

## Environment Variables

### Backend (`artifacts/api-server/.env`)
```env
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
```

### Frontend (`artifacts/finance-tracker/.env`)
```env
# Empty = use Vite proxy in dev
# In production: set to your Railway backend URL
VITE_API_URL=
```

---

## Railway Deployment

### Backend Service
1. Create new Railway project
2. Connect GitHub repo
3. Set **Root Directory**: `artifacts/api-server`  
   OR use the `railway.json` and `nixpacks.toml` in project root
4. Set environment variables:
   ```
   DATABASE_URL=<your supabase url>
   PORT=3000
   CORS_ORIGIN=https://your-frontend.railway.app
   NODE_ENV=production
   ```
5. Deploy — Railway auto-detects Node.js

### Frontend Service
1. Add new service to same Railway project
2. Set **Root Directory**: `artifacts/finance-tracker`
3. Set **Build Command**: `pnpm install && pnpm run build`
4. Set **Start Command**: `npx serve dist/public -p $PORT`
5. Set environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   NODE_ENV=production
   ```

---

## API Endpoints
```
GET  /api/healthz                    — health check
GET  /api/status                     — db connectivity check
GET  /api/accounts                   — list accounts
POST /api/accounts                   — create account
GET  /api/transactions               — list transactions (with filters)
POST /api/transactions               — create transaction
GET  /api/categories                 — list categories
POST /api/categories                 — create category
GET  /api/budgets                    — list budgets
POST /api/budgets                    — create budget
GET  /api/goals                      — list goals
POST /api/goals                      — create goal
GET  /api/analytics/summary          — monthly summary
GET  /api/analytics/spending-by-category
GET  /api/analytics/monthly-trends
GET  /api/analytics/net-worth
```

---

## Troubleshooting

**"Failed to fetch"**
- Confirm backend is running: `curl http://localhost:3000/api/healthz`
- Confirm Vite proxy in `vite.config.ts` targets `:3000` (not `:8080`)
- Confirm `VITE_API_URL` in frontend `.env` is empty (dev) or correct backend URL (prod)

**"Cannot GET /"**  
Fixed — backend now returns `{ status: "ok" }` at `GET /`

**Database connection errors**
- Verify `DATABASE_URL` in `artifacts/api-server/.env`
- Supabase connection requires SSL — already configured in `lib/db/src/index.ts`

**Drizzle push fails**
```bash
cd lib/db
DATABASE_URL="your-url" pnpm run push-force
```

**Port conflicts**
- Backend: change `PORT=3000` in `artifacts/api-server/.env`
- Frontend: set `PORT=5174` in `artifacts/finance-tracker/.env`
- Update Vite proxy target if backend port changes
