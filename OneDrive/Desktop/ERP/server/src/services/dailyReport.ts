import { Expense } from "../models/Expense.js";
import { Repair } from "../models/Repair.js";
import { Sale } from "../models/Sale.js";
import { dayBounds, inRange } from "../utils/numbers.js";

export function toDateKey(value: Date | string): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseReportDate(param?: string): Date {
  if (!param) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(param.trim());
  if (!match) throw new Error("Invalid date. Use YYYY-MM-DD.");
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date.");
  return d;
}

function saleGrossProfit(sale: {
  items?: Array<{ sellingPrice?: number | null; purchasePrice?: number | null; quantity?: number | null }>;
}) {
  return (sale.items || []).reduce(
    (sum, item) =>
      sum + (Number(item.sellingPrice ?? 0) - Number(item.purchasePrice ?? 0)) * Number(item.quantity ?? 0),
    0
  );
}

function saleCogs(sale: {
  items?: Array<{ purchasePrice?: number | null; quantity?: number | null }>;
}) {
  return (sale.items || []).reduce(
    (sum, item) => sum + Number(item.purchasePrice ?? 0) * Number(item.quantity ?? 0),
    0
  );
}

export type DailyReportHistoryEntry = {
  date: string;
  salesCount: number;
  salesTotal: number;
  collection: number;
  repairCount: number;
  repairCollection: number;
  expenseTotal: number;
  netProfit: number;
};

export async function buildDailyReport(date: Date) {
  const bounds = dayBounds(date);
  const dateKey = toDateKey(date);

  const [daySales, dayRepairs, dayExpenses] = await Promise.all([
    Sale.find({ createdAt: { $gte: bounds.start, $lt: bounds.end } })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 }),
    Repair.find({ createdAt: { $gte: bounds.start, $lt: bounds.end } }).sort({ createdAt: -1 }),
    Expense.find({ date: { $gte: bounds.start, $lt: bounds.end } }).sort({ date: -1 })
  ]);

  const salesSubtotal = daySales.reduce((sum, s) => sum + Number(s.subtotal || 0), 0);
  const salesGst = daySales.reduce((sum, s) => sum + Number(s.gstAmount || 0), 0);
  const salesTotal = daySales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const salesPaid = daySales.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
  const salesPending = daySales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0)),
    0
  );
  const salesGrossProfit = daySales.reduce((sum, s) => sum + saleGrossProfit(s), 0);
  const salesCogs = daySales.reduce((sum, s) => sum + saleCogs(s), 0);

  const repairAdvance = dayRepairs.reduce((sum, r) => sum + Number(r.advancePaid || 0), 0);
  const expenseTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const collection = salesPaid + repairAdvance;
  const netProfit = salesGrossProfit + repairAdvance - expenseTotal;

  return {
    date: dateKey,
    generatedAt: new Date().toISOString(),
    sales: {
      count: daySales.length,
      subtotal: salesSubtotal,
      gstAmount: salesGst,
      totalAmount: salesTotal,
      paidAmount: salesPaid,
      pendingAmount: salesPending,
      grossProfit: salesGrossProfit,
      cogs: salesCogs,
      bills: daySales.map((sale) => ({
        _id: sale._id,
        billNumber: sale.billNumber,
        customerName: sale.customerSnapshot?.name || "Walk-in",
        customerPhone: sale.customerSnapshot?.phone || "",
        itemCount: sale.items?.length || 0,
        subtotal: Number(sale.subtotal || 0),
        gstAmount: Number(sale.gstAmount || 0),
        totalAmount: Number(sale.totalAmount || 0),
        paidAmount: Number(sale.paidAmount || 0),
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        staffName: (sale.createdBy as { name?: string } | null)?.name || "Staff",
        createdAt: sale.createdAt
      }))
    },
    repairs: {
      count: dayRepairs.length,
      advanceCollected: repairAdvance,
      items: dayRepairs.map((repair) => ({
        _id: repair._id,
        receiptNumber: repair.receiptNumber,
        customerName: repair.customerName,
        phoneNumber: repair.phoneNumber,
        deviceType: repair.deviceType,
        advancePaid: Number(repair.advancePaid || 0),
        estimatedCost: Number(repair.estimatedCost || 0),
        repairStatus: repair.repairStatus,
        createdAt: repair.createdAt
      }))
    },
    expenses: {
      count: dayExpenses.length,
      total: expenseTotal,
      items: dayExpenses.map((expense) => ({
        _id: expense._id,
        category: expense.category,
        description: expense.description,
        amount: Number(expense.amount || 0),
        paymentMode: expense.paymentMode,
        date: expense.date
      }))
    },
    summary: {
      collection,
      salesRevenue: salesTotal,
      salesCollection: salesPaid,
      repairCollection: repairAdvance,
      totalExpenses: expenseTotal,
      grossProfit: salesGrossProfit,
      netProfit,
      isProfit: netProfit >= 0
    }
  };
}

export async function buildReportHistory(limit = 120): Promise<DailyReportHistoryEntry[]> {
  const [sales, repairs, expenses] = await Promise.all([
    Sale.find().select("createdAt totalAmount paidAmount items").lean(),
    Repair.find().select("createdAt advancePaid").lean(),
    Expense.find().select("date amount").lean()
  ]);

  const map = new Map<string, DailyReportHistoryEntry>();

  const ensure = (date: string) => {
    if (!map.has(date)) {
      map.set(date, {
        date,
        salesCount: 0,
        salesTotal: 0,
        collection: 0,
        repairCount: 0,
        repairCollection: 0,
        expenseTotal: 0,
        netProfit: 0
      });
    }
    return map.get(date)!;
  };

  for (const sale of sales) {
    const key = toDateKey(sale.createdAt);
    const row = ensure(key);
    row.salesCount += 1;
    row.salesTotal += Number(sale.totalAmount || 0);
    row.collection += Number(sale.paidAmount || 0);
    row.netProfit += saleGrossProfit(sale);
  }

  for (const repair of repairs) {
    const key = toDateKey(repair.createdAt);
    const row = ensure(key);
    row.repairCount += 1;
    const advance = Number(repair.advancePaid || 0);
    row.repairCollection += advance;
    row.collection += advance;
    row.netProfit += advance;
  }

  for (const expense of expenses) {
    const key = toDateKey(expense.date);
    const row = ensure(key);
    row.expenseTotal += Number(expense.amount || 0);
    row.netProfit -= Number(expense.amount || 0);
  }

  return Array.from(map.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
