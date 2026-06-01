import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { getShopSettings } from "../models/Settings.js";
import { PRODUCT_CATEGORIES } from "../utils/categories.js";
import { parseProductBody, validateProductPayload } from "../utils/productFields.js";
import { serializeInventoryItem, serializeInventoryList } from "../utils/serializeInventory.js";

const router = Router();
const SORT_FIELDS = new Set(["currentStock", "sellingPrice", "purchasePrice", "category", "brand", "createdAt", "mrp"]);
const writeRoles = requireRole("admin", "manager");

router.get("/meta", protect, async (_req, res, next) => {
  try {
    const settings = await getShopSettings();
    res.json({ categories: PRODUCT_CATEGORIES, productColors: settings.productColors || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/", protect, async (req, res, next) => {
  try {
    const {
      category,
      brand,
      modelNumber,
      colorVariant,
      q,
      lowStock,
      sortBy = "updatedAt",
      sortOrder = "desc",
      page = "1",
      limit = "20"
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = String(category);
    if (brand) filter.brand = new RegExp(String(brand).trim(), "i");
    if (modelNumber) filter.modelNumber = new RegExp(String(modelNumber).trim(), "i");
    if (colorVariant) filter.colorVariant = new RegExp(String(colorVariant).trim(), "i");
    if (q) {
      const s = String(q).trim();
      if (s) {
        filter.$or = [
          { brand: new RegExp(s, "i") },
          { modelNumber: new RegExp(s, "i") },
          { colorVariant: new RegExp(s, "i") },
          { accessoryType: new RegExp(s, "i") },
          { batteryType: new RegExp(s, "i") },
          { category: new RegExp(s, "i") },
          { productId: new RegExp(s, "i") }
        ];
      }
    }
    if (lowStock === "true") filter.$expr = { $lte: ["$currentStock", "$minimumStock"] };

    const sortField = SORT_FIELDS.has(String(sortBy)) ? String(sortBy) : "updatedAt";
    const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      InventoryItem.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum),
      InventoryItem.countDocuments(filter)
    ]);

    res.json({
      items: serializeInventoryList(items, req.user?.role),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
});

router.get("/low-stock", protect, async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ $expr: { $lte: ["$currentStock", "$minimumStock"] } })
      .sort({ currentStock: 1 })
      .limit(50);
    res.json({ items: serializeInventoryList(items, req.user?.role) });
  } catch (err) {
    next(err);
  }
});

router.post("/", protect, writeRoles, async (req, res, next) => {
  try {
    const settings = await getShopSettings();
    const data = parseProductBody(req.body);
    const errors = validateProductPayload(data, settings.productColors);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });

    const item = await InventoryItem.create({ ...data, createdBy: req.user?.id });
    res.status(201).json({ item: serializeInventoryItem(item, req.user?.role) });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return res.status(409).json({ message: "A product with the same identity already exists" });
    }
    next(err);
  }
});

router.put("/:id", protect, writeRoles, async (req, res, next) => {
  try {
    const settings = await getShopSettings();
    const data = parseProductBody(req.body);
    const errors = validateProductPayload(data, settings.productColors);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });

    Object.assign(item, data);
    await item.save();
    res.json({ item: serializeInventoryItem(item, req.user?.role) });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return res.status(409).json({ message: "A product with the same identity already exists" });
    }
    next(err);
  }
});

router.patch("/bulk-stock", protect, writeRoles, async (req, res, next) => {
  try {
    const updates = (req.body.updates || []) as { id: string; addQuantity: number }[];
    if (!updates.length) return res.status(400).json({ message: "No stock updates provided" });

    const results = [];
    for (const row of updates) {
      const addQty = Number(row.addQuantity);
      if (!row.id || addQty <= 0) continue;
      const item = await InventoryItem.findByIdAndUpdate(row.id, { $inc: { currentStock: addQty } }, { new: true });
      if (item) results.push(serializeInventoryItem(item, req.user?.role));
    }
    res.json({ updated: results.length, items: results });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/stock", protect, writeRoles, async (req, res, next) => {
  try {
    const currentStock = Number(req.body.currentStock);
    if (Number.isNaN(currentStock) || currentStock < 0) {
      return res.status(400).json({ message: "Enter a valid quantity (0 or more)" });
    }
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });
    item.currentStock = currentStock;
    await item.save();
    res.json({ item: serializeInventoryItem(item, req.user?.role) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", protect, writeRoles, async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
