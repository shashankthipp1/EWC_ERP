import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { Expense } from "../models/Expense.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Sale } from "../models/Sale.js";
import { getShopSettings } from "../models/Settings.js";
import { dayBounds, inRange, weekBounds } from "../utils/numbers.js";

const router = Router();
router.use(protect);

function saleRevenue(sale: { totalAmount?: number | null; paidAmount?: number | null }) {
  return Number(sale.totalAmount ?? sale.paidAmount ?? 0);
}

function saleCogs(sale: { items?: Array<{ purchasePrice?: number | null; quantity?: number | null }> }) {
  return (sale.items || []).reduce(
    (sum, item) => sum + Number(item.purchasePrice ?? 0) * Number(item.quantity ?? 0),
    0
  );
}

router.get("/", async (_req, res, next) => {
  try {
    const today = dayBounds();
    const week = weekBounds();
    const settings = await getShopSettings();

    const [inventory, sales, expenses] = await Promise.all([
      InventoryItem.find().sort({ updatedAt: -1 }),
      Sale.find().sort({ createdAt: -1 }).limit(200).populate("createdBy", "name"),
      Expense.find().sort({ date: -1 }).limit(200)
    ]);

    const todaySales = sales.filter((s) => inRange(s.createdAt, today.start, today.end));
    const todayExpenses = expenses.filter((e) => inRange(new Date(e.date), today.start, today.end));

    const todaySalesAmount = todaySales.reduce((sum, s) => sum + saleRevenue(s), 0);
    const todayExpenditure = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const todayCogs = todaySales.reduce((sum, s) => sum + saleCogs(s), 0);
    const todayGrossProfit = todaySalesAmount - todayCogs;
    const todayProfitLoss = todayGrossProfit - todayExpenditure;

    const lowStock = inventory
      .filter((item) => item.currentStock <= item.minimumStock)
      .slice(0, 10)
      .map((item) => ({
        _id: item._id,
        productId: item.productId,
        category: item.category,
        brand: item.brand,
        modelNumber: item.modelNumber,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock
      }));

    const recentTransactions = sales.slice(0, 5).map((sale) => ({
      id: sale._id,
      saleId: sale.billNumber,
      date: sale.createdAt,
      amount: saleRevenue(sale),
      paymentMode: sale.paymentMethod,
      customerName: sale.customerSnapshot?.name || "Walk-in",
      staffName: (sale.createdBy as { name?: string } | null)?.name || "Staff"
    }));

    const weeklyChart = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(week.start);
      d.setDate(d.getDate() + index);
      const bounds = dayBounds(d);
      const daySales = sales
        .filter((s) => inRange(s.createdAt, bounds.start, bounds.end))
        .reduce((sum, s) => sum + saleRevenue(s), 0);
      const dayExpenses = expenses
        .filter((e) => inRange(new Date(e.date), bounds.start, bounds.end))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return {
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        date: d.toISOString(),
        sales: daySales,
        expenditure: dayExpenses
      };
    });

    res.json({
      shop: {
        name: settings.shopName,
        address: settings.address,
        phone: settings.phone
      },
      today: {
        sales: todaySalesAmount,
        expenditure: todayExpenditure,
        grossProfit: todayGrossProfit,
        profitLoss: todayProfitLoss,
        isProfit: todayProfitLoss >= 0
      },
      counts: {
        totalProducts: inventory.length,
        lowStockCount: inventory.filter((i) => i.currentStock <= i.minimumStock).length
      },
      lowStock,
      recentTransactions,
      weeklyChart
    });
  } catch (err) {
    next(err);
  }
});

export default router;
