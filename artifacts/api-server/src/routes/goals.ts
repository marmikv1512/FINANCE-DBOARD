import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable, insertGoalSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
    res.json(goals.map(formatGoal));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertGoalSchema.parse(req.body);
    const [goal] = await db.insert(goalsTable).values(data).returning();
    res.status(201).json(formatGoal(goal));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid goal data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertGoalSchema.parse(req.body);
    const [goal] = await db
      .update(goalsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goalsTable.id, id))
      .returning();
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(formatGoal(goal));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid goal data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(goalsTable).where(eq(goalsTable.id, id));
    res.json({ message: "Goal deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

function formatGoal(g: typeof goalsTable.$inferSelect) {
  return {
    id: g.id,
    name: g.name,
    targetAmount: parseFloat(g.targetAmount),
    currentAmount: parseFloat(g.currentAmount),
    targetDate: g.targetDate,
    color: g.color,
    icon: g.icon,
    description: g.description,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export default router;
