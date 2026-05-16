# Workspace

## Overview

Full-stack Personal Finance Tracker — FinTrack. A market-ready, Supabase-inspired dark-themed web application for tracking income, expenses, budgets, and savings goals.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS
- **Charts**: Recharts
- **Forms**: react-hook-form + zod

## Features

- **Dashboard**: Net savings, income, expenses, savings rate KPIs; cash flow bar chart; recent transactions list
- **Transactions**: Full transaction table with search, filters, add/edit/delete
- **Accounts**: Multi-account management (checking, savings, credit, investment, cash)
- **Budgets**: Monthly budget tracking with progress bars and alerts
- **Goals**: Savings goals with progress tracking and target dates
- **Analytics**: Spending by category (donut chart), monthly trends, net worth calculation

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── finance-tracker/    # React + Vite frontend (dark Supabase-like UI)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── accounts.ts
│           ├── categories.ts
│           ├── transactions.ts
│           ├── budgets.ts
│           └── goals.ts
├── scripts/
│   └── src/seed-finance.ts # Database seeder with demo data
└── ...
```

## API Routes

All routes are under `/api`:
- `GET/POST /accounts` — Account CRUD
- `GET/POST /transactions` — Transaction CRUD (with filters: accountId, categoryId, type, startDate, endDate, search)
- `GET/POST /categories` — Category CRUD
- `GET/POST /budgets` — Budget CRUD (with month/year filters)
- `GET/POST /goals` — Savings goal CRUD
- `GET /analytics/summary` — Monthly income/expense/savings summary
- `GET /analytics/spending-by-category` — Spending by category
- `GET /analytics/monthly-trends` — 6-month income vs expense trends
- `GET /analytics/net-worth` — Net worth calculation

## Database Schema

Tables: `accounts`, `categories`, `transactions`, `budgets`, `goals`
Enums: `account_type`, `category_type`, `transaction_type`, `goal_status`

## Seeding

```bash
pnpm --filter @workspace/scripts run seed-finance
```

Seeds: 12 categories, 4 accounts, 36 transactions (3 months), 6 budgets, 4 goals.

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — Run the dev API server
- `pnpm --filter @workspace/finance-tracker run dev` — Run the frontend
- `pnpm --filter @workspace/api-spec run codegen` — Re-generate API client/Zod schemas
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm --filter @workspace/scripts run seed-finance` — Seed demo data
