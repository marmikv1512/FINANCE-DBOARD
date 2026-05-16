import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import categoriesRouter from "./categories";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import goalsRouter from "./goals";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/accounts", accountsRouter);
router.use("/categories", categoriesRouter);
router.use("/transactions", transactionsRouter);
router.use("/budgets", budgetsRouter);
router.use("/goals", goalsRouter);
router.use("/analytics", analyticsRouter);

export default router;
