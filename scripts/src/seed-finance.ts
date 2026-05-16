import { db } from "@workspace/db";
import {
  accountsTable, categoriesTable, transactionsTable, budgetsTable, goalsTable
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding finance tracker data...");

  // Seed categories
  const categoryData = [
    { name: "Salary", type: "income" as const, color: "#3ecf8e", icon: "briefcase", isDefault: true },
    { name: "Freelance", type: "income" as const, color: "#22d3ee", icon: "laptop", isDefault: true },
    { name: "Investments", type: "income" as const, color: "#a78bfa", icon: "trending-up", isDefault: true },
    { name: "Food & Dining", type: "expense" as const, color: "#f59e0b", icon: "utensils", isDefault: true },
    { name: "Transportation", type: "expense" as const, color: "#3b82f6", icon: "car", isDefault: true },
    { name: "Shopping", type: "expense" as const, color: "#ec4899", icon: "shopping-bag", isDefault: true },
    { name: "Housing", type: "expense" as const, color: "#8b5cf6", icon: "home", isDefault: true },
    { name: "Entertainment", type: "expense" as const, color: "#f97316", icon: "tv", isDefault: true },
    { name: "Healthcare", type: "expense" as const, color: "#ef4444", icon: "heart", isDefault: true },
    { name: "Utilities", type: "expense" as const, color: "#14b8a6", icon: "zap", isDefault: true },
    { name: "Education", type: "expense" as const, color: "#6366f1", icon: "book", isDefault: true },
    { name: "Travel", type: "expense" as const, color: "#84cc16", icon: "plane", isDefault: true },
  ];

  const existingCategories = await db.select().from(categoriesTable);
  let categories = existingCategories;
  if (existingCategories.length === 0) {
    categories = await db.insert(categoriesTable).values(categoryData).returning();
    console.log(`Created ${categories.length} categories`);
  } else {
    console.log("Categories already exist, skipping...");
  }

  // Seed accounts
  const existingAccounts = await db.select().from(accountsTable);
  let accounts = existingAccounts;
  if (existingAccounts.length === 0) {
    accounts = await db.insert(accountsTable).values([
      { name: "Main Checking", type: "checking", balance: "4250.75", currency: "USD", color: "#3ecf8e", icon: "credit-card", institution: "Chase Bank" },
      { name: "Emergency Savings", type: "savings", balance: "12500.00", currency: "USD", color: "#22d3ee", icon: "shield", institution: "Ally Bank" },
      { name: "Investment Portfolio", type: "investment", balance: "45800.50", currency: "USD", color: "#a78bfa", icon: "trending-up", institution: "Fidelity" },
      { name: "Credit Card", type: "credit", balance: "-1250.00", currency: "USD", color: "#ef4444", icon: "credit-card", institution: "Chase" },
    ]).returning();
    console.log(`Created ${accounts.length} accounts`);
  } else {
    console.log("Accounts already exist, skipping...");
  }

  // Map categories and accounts
  const catMap: Record<string, number> = {};
  const finalCats = await db.select().from(categoriesTable);
  finalCats.forEach(c => { catMap[c.name] = c.id; });

  const finalAccounts = await db.select().from(accountsTable);
  const checkingId = finalAccounts.find(a => a.type === "checking")?.id || finalAccounts[0]?.id;

  // Seed transactions
  const existingTx = await db.select().from(transactionsTable);
  if (existingTx.length === 0 && checkingId) {
    const now = new Date();
    const txData = [];

    for (let i = 0; i < 3; i++) {
      const month = now.getMonth() - i;
      const year = month < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = ((month % 12) + 12) % 12;

      const pad = (n: number) => String(n + 1).padStart(2, "0");

      txData.push(
        { accountId: checkingId, categoryId: catMap["Salary"], type: "income" as const, amount: "5500.00", description: "Monthly Salary", date: `${year}-${pad(adjustedMonth)}-01`, isRecurring: true, recurringInterval: "monthly" },
        { accountId: checkingId, categoryId: catMap["Food & Dining"], type: "expense" as const, amount: "85.50", description: "Grocery Shopping", date: `${year}-${pad(adjustedMonth)}-03`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Transportation"], type: "expense" as const, amount: "45.00", description: "Gas Station", date: `${year}-${pad(adjustedMonth)}-05`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Food & Dining"], type: "expense" as const, amount: "62.30", description: "Restaurant Dinner", date: `${year}-${pad(adjustedMonth)}-07`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Shopping"], type: "expense" as const, amount: "120.00", description: "Amazon Purchase", date: `${year}-${pad(adjustedMonth)}-10`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Utilities"], type: "expense" as const, amount: "95.00", description: "Electric Bill", date: `${year}-${pad(adjustedMonth)}-12`, isRecurring: true, recurringInterval: "monthly" },
        { accountId: checkingId, categoryId: catMap["Entertainment"], type: "expense" as const, amount: "15.99", description: "Netflix Subscription", date: `${year}-${pad(adjustedMonth)}-15`, isRecurring: true, recurringInterval: "monthly" },
        { accountId: checkingId, categoryId: catMap["Freelance"], type: "income" as const, amount: "800.00", description: "Freelance Project", date: `${year}-${pad(adjustedMonth)}-18`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Healthcare"], type: "expense" as const, amount: "35.00", description: "Pharmacy", date: `${year}-${pad(adjustedMonth)}-20`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Food & Dining"], type: "expense" as const, amount: "48.75", description: "Lunch with Colleagues", date: `${year}-${pad(adjustedMonth)}-22`, isRecurring: false },
        { accountId: checkingId, categoryId: catMap["Housing"], type: "expense" as const, amount: "1500.00", description: "Rent Payment", date: `${year}-${pad(adjustedMonth)}-01`, isRecurring: true, recurringInterval: "monthly" },
        { accountId: checkingId, categoryId: catMap["Transportation"], type: "expense" as const, amount: "89.00", description: "Monthly Bus Pass", date: `${year}-${pad(adjustedMonth)}-01`, isRecurring: true, recurringInterval: "monthly" },
      );
    }

    await db.insert(transactionsTable).values(txData);
    console.log(`Created ${txData.length} transactions`);
  } else {
    console.log("Transactions already exist, skipping...");
  }

  // Seed budgets for current month
  const existingBudgets = await db.select().from(budgetsTable);
  if (existingBudgets.length === 0) {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    await db.insert(budgetsTable).values([
      { categoryId: catMap["Food & Dining"], amount: "600.00", month, year, alertThreshold: "80" },
      { categoryId: catMap["Transportation"], amount: "300.00", month, year, alertThreshold: "80" },
      { categoryId: catMap["Shopping"], amount: "400.00", month, year, alertThreshold: "75" },
      { categoryId: catMap["Entertainment"], amount: "150.00", month, year, alertThreshold: "85" },
      { categoryId: catMap["Healthcare"], amount: "200.00", month, year, alertThreshold: "80" },
      { categoryId: catMap["Utilities"], amount: "250.00", month, year, alertThreshold: "80" },
    ]);
    console.log("Created 6 budgets");
  } else {
    console.log("Budgets already exist, skipping...");
  }

  // Seed goals
  const existingGoals = await db.select().from(goalsTable);
  if (existingGoals.length === 0) {
    await db.insert(goalsTable).values([
      { name: "Emergency Fund", targetAmount: "20000.00", currentAmount: "12500.00", targetDate: "2025-12-31", color: "#3ecf8e", icon: "shield", description: "6 months of expenses", status: "active" },
      { name: "Vacation to Europe", targetAmount: "5000.00", currentAmount: "1800.00", targetDate: "2025-08-01", color: "#22d3ee", icon: "plane", description: "Summer vacation", status: "active" },
      { name: "New MacBook Pro", targetAmount: "3500.00", currentAmount: "3500.00", targetDate: "2024-06-01", color: "#a78bfa", icon: "laptop", description: "For work and creativity", status: "completed" },
      { name: "Home Down Payment", targetAmount: "50000.00", currentAmount: "15000.00", targetDate: "2027-01-01", color: "#f59e0b", icon: "home", description: "20% down on a home", status: "active" },
    ]);
    console.log("Created 4 goals");
  } else {
    console.log("Goals already exist, skipping...");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
