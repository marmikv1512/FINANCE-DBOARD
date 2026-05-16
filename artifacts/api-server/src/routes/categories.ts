import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable, insertCategorySchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(categories.map(formatCategory));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = insertCategorySchema.parse(req.body);
    const [category] = await db.insert(categoriesTable).values(data).returning();
    res.status(201).json(formatCategory(category));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid category data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertCategorySchema.parse(req.body);
    const [category] = await db
      .update(categoriesTable)
      .set(data)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(formatCategory(category));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid category data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ message: "Category deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    icon: c.icon,
    parentId: c.parentId,
    isDefault: c.isDefault,
    createdAt: c.createdAt.toISOString(),
  };
}

export default router;
