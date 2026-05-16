-- Finance Dashboard - Demo Seed Data
-- Run AFTER schema.sql

-- Categories (guard with WHERE NOT EXISTS since no unique constraint on name)
INSERT INTO categories (name, type, color, icon, is_default)
SELECT * FROM (VALUES
  ('Salary',         'income'::category_type,  '#3ecf8e', 'briefcase',   true),
  ('Freelance',      'income'::category_type,  '#22d3ee', 'laptop',      true),
  ('Investments',    'income'::category_type,  '#a78bfa', 'trending-up', true),
  ('Food & Dining',  'expense'::category_type, '#f59e0b', 'utensils',    true),
  ('Transportation', 'expense'::category_type, '#3b82f6', 'car',         true),
  ('Shopping',       'expense'::category_type, '#ec4899', 'shopping-bag',true),
  ('Housing',        'expense'::category_type, '#8b5cf6', 'home',        true),
  ('Entertainment',  'expense'::category_type, '#f97316', 'tv',          true),
  ('Healthcare',     'expense'::category_type, '#ef4444', 'heart',       true),
  ('Utilities',      'expense'::category_type, '#14b8a6', 'zap',         true),
  ('Education',      'expense'::category_type, '#6366f1', 'book',        true),
  ('Travel',         'expense'::category_type, '#84cc16', 'plane',       true)
) AS v(name, type, color, icon, is_default)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = v.name);

-- Accounts (guard with WHERE NOT EXISTS)
INSERT INTO accounts (name, type, balance, currency, color, icon, institution)
SELECT * FROM (VALUES
  ('Main Checking',       'checking'::account_type,   4250.75, 'USD', '#3ecf8e', 'credit-card', 'Chase Bank'),
  ('Emergency Savings',   'savings'::account_type,   12500.00, 'USD', '#22d3ee', 'shield',      'Ally Bank'),
  ('Investment Portfolio','investment'::account_type, 45800.50, 'USD', '#a78bfa', 'trending-up', 'Fidelity'),
  ('Credit Card',         'credit'::account_type,    -1250.00, 'USD', '#ef4444', 'credit-card', 'Chase')
) AS v(name, type, balance, currency, color, icon, institution)
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE accounts.name = v.name);

-- Transactions (3 months of data, only if table is empty)
DO $$
DECLARE
  checking_id     INTEGER;
  salary_id       INTEGER;
  freelance_id    INTEGER;
  food_id         INTEGER;
  transport_id    INTEGER;
  shopping_id     INTEGER;
  housing_id      INTEGER;
  entertainment_id INTEGER;
  healthcare_id   INTEGER;
  utilities_id    INTEGER;
  i INTEGER;
  m INTEGER;
  y INTEGER;
  mo TEXT;
BEGIN
  IF (SELECT COUNT(*) FROM transactions) > 0 THEN
    RAISE NOTICE 'Transactions already exist, skipping.';
    RETURN;
  END IF;

  SELECT id INTO checking_id     FROM accounts   WHERE type = 'checking'     LIMIT 1;
  SELECT id INTO salary_id       FROM categories WHERE name = 'Salary'        LIMIT 1;
  SELECT id INTO freelance_id    FROM categories WHERE name = 'Freelance'     LIMIT 1;
  SELECT id INTO food_id         FROM categories WHERE name = 'Food & Dining' LIMIT 1;
  SELECT id INTO transport_id    FROM categories WHERE name = 'Transportation' LIMIT 1;
  SELECT id INTO shopping_id     FROM categories WHERE name = 'Shopping'      LIMIT 1;
  SELECT id INTO housing_id      FROM categories WHERE name = 'Housing'       LIMIT 1;
  SELECT id INTO entertainment_id FROM categories WHERE name = 'Entertainment' LIMIT 1;
  SELECT id INTO healthcare_id   FROM categories WHERE name = 'Healthcare'    LIMIT 1;
  SELECT id INTO utilities_id    FROM categories WHERE name = 'Utilities'     LIMIT 1;

  FOR i IN 0..2 LOOP
    m  := EXTRACT(MONTH FROM (NOW() - (i || ' months')::INTERVAL))::INTEGER;
    y  := EXTRACT(YEAR  FROM (NOW() - (i || ' months')::INTERVAL))::INTEGER;
    mo := LPAD(m::TEXT, 2, '0');

    INSERT INTO transactions (account_id, category_id, type, amount, description, date, is_recurring, recurring_interval) VALUES
      (checking_id, salary_id,         'income',  5500.00, 'Monthly Salary',        y || '-' || mo || '-01', true,  'monthly'),
      (checking_id, housing_id,        'expense', 1500.00, 'Rent Payment',          y || '-' || mo || '-01', true,  'monthly'),
      (checking_id, utilities_id,      'expense',   95.00, 'Electric Bill',         y || '-' || mo || '-02', true,  'monthly'),
      (checking_id, transport_id,      'expense',   89.00, 'Monthly Bus Pass',      y || '-' || mo || '-02', true,  'monthly'),
      (checking_id, food_id,           'expense',   85.50, 'Grocery Shopping',      y || '-' || mo || '-03', false, null),
      (checking_id, transport_id,      'expense',   45.00, 'Gas Station',           y || '-' || mo || '-05', false, null),
      (checking_id, food_id,           'expense',   62.30, 'Restaurant Dinner',     y || '-' || mo || '-07', false, null),
      (checking_id, shopping_id,       'expense',  120.00, 'Amazon Purchase',       y || '-' || mo || '-10', false, null),
      (checking_id, entertainment_id,  'expense',   15.99, 'Netflix Subscription',  y || '-' || mo || '-15', true,  'monthly'),
      (checking_id, freelance_id,      'income',   800.00, 'Freelance Project',     y || '-' || mo || '-18', false, null),
      (checking_id, healthcare_id,     'expense',   35.00, 'Pharmacy',              y || '-' || mo || '-20', false, null),
      (checking_id, food_id,           'expense',   48.75, 'Lunch with Colleagues', y || '-' || mo || '-22', false, null),
      (checking_id, entertainment_id,  'expense',   12.99, 'Spotify Subscription',  y || '-' || mo || '-25', true,  'monthly'),
      (checking_id, shopping_id,       'expense',   67.40, 'Clothing Store',        y || '-' || mo || '-27', false, null);
  END LOOP;
END $$;

-- Budgets (current month — has unique constraint on category_id, month, year)
INSERT INTO budgets (category_id, amount, month, year, alert_threshold)
SELECT c.id, b.amount, EXTRACT(MONTH FROM NOW())::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER, b.threshold
FROM (VALUES
  ('Food & Dining',  600.00::NUMERIC, 80::NUMERIC),
  ('Transportation', 300.00::NUMERIC, 80::NUMERIC),
  ('Shopping',       400.00::NUMERIC, 75::NUMERIC),
  ('Entertainment',  150.00::NUMERIC, 85::NUMERIC),
  ('Healthcare',     200.00::NUMERIC, 80::NUMERIC),
  ('Utilities',      250.00::NUMERIC, 80::NUMERIC)
) AS b(name, amount, threshold)
JOIN categories c ON c.name = b.name
ON CONFLICT (category_id, month, year) DO NOTHING;

-- Goals (no unique constraint — guard with WHERE NOT EXISTS)
INSERT INTO goals (name, target_amount, current_amount, target_date, color, icon, description, status)
SELECT * FROM (VALUES
  ('Emergency Fund',    20000.00::NUMERIC, 12500.00::NUMERIC, '2025-12-31', '#3ecf8e', 'shield', '6 months of expenses', 'active'::goal_status),
  ('Vacation to Europe', 5000.00::NUMERIC,  1800.00::NUMERIC, '2025-08-01', '#22d3ee', 'plane',  'Summer vacation',      'active'::goal_status),
  ('New MacBook Pro',    3500.00::NUMERIC,  3500.00::NUMERIC, '2024-06-01', '#a78bfa', 'laptop', 'For work',             'completed'::goal_status),
  ('Home Down Payment', 50000.00::NUMERIC, 15000.00::NUMERIC, '2027-01-01', '#f59e0b', 'home',   '20% down on a home',  'active'::goal_status)
) AS v(name, target_amount, current_amount, target_date, color, icon, description, status)
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE goals.name = v.name);
