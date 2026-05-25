import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { buildAnalytics } from "../services/analytics.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res, next) => {
  try {
    const analytics = await buildAnalytics();
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

export default router;
