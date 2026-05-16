import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { accountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["checking", "savings", "credit", "investment", "loan", "cash", "other"]).default("checking"),
  balance: z.coerce.number().default(0),
  currency: z.string().default("USD"),
  color: z.string().default("#3ecf8e"),
  icon: z.string().default("wallet"),
  institution: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

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
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    }
    const data = parsed.data;
    const [account] = await db.insert(accountsTable).values({
      name: data.name,
      type: data.type,
      balance: String(data.balance),
      currency: data.currency,
      color: data.color,
      icon: data.icon,
      institution: data.institution ?? null,
      isActive: data.isActive,
    }).returning();
    res.status(201).json(formatAccount(account));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    }
    const data = parsed.data;
    const [account] = await db
      .update(accountsTable)
      .set({
        name: data.name,
        type: data.type,
        balance: String(data.balance),
        currency: data.currency,
        color: data.color,
        icon: data.icon,
        institution: data.institution ?? null,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(accountsTable.id, id))
      .returning();
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(formatAccount(account));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update account" });
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
