import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Customer } from "../models/Customer.js";
import { Repair } from "../models/Repair.js";
import { Sale } from "../models/Sale.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const filter = q ? { $or: [{ name: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }] } : {};
    const customers = await Customer.find(filter).sort({ updatedAt: -1 }).limit(500);
    const enriched = await Promise.all(customers.map(async (customer) => {
      const [purchaseCount, repairCount] = await Promise.all([
        Sale.countDocuments({ customer: customer.id }),
        Repair.countDocuments({ customer: customer.id })
      ]);
      return { ...customer.toObject(), purchaseCount, repairCount };
    }));
    res.json({ customers: enriched });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    const [sales, repairs] = await Promise.all([
      Sale.find({ customer: req.params.id }).sort({ createdAt: -1 }),
      Repair.find({ customer: req.params.id }).sort({ createdAt: -1 })
    ]);
    res.json({ sales, repairs });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate({ phone: req.body.phone }, req.body, {
      new: true,
      upsert: true,
      runValidators: true
    });
    res.status(201).json({ customer });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const [saleCount, repairCount] = await Promise.all([
      Sale.countDocuments({ customer: customer.id }),
      Repair.countDocuments({ customer: customer.id })
    ]);
    if (saleCount > 0 || repairCount > 0) {
      return res.status(400).json({
        message: "Delete linked sales and repairs first before removing this customer"
      });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
