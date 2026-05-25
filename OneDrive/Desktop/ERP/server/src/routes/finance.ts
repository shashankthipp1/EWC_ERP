import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Expense } from "../models/Expense.js";
import { Repair } from "../models/Repair.js";
import { Sale } from "../models/Sale.js";
import { dayBounds, monthBounds } from "../utils/numbers.js";

const router = Router();
router.use(protect);

router.get("/summary", async (_req, res, next) => {
  try {
    const day = dayBounds();
    const month = monthBounds();
    const [sales, repairs, expenses] = await Promise.all([
      Sale.find(),
      Repair.find(),
      Expense.find()
    ]);

    const inRange = (date: Date, start: Date, end: Date) => date >= start && date < end;
    const paidSales = sales.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0);
    const repairIncome = repairs.reduce((sum, repair) => sum + Number(repair.advancePaid || 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const profit = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((inner, item) => inner + (Number(item.sellingPrice) - Number(item.purchasePrice)) * Number(item.quantity), 0),
      0
    ) + repairIncome - expenseTotal;

    const dailyCollection =
      sales.filter((s) => inRange(s.createdAt, day.start, day.end)).reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0) +
      repairs.filter((r) => inRange(r.createdAt, day.start, day.end)).reduce((sum, repair) => sum + Number(repair.advancePaid || 0), 0);
    const monthlyCollection =
      sales.filter((s) => inRange(s.createdAt, month.start, month.end)).reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0) +
      repairs.filter((r) => inRange(r.createdAt, month.start, month.end)).reduce((sum, repair) => sum + Number(repair.advancePaid || 0), 0);

    res.json({
      dailyCollection,
      monthlyCollection,
      totalRevenue: paidSales + repairIncome,
      profitLoss: profit,
      totalExpenses: expenseTotal,
      repairIncome,
      pendingPayments:
        sales.reduce((sum, sale) => sum + Math.max(0, Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)), 0) +
        repairs.reduce((sum, repair) => sum + Number(repair.remainingAmount || 0), 0),
      cashFlow: Array.from({ length: 12 }).map((_, index) => {
        const d = new Date(new Date().getFullYear(), index, 1);
        const bounds = monthBounds(d);
        return {
          month: d.toLocaleString("en", { month: "short" }),
          revenue: sales.filter((s) => inRange(s.createdAt, bounds.start, bounds.end)).reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0),
          expenses: expenses.filter((e) => inRange(e.date, bounds.start, bounds.end)).reduce((sum, e) => sum + Number(e.amount || 0), 0)
        };
      })
    });
  } catch (err) {
    next(err);
  }
});

router.get("/expenses", async (_req, res, next) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 }).limit(500);
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

router.post("/expenses", async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user?.id });
    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
});

router.delete("/expenses/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
