import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable, insertTransactionSchema } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { accountId, categoryId, type, startDate, endDate, search, limit = 50, offset = 0 } = req.query;

    const conditions = [];

    if (accountId) conditions.push(eq(transactionsTable.accountId, parseInt(accountId as string)));
    if (categoryId) conditions.push(eq(transactionsTable.categoryId, parseInt(categoryId as string)));
    if (type) conditions.push(eq(transactionsTable.type, type as "income" | "expense" | "transfer"));
    if (startDate) conditions.push(gte(transactionsTable.date, startDate as string));
    if (endDate) conditions.push(lte(transactionsTable.date, endDate as string));
    if (search) conditions.push(ilike(transactionsTable.description, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: transactionsTable.id,
          accountId: transactionsTable.accountId,
          categoryId: transactionsTable.categoryId,
          type: transactionsTable.type,
          amount: transactionsTable.amount,
          description: transactionsTable.description,
          notes: transactionsTable.notes,
          date: transactionsTable.date,
          isRecurring: transactionsTable.isRecurring,
          recurringInterval: transactionsTable.recurringInterval,
          tags: transactionsTable.tags,
          createdAt: transactionsTable.createdAt,
          updatedAt: transactionsTable.updatedAt,
          account: {
            id: accountsTable.id,
            name: accountsTable.name,
            type: accountsTable.type,
            balance: accountsTable.balance,
            currency: accountsTable.currency,
            color: accountsTable.color,
            icon: accountsTable.icon,
            institution: accountsTable.institution,
            isActive: accountsTable.isActive,
            createdAt: accountsTable.createdAt,
            updatedAt: accountsTable.updatedAt,
          },
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
        .from(transactionsTable)
        .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
        .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
        .where(whereClause)
        .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactionsTable)
        .where(whereClause),
    ]);

    res.json({
      data: data.map(formatTransaction),
      total: Number(countResult[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [tx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id));
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(formatBasicTransaction(tx));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertTransactionSchema.parse(req.body);
    const [tx] = await db.insert(transactionsTable).values(data).returning();

    // Update account balance
    const account = await db.select().from(accountsTable).where(eq(accountsTable.id, tx.accountId)).then(r => r[0]);
    if (account) {
      const delta = data.type === "income" ? parseFloat(tx.amount) : -parseFloat(tx.amount);
      await db.update(accountsTable)
        .set({ balance: String(parseFloat(account.balance) + delta), updatedAt: new Date() })
        .where(eq(accountsTable.id, tx.accountId));
    }

    res.status(201).json(formatBasicTransaction(tx));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid transaction data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertTransactionSchema.parse(req.body);

    // Get old transaction to reverse balance effect
    const [old] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!old) return res.status(404).json({ error: "Transaction not found" });

    const [tx] = await db
      .update(transactionsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transactionsTable.id, id))
      .returning();

    // Reverse old balance change, apply new
    const account = await db.select().from(accountsTable).where(eq(accountsTable.id, old.accountId)).then(r => r[0]);
    if (account) {
      const oldDelta = old.type === "income" ? parseFloat(old.amount) : -parseFloat(old.amount);
      const newDelta = data.type === "income" ? parseFloat(tx.amount) : -parseFloat(tx.amount);
      const newBalance = parseFloat(account.balance) - oldDelta + newDelta;
      await db.update(accountsTable)
        .set({ balance: String(newBalance), updatedAt: new Date() })
        .where(eq(accountsTable.id, old.accountId));
    }

    res.json(formatBasicTransaction(tx));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid transaction data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [old] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!old) return res.status(404).json({ error: "Transaction not found" });

    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));

    // Reverse the balance effect
    const account = await db.select().from(accountsTable).where(eq(accountsTable.id, old.accountId)).then(r => r[0]);
    if (account) {
      const delta = old.type === "income" ? -parseFloat(old.amount) : parseFloat(old.amount);
      await db.update(accountsTable)
        .set({ balance: String(parseFloat(account.balance) + delta), updatedAt: new Date() })
        .where(eq(accountsTable.id, old.accountId));
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

function formatBasicTransaction(tx: typeof transactionsTable.$inferSelect) {
  return {
    id: tx.id,
    accountId: tx.accountId,
    categoryId: tx.categoryId,
    type: tx.type,
    amount: parseFloat(tx.amount),
    description: tx.description,
    notes: tx.notes,
    date: tx.date,
    isRecurring: tx.isRecurring,
    recurringInterval: tx.recurringInterval,
    tags: tx.tags,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

function formatTransaction(tx: any) {
  return {
    id: tx.id,
    accountId: tx.accountId,
    categoryId: tx.categoryId,
    type: tx.type,
    amount: parseFloat(tx.amount),
    description: tx.description,
    notes: tx.notes,
    date: tx.date,
    isRecurring: tx.isRecurring,
    recurringInterval: tx.recurringInterval,
    tags: tx.tags,
    createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
    updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : tx.updatedAt,
    account: tx.account ? {
      id: tx.account.id,
      name: tx.account.name,
      type: tx.account.type,
      balance: parseFloat(tx.account.balance),
      currency: tx.account.currency,
      color: tx.account.color,
      icon: tx.account.icon,
      institution: tx.account.institution,
      isActive: tx.account.isActive,
      createdAt: tx.account.createdAt instanceof Date ? tx.account.createdAt.toISOString() : tx.account.createdAt,
      updatedAt: tx.account.updatedAt instanceof Date ? tx.account.updatedAt.toISOString() : tx.account.updatedAt,
    } : undefined,
    category: tx.category && tx.category.id ? {
      id: tx.category.id,
      name: tx.category.name,
      type: tx.category.type,
      color: tx.category.color,
      icon: tx.category.icon,
      parentId: tx.category.parentId,
      isDefault: tx.category.isDefault,
      createdAt: tx.category.createdAt instanceof Date ? tx.category.createdAt.toISOString() : tx.category.createdAt,
    } : undefined,
  };
}

export default router;
