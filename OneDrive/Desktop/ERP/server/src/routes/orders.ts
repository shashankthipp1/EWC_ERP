import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { OrderList } from "../models/OrderList.js";
import { Supplier } from "../models/Supplier.js";
import { nextNumber } from "../utils/numbers.js";
import { normalizeOrderItem, productDisplayLabel } from "../utils/productFields.js";
import { serializeOrder } from "../utils/orderSerialize.js";

const router = Router();
router.use(protect);

router.get("/reorder-suggestions", async (_req, res, next) => {
  try {
    const items = await InventoryItem.find().sort({ updatedAt: -1 }).limit(500);
    const suggestions = items
      .filter((item) => item.currentStock <= item.minimumStock)
      .map((item) => ({
        inventoryItem: item.id,
        category: item.category,
        product: productDisplayLabel({
          category: item.category,
          brand: item.brand,
          modelNumber: item.modelNumber,
          colorVariant: item.colorVariant,
          batteryType: item.batteryType,
          accessoryType: item.accessoryType,
          strapType: item.strapType,
          watchDisplay: item.watchDisplay
        }),
        currentStock: item.currentStock,
        threshold: item.minimumStock,
        suggestedQuantity: Math.max(5, item.minimumStock * 3 - item.currentStock),
        estimatedCost: item.purchasePrice * Math.max(5, item.minimumStock * 3 - item.currentStock)
      }));
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

router.get("/suppliers", async (_req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 }).limit(300);
    res.json({ suppliers });
  } catch (err) {
    next(err);
  }
});

router.post("/suppliers", async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate({ name: req.body.name }, req.body, { upsert: true, new: true, runValidators: true });
    res.status(201).json({ supplier });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const orders = await OrderList.find().sort({ createdAt: -1 }).limit(200);
    res.json({ orders: orders.map((o) => serializeOrder(o)) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await OrderList.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const items = (req.body.items || []).map((item: Record<string, unknown>) => normalizeOrderItem(item));
    if (!items.length) return res.status(400).json({ message: "Add at least one item to the order list" });

    const totalEstimatedCost = items.reduce(
      (sum: number, item: { quantity: number; data: { purchasePrice?: number } }) =>
        sum + item.quantity * Number(item.data.purchasePrice || 0),
      0
    );
    const order = await OrderList.create({
      orderNumber: nextNumber("ORD"),
      status: req.body.status || "Draft",
      expectedDate: req.body.expectedDate,
      totalEstimatedCost,
      notes: req.body.notes,
      items,
      createdBy: req.user?.id
    });
    res.status(201).json({ order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await OrderList.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found" });

    const update: Record<string, unknown> = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.notes !== undefined) update.notes = req.body.notes;
    if (req.body.expectedDate !== undefined) update.expectedDate = req.body.expectedDate;

    if (Array.isArray(req.body.items)) {
      const items = req.body.items.map((item: Record<string, unknown>) => normalizeOrderItem(item));
      if (!items.length) return res.status(400).json({ message: "Order must have at least one item" });
      update.items = items;
      update.totalEstimatedCost = items.reduce(
        (sum: number, item: { quantity: number; data: { purchasePrice?: number } }) =>
          sum + item.quantity * Number(item.data.purchasePrice || 0),
        0
      );
    }

    const order = await OrderList.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    res.json({ order: serializeOrder(order!) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const order = await OrderList.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order list deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
