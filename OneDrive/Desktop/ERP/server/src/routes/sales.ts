import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Customer } from "../models/Customer.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Sale } from "../models/Sale.js";
import { canViewCost } from "../utils/roles.js";
import { nextNumber } from "../utils/numbers.js";

const router = Router();
router.use(protect);

function stripSaleForRole(sale: { toObject?: () => Record<string, unknown> }, role?: string) {
  const raw = typeof sale.toObject === "function" ? sale.toObject() : ({ ...(sale as object) } as Record<string, unknown>);
  if (canViewCost(role)) return raw;
  if (Array.isArray(raw.items)) {
    raw.items = raw.items.map((line: Record<string, unknown>) => {
      const { purchasePrice: _p, ...rest } = line;
      return rest;
    });
  }
  return raw;
}

router.get("/", async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate("customer")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json({ sales: sales.map((s) => stripSaleForRole(s, req.user?.role)) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const customer = req.body.customer?.phone
      ? await Customer.findOneAndUpdate({ phone: req.body.customer.phone }, req.body.customer, { upsert: true, new: true })
      : undefined;

    const saleItems = [];
    let subtotal = 0;
    let gstAmount = 0;
    let grossProfit = 0;

    for (const item of req.body.items || []) {
      const inventory = await InventoryItem.findById(item.inventoryItem);
      if (!inventory) return res.status(404).json({ message: "Product not found" });
      if (inventory.currentStock < Number(item.quantity)) {
        return res.status(400).json({ message: `${inventory.brand} has insufficient stock` });
      }

      const sellingPrice = Number(item.sellingPrice ?? inventory.sellingPrice ?? 0);
      const purchasePrice = Number(inventory.purchasePrice ?? 0);
      const lineBase = sellingPrice * Number(item.quantity);
      const lineGst = lineBase * (Number(item.gstRate || 0) / 100);
      const lineTotal = lineBase + lineGst;
      subtotal += lineBase;
      gstAmount += lineGst;
      grossProfit += (sellingPrice - purchasePrice) * Number(item.quantity);
      inventory.currentStock -= Number(item.quantity);
      await inventory.save();

      saleItems.push({
        inventoryItem: inventory.id,
        category: inventory.category,
        description: item.description || [inventory.brand, inventory.modelNumber, inventory.colorVariant].filter(Boolean).join(" "),
        quantity: Number(item.quantity),
        purchasePrice,
        sellingPrice,
        discount: 0,
        gstRate: Number(item.gstRate || 0),
        total: lineTotal
      });
    }

    const billDiscount = Math.max(0, Number(req.body.discount || 0));
    const billGstPercent = Number(req.body.gstPercent || 0);
    if (billGstPercent > 0 && gstAmount === 0) {
      gstAmount = subtotal * (billGstPercent / 100);
    }
    const totalAmount = Math.max(0, subtotal + gstAmount - billDiscount);
    const paidAmount = Number(req.body.paidAmount ?? totalAmount);
    const paymentMethod = req.body.paymentMethod || "Cash";

    if (paymentMethod === "Mixed") {
      const b = req.body.paymentBreakdown || {};
      const mixSum = Number(b.cash || 0) + Number(b.upi || 0) + Number(b.card || 0);
      if (Math.abs(mixSum - paidAmount) > 0.02) {
        return res.status(400).json({ message: "Mixed payment amounts must equal the total paid" });
      }
    }

    const sale = await Sale.create({
      billNumber: nextNumber("SALE"),
      customer: customer?.id,
      customerSnapshot: customer
        ? { name: customer.name, phone: customer.phone, address: customer.address }
        : req.body.customer,
      items: saleItems,
      subtotal,
      discount: billDiscount,
      gstAmount,
      totalAmount,
      paidAmount,
      paymentMethod,
      paymentBreakdown: req.body.paymentBreakdown,
      status: paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Pending",
      createdBy: req.user?.id
    });

    if (customer && paidAmount < totalAmount) {
      customer.pendingAmount += totalAmount - paidAmount;
      await customer.save();
    }

    const payload: Record<string, unknown> = { sale: stripSaleForRole(sale, req.user?.role) };
    if (canViewCost(req.user?.role)) payload.grossProfit = grossProfit;
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    for (const line of sale.items) {
      if (line.inventoryItem) {
        await InventoryItem.findByIdAndUpdate(line.inventoryItem, {
          $inc: { currentStock: Number(line.quantity || 0) }
        });
      }
    }

    if (sale.customer) {
      const unpaid = Math.max(0, Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0));
      if (unpaid > 0) {
        const customer = await Customer.findById(sale.customer);
        if (customer) {
          customer.pendingAmount = Math.max(0, customer.pendingAmount - unpaid);
          await customer.save();
        }
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: "Sale removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
