import { Router } from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getShopSettings, Settings } from "../models/Settings.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Expense } from "../models/Expense.js";
import { Sale } from "../models/Sale.js";
import { Repair } from "../models/Repair.js";
import { User } from "../models/User.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res, next) => {
  try {
    const settings = await getShopSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.put("/", requireAdmin, async (req, res, next) => {
  try {
    const update: Record<string, unknown> = {
      shopName: req.body.shopName,
      address: req.body.address,
      phone: req.body.phone,
      defaultMinimumStock: Number(req.body.defaultMinimumStock ?? 5)
    };
    if (Array.isArray(req.body.productColors)) {
      update.productColors = req.body.productColors.map((c: string) => String(c).trim()).filter(Boolean);
    }
    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.post("/colors", requireAdmin, async (req, res, next) => {
  try {
    const color = String(req.body.color || "").trim();
    if (!color) return res.status(400).json({ message: "Color name required" });
    const settings = await getShopSettings();
    if (!settings.productColors.includes(color)) {
      settings.productColors.push(color);
      await settings.save();
    }
    res.json({ productColors: settings.productColors });
  } catch (err) {
    next(err);
  }
});

router.get("/backup", requireAdmin, async (_req, res, next) => {
  try {
    const [settings, inventory, sales, expenses, repairs, users] = await Promise.all([
      Settings.findOne().lean(),
      InventoryItem.find().lean(),
      Sale.find().lean(),
      Expense.find().lean(),
      Repair.find().lean(),
      User.find().select("-password -otpCode").lean()
    ]);
    res.json({
      exportedAt: new Date().toISOString(),
      settings,
      inventory,
      sales,
      expenses,
      repairs,
      users
    });
  } catch (err) {
    next(err);
  }
});

export default router;
