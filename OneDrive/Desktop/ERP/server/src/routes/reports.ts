import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { buildDailyReport, buildReportHistory, parseReportDate } from "../services/dailyReport.js";

const router = Router();
router.use(protect);

router.get("/history", async (_req, res, next) => {
  try {
    const history = await buildReportHistory();
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

router.get("/daily", async (req, res, next) => {
  try {
    const date = parseReportDate(typeof req.query.date === "string" ? req.query.date : undefined);
    const report = await buildDailyReport(date);
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Invalid date")) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

export default router;
