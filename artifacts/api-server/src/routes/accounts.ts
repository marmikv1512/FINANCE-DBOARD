import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { accountsTable, insertAccountSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.isActive, true))
      .orderBy(accountsTable.name);
    res.json(accounts.map(formatAccount));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(formatAccount(account));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertAccountSchema.parse(req.body);
    const [account] = await db.insert(accountsTable).values(data).returning();
    res.status(201).json(formatAccount(account));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid account data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertAccountSchema.parse(req.body);
    const [account] = await db
      .update(accountsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accountsTable.id, id))
      .returning();
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(formatAccount(account));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid account data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(accountsTable).set({ isActive: false }).where(eq(accountsTable.id, id));
    res.json({ message: "Account deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

function formatAccount(a: typeof accountsTable.$inferSelect) {
  return {
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
  };
}

export default router;
