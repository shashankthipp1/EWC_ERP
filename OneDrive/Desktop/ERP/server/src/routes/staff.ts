import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { DeviceSession } from "../models/DeviceSession.js";
import { Expense } from "../models/Expense.js";
import { Repair } from "../models/Repair.js";
import { Sale } from "../models/Sale.js";
import { User } from "../models/User.js";

const router = Router();
router.use(protect);

router.get("/", requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const users = await User.find().sort({ updatedAt: -1 }).limit(200);
    const staff = await Promise.all(users.map(async (user) => {
      const [salesCount, repairCount, expenseCount, activeSessions] = await Promise.all([
        Sale.countDocuments({ createdBy: user.id }),
        Repair.countDocuments({ createdBy: user.id }),
        Expense.countDocuments({ createdBy: user.id }),
        DeviceSession.countDocuments({ user: user.id, revokedAt: { $exists: false } })
      ]);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        salesCount,
        repairCount,
        expenseCount,
        activeSessions
      };
    }));
    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

router.get("/sessions", async (req, res, next) => {
  try {
    const filter = req.user?.role === "admin" ? {} : { user: req.user?.id };
    const sessions = await DeviceSession.find(filter).populate("user", "name email role").sort({ lastActiveAt: -1 }).limit(200);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

router.delete("/sessions/:id", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const session = await DeviceSession.findByIdAndUpdate(req.params.id, { revokedAt: new Date() }, { new: true });
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

export default router;
