-- Finance Dashboard - Complete Supabase Schema
-- Run this in Supabase SQL Editor in order

-- 1. Enums
CREATE TYPE IF NOT EXISTS account_type AS ENUM ('checking', 'savings', 'credit', 'investment', 'loan', 'cash', 'other');
CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE IF NOT EXISTS category_type AS ENUM ('income', 'expense', 'both');
CREATE TYPE IF NOT EXISTS goal_status AS ENUM ('active', 'completed', 'paused');

-- 2. Categories (no foreign key deps)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type category_type NOT NULL DEFAULT 'expense',
  color TEXT NOT NULL DEFAULT '#3ecf8e',
  icon TEXT NOT NULL DEFAULT 'tag',
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- 3. Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type account_type NOT NULL DEFAULT 'checking',
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  color TEXT NOT NULL DEFAULT '#3ecf8e',
  icon TEXT NOT NULL DEFAULT 'wallet',
  institution TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- 4. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL DEFAULT 'expense',
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

-- 5. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  alert_threshold NUMERIC(5, 2) DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);

-- 6. Goals
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  target_date TEXT,
  color TEXT NOT NULL DEFAULT '#3ecf8e',
  icon TEXT NOT NULL DEFAULT 'target',
  description TEXT,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
