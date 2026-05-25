import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Customer } from "../models/Customer.js";
import { Repair } from "../models/Repair.js";
import { nextNumber } from "../utils/numbers.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const filter = q
      ? { $or: [{ customerName: new RegExp(q, "i") }, { phoneNumber: new RegExp(q, "i") }, { modelNumber: new RegExp(q, "i") }, { repairStatus: new RegExp(q, "i") }] }
      : {};
    const repairs = await Repair.find(filter).sort({ updatedAt: -1 }).limit(500);
    res.json({ repairs });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { phone: req.body.phoneNumber },
      { name: req.body.customerName, phone: req.body.phoneNumber, address: req.body.address },
      { upsert: true, new: true }
    );
    const repair = await Repair.create({ ...req.body, receiptNumber: nextNumber("REP"), customer: customer.id, createdBy: req.user?.id });
    customer.pendingAmount += repair.remainingAmount;
    await customer.save();
    res.status(201).json({ repair });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await Repair.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Repair not found" });

    const payload = { ...req.body };
    if (payload.estimatedCost !== undefined) payload.estimatedCost = Number(payload.estimatedCost);
    if (payload.advancePaid !== undefined) payload.advancePaid = Number(payload.advancePaid);
    if (payload.repairStatus === "Delivered") {
      payload.deliveredAt = new Date();
      const customer = await Customer.findById(existing.customer);
      if (customer && customer.pendingAmount >= existing.remainingAmount) {
        customer.pendingAmount = Math.max(0, customer.pendingAmount - existing.remainingAmount);
        await customer.save();
      }
    }

    const repair = await Repair.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json({ repair });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    if (repair.customer && repair.repairStatus !== "Delivered") {
      const customer = await Customer.findById(repair.customer);
      if (customer) {
        customer.pendingAmount = Math.max(0, customer.pendingAmount - Number(repair.remainingAmount || 0));
        await customer.save();
      }
    }

    await Repair.findByIdAndDelete(req.params.id);
    res.json({ message: "Repair record deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
