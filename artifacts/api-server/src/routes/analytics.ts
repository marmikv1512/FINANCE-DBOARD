import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, sum, count, sql, desc, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const [incomeResult] = await db
      .select({ total: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "income"),
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`
        )
      );

    const [expenseResult] = await db
      .select({ total: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "expense"),
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`
        )
      );

    const [txCount] = await db
      .select({ cnt: count() })
      .from(transactionsTable)
      .where(
        and(
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`
        )
      );

    const totalIncome = parseFloat(incomeResult.total || "0");
    const totalExpenses = parseFloat(expenseResult.total || "0");
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Top spending category
    const [topCat] = await db
      .select({
        name: categoriesTable.name,
        total: sum(transactionsTable.amount),
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.type, "expense"),
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`
        )
      )
      .groupBy(categoriesTable.name)
      .orderBy(desc(sum(transactionsTable.amount)))
      .limit(1);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    res.json({
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      transactionCount: Number(txCount.cnt),
      topCategory: topCat?.name || null,
      periodLabel: `${monthNames[month - 1]} ${year}`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

router.get("/spending-by-category", async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const spending = await db
      .select({
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
        color: categoriesTable.color,
        icon: categoriesTable.icon,
        amount: sum(transactionsTable.amount),
        transactionCount: count(),
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.type, "expense"),
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`
        )
      )
      .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.color, categoriesTable.icon)
      .orderBy(desc(sum(transactionsTable.amount)));

    const total = spending.reduce((acc, s) => acc + parseFloat(s.amount || "0"), 0);

    res.json(
      spending.map((s) => ({
        categoryId: s.categoryId || 0,
        categoryName: s.categoryName || "Uncategorized",
        color: s.color || "#6b7280",
        icon: s.icon || "tag",
        amount: parseFloat(s.amount || "0"),
        percentage: total > 0 ? Math.round((parseFloat(s.amount || "0") / total) * 10000) / 100 : 0,
        transactionCount: Number(s.transactionCount),
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch spending by category" });
  }
});

router.get("/monthly-trends", async (req, res) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate = `${y}-${String(m).padStart(2, "0")}-31`;

      const [income] = await db
        .select({ total: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.type, "income"),
            sql`${transactionsTable.date} >= ${startDate}`,
            sql`${transactionsTable.date} <= ${endDate}`
          )
        );

      const [expenses] = await db
        .select({ total: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.type, "expense"),
            sql`${transactionsTable.date} >= ${startDate}`,
            sql`${transactionsTable.date} <= ${endDate}`
          )
        );

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const inc = parseFloat(income.total || "0");
      const exp = parseFloat(expenses.total || "0");

      result.push({
        month: `${monthNames[m - 1]} ${y}`,
        income: inc,
        expenses: exp,
        savings: inc - exp,
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch monthly trends" });
  }
});

router.get("/net-worth", async (req, res) => {
  try {
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.isActive, true));

    const assets = accounts.filter(a => ["checking", "savings", "investment", "cash"].includes(a.type));
    const liabilities = accounts.filter(a => ["credit", "loan"].includes(a.type));

    const totalAssets = assets.reduce((acc, a) => acc + parseFloat(a.balance), 0);
    const totalLiabilities = liabilities.reduce((acc, a) => acc + Math.abs(parseFloat(a.balance)), 0);

    res.json({
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance),
        currency: a.currency,
        color: a.color,
        icon: a.icon,
        institution: a.institution,
        isActive: a.isActive,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch net worth" });
  }
});

export default router;
