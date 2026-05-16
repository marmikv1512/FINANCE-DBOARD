-- Finance Dashboard - Demo Seed Data
-- Run AFTER schema.sql

-- Categories
INSERT INTO categories (name, type, color, icon, is_default) VALUES
  ('Salary', 'income', '#3ecf8e', 'briefcase', true),
  ('Freelance', 'income', '#22d3ee', 'laptop', true),
  ('Investments', 'income', '#a78bfa', 'trending-up', true),
  ('Food & Dining', 'expense', '#f59e0b', 'utensils', true),
  ('Transportation', 'expense', '#3b82f6', 'car', true),
  ('Shopping', 'expense', '#ec4899', 'shopping-bag', true),
  ('Housing', 'expense', '#8b5cf6', 'home', true),
  ('Entertainment', 'expense', '#f97316', 'tv', true),
  ('Healthcare', 'expense', '#ef4444', 'heart', true),
  ('Utilities', 'expense', '#14b8a6', 'zap', true),
  ('Education', 'expense', '#6366f1', 'book', true),
  ('Travel', 'expense', '#84cc16', 'plane', true)
ON CONFLICT DO NOTHING;

-- Accounts
INSERT INTO accounts (name, type, balance, currency, color, icon, institution) VALUES
  ('Main Checking', 'checking', 4250.75, 'USD', '#3ecf8e', 'credit-card', 'Chase Bank'),
  ('Emergency Savings', 'savings', 12500.00, 'USD', '#22d3ee', 'shield', 'Ally Bank'),
  ('Investment Portfolio', 'investment', 45800.50, 'USD', '#a78bfa', 'trending-up', 'Fidelity'),
  ('Credit Card', 'credit', -1250.00, 'USD', '#ef4444', 'credit-card', 'Chase')
ON CONFLICT DO NOTHING;

-- Transactions (3 months of data)
DO $$
DECLARE
  checking_id INTEGER;
  salary_id INTEGER;
  freelance_id INTEGER;
  food_id INTEGER;
  transport_id INTEGER;
  shopping_id INTEGER;
  housing_id INTEGER;
  entertainment_id INTEGER;
  healthcare_id INTEGER;
  utilities_id INTEGER;
  i INTEGER;
  m INTEGER;
  y INTEGER;
  mo TEXT;
BEGIN
  SELECT id INTO checking_id FROM accounts WHERE type = 'checking' LIMIT 1;
  SELECT id INTO salary_id FROM categories WHERE name = 'Salary' LIMIT 1;
  SELECT id INTO freelance_id FROM categories WHERE name = 'Freelance' LIMIT 1;
  SELECT id INTO food_id FROM categories WHERE name = 'Food & Dining' LIMIT 1;
  SELECT id INTO transport_id FROM categories WHERE name = 'Transportation' LIMIT 1;
  SELECT id INTO shopping_id FROM categories WHERE name = 'Shopping' LIMIT 1;
  SELECT id INTO housing_id FROM categories WHERE name = 'Housing' LIMIT 1;
  SELECT id INTO entertainment_id FROM categories WHERE name = 'Entertainment' LIMIT 1;
  SELECT id INTO healthcare_id FROM categories WHERE name = 'Healthcare' LIMIT 1;
  SELECT id INTO utilities_id FROM categories WHERE name = 'Utilities' LIMIT 1;

  FOR i IN 0..2 LOOP
    m := EXTRACT(MONTH FROM (NOW() - (i || ' months')::INTERVAL))::INTEGER;
    y := EXTRACT(YEAR FROM (NOW() - (i || ' months')::INTERVAL))::INTEGER;
    mo := LPAD(m::TEXT, 2, '0');

    INSERT INTO transactions (account_id, category_id, type, amount, description, date, is_recurring, recurring_interval) VALUES
      (checking_id, salary_id,        'income',  5500.00, 'Monthly Salary',        y || '-' || mo || '-01', true,  'monthly'),
      (checking_id, housing_id,       'expense', 1500.00, 'Rent Payment',          y || '-' || mo || '-01', true,  'monthly'),
      (checking_id, utilities_id,     'expense',   95.00, 'Electric Bill',         y || '-' || mo || '-02', true,  'monthly'),
      (checking_id, transport_id,     'expense',   89.00, 'Monthly Bus Pass',      y || '-' || mo || '-02', true,  'monthly'),
      (checking_id, food_id,          'expense',   85.50, 'Grocery Shopping',      y || '-' || mo || '-03', false, null),
      (checking_id, transport_id,     'expense',   45.00, 'Gas Station',           y || '-' || mo || '-05', false, null),
      (checking_id, food_id,          'expense',   62.30, 'Restaurant Dinner',     y || '-' || mo || '-07', false, null),
      (checking_id, shopping_id,      'expense',  120.00, 'Amazon Purchase',       y || '-' || mo || '-10', false, null),
      (checking_id, entertainment_id, 'expense',   15.99, 'Netflix Subscription',  y || '-' || mo || '-15', true,  'monthly'),
      (checking_id, freelance_id,     'income',   800.00, 'Freelance Project',     y || '-' || mo || '-18', false, null),
      (checking_id, healthcare_id,    'expense',   35.00, 'Pharmacy',              y || '-' || mo || '-20', false, null),
      (checking_id, food_id,          'expense',   48.75, 'Lunch with Colleagues', y || '-' || mo || '-22', false, null),
      (checking_id, entertainment_id, 'expense',   12.99, 'Spotify Subscription',  y || '-' || mo || '-25', true,  'monthly'),
      (checking_id, shopping_id,      'expense',   67.40, 'Clothing Store',        y || '-' || mo || '-27', false, null);
  END LOOP;
END $$;

-- Budgets (current month)
INSERT INTO budgets (category_id, amount, month, year, alert_threshold)
SELECT c.id, b.amount, EXTRACT(MONTH FROM NOW())::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER, b.threshold
FROM (VALUES
  ('Food & Dining',  600.00, 80),
  ('Transportation', 300.00, 80),
  ('Shopping',       400.00, 75),
  ('Entertainment',  150.00, 85),
  ('Healthcare',     200.00, 80),
  ('Utilities',      250.00, 80)
) AS b(name, amount, threshold)
JOIN categories c ON c.name = b.name
ON CONFLICT (category_id, month, year) DO NOTHING;

-- Goals
INSERT INTO goals (name, target_amount, current_amount, target_date, color, icon, description, status) VALUES
  ('Emergency Fund',     20000.00, 12500.00, '2025-12-31', '#3ecf8e', 'shield', '6 months of expenses', 'active'),
  ('Vacation to Europe',  5000.00,  1800.00, '2025-08-01', '#22d3ee', 'plane',  'Summer vacation',      'active'),
  ('New MacBook Pro',     3500.00,  3500.00, '2024-06-01', '#a78bfa', 'laptop', 'For work',             'completed'),
  ('Home Down Payment',  50000.00, 15000.00, '2027-01-01', '#f59e0b', 'home',   '20% down on a home',  'active')
ON CONFLICT DO NOTHING;
