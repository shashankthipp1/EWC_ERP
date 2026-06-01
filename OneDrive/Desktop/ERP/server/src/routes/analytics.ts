import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { buildAnalytics } from "../services/analytics.js";
import { canViewCost } from "../utils/roles.js";
import { stripProfitFromAnalytics } from "../utils/serializeInventory.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const analytics = await buildAnalytics();
    const payload = canViewCost(req.user?.role) ? analytics : stripProfitFromAnalytics(analytics);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
