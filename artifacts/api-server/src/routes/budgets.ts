import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { budgetsTable, categoriesTable, transactionsTable, insertBudgetSchema } from "@workspace/db/schema";
import { eq, and, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const budgets = await db
      .select({
        id: budgetsTable.id,
        categoryId: budgetsTable.categoryId,
        amount: budgetsTable.amount,
        month: budgetsTable.month,
        year: budgetsTable.year,
        alertThreshold: budgetsTable.alertThreshold,
        createdAt: budgetsTable.createdAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          type: categoriesTable.type,
          color: categoriesTable.color,
          icon: categoriesTable.icon,
          parentId: categoriesTable.parentId,
          isDefault: categoriesTable.isDefault,
          createdAt: categoriesTable.createdAt,
        },
      })
      .from(budgetsTable)
      .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
      .where(and(eq(budgetsTable.month, month), eq(budgetsTable.year, year)));

    // Calculate spent for each budget
    const results = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

        const [spentResult] = await db
          .select({ total: sum(transactionsTable.amount) })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.categoryId, budget.categoryId),
              eq(transactionsTable.type, "expense"),
              sql`${transactionsTable.date} >= ${startDate}`,
              sql`${transactionsTable.date} <= ${endDate}`
            )
          );

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          amount: parseFloat(budget.amount),
          spent: parseFloat(spentResult.total || "0"),
          month: budget.month,
          year: budget.year,
          alertThreshold: budget.alertThreshold ? parseFloat(budget.alertThreshold) : 80,
          createdAt: budget.createdAt.toISOString(),
          category: budget.category && budget.category.id ? {
            id: budget.category.id,
            name: budget.category.name,
            type: budget.category.type,
            color: budget.category.color,
            icon: budget.category.icon,
            parentId: budget.category.parentId,
            isDefault: budget.category.isDefault,
            createdAt: budget.category.createdAt instanceof Date ? budget.category.createdAt.toISOString() : budget.category.createdAt,
          } : undefined,
        };
      })
    );

    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertBudgetSchema.parse(req.body);
    const [budget] = await db.insert(budgetsTable).values(data).returning();

    res.status(201).json({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: parseFloat(budget.amount),
      spent: 0,
      month: budget.month,
      year: budget.year,
      alertThreshold: budget.alertThreshold ? parseFloat(budget.alertThreshold) : 80,
      createdAt: budget.createdAt.toISOString(),
    });
  } catch (err: any) {
    req.log.error(err);

    res.status(400).json({
      error: "Invalid budget data",
      details: err?.issues || err?.message || err,
      body: req.body,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertBudgetSchema.parse(req.body);
    const [budget] = await db
      .update(budgetsTable)
      .set(data)
      .where(eq(budgetsTable.id, id))
      .returning();
    if (!budget) return res.status(404).json({ error: "Budget not found" });
    res.json({
      id: budget.id,
      categoryId: budget.categoryId,
      amount: parseFloat(budget.amount),
      spent: 0,
      month: budget.month,
      year: budget.year,
      alertThreshold: budget.alertThreshold ? parseFloat(budget.alertThreshold) : 80,
      createdAt: budget.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid budget data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
    res.json({ message: "Budget deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

export default router;
