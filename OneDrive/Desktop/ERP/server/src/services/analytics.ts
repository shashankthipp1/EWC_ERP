import { Customer } from "../models/Customer.js";
import { Expense } from "../models/Expense.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Repair } from "../models/Repair.js";
import { Sale } from "../models/Sale.js";
import { getShopSettings } from "../models/Settings.js";
import { dayBounds, inRange, monthBounds, weekBounds } from "../utils/numbers.js";

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function compareText(label: string, current: number, previous: number, unit = "rupees") {
  const pct = pctChange(current, previous);
  if (pct === null) return `${label}: no data to compare yet.`;
  if (pct === 0) return `${label}: same as before (${unit}).`;
  if (pct > 0) return `${label}: up ${pct}% — you did better than before.`;
  return `${label}: down ${Math.abs(pct)}% — less than before.`;
}

function saleCollected(sale: { paidAmount?: number | null }) {
  return Number(sale.paidAmount || 0);
}

function saleBillValue(sale: { totalAmount?: number | null; paidAmount?: number | null }) {
  return Number(sale.totalAmount ?? sale.paidAmount ?? 0);
}

function saleItemProfit(sale: {
  items?: Array<{ sellingPrice?: number | null; purchasePrice?: number | null; quantity?: number | null }>;
}) {
  return (sale.items || []).reduce(
    (sum, item) =>
      sum + (Number(item.sellingPrice ?? 0) - Number(item.purchasePrice ?? 0)) * Number(item.quantity ?? 0),
    0
  );
}

function sumInRange<T>(
  items: T[],
  getDate: (item: T) => Date,
  start: Date,
  end: Date,
  getValue: (item: T) => number
) {
  return items.filter((item) => inRange(getDate(item), start, end)).reduce((sum, item) => sum + getValue(item), 0);
}

function countInRange<T>(items: T[], getDate: (item: T) => Date, start: Date, end: Date) {
  return items.filter((item) => inRange(getDate(item), start, end)).length;
}

export async function buildAnalytics() {
  const now = new Date();
  const today = dayBounds(now);
  const yesterday = dayBounds(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const thisWeek = weekBounds(now);
  const lastWeekStart = new Date(thisWeek.start);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeek.start);
  const thisMonth = monthBounds(now);
  const lastMonth = monthBounds(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [settings, inventory, sales, repairs, expenses, customers] = await Promise.all([
    getShopSettings(),
    InventoryItem.find().lean(),
    Sale.find().select("billNumber createdAt totalAmount paidAmount paymentMethod items customerSnapshot").lean(),
    Repair.find().select("createdAt advancePaid repairStatus estimatedCost remainingAmount").lean(),
    Expense.find().select("date amount category").lean(),
    Customer.find().select("pendingAmount").lean()
  ]);

  const todaySales = sales.filter((s) => inRange(s.createdAt, today.start, today.end));
  const todayRepairs = repairs.filter((r) => inRange(r.createdAt, today.start, today.end));
  const todayExpenses = expenses.filter((e) => inRange(new Date(e.date), today.start, today.end));

  const todaySalesValue = todaySales.reduce((s, x) => s + saleBillValue(x), 0);
  const todayCollected =
    todaySales.reduce((s, x) => s + saleCollected(x), 0) +
    todayRepairs.reduce((s, x) => s + Number(x.advancePaid || 0), 0);
  const todaySpent = todayExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const todayItemProfit = todaySales.reduce((s, x) => s + saleItemProfit(x), 0);
  const todayNetProfit = todayItemProfit + todayRepairs.reduce((s, x) => s + Number(x.advancePaid || 0), 0) - todaySpent;

  const yesterdayCollected =
    sumInRange(sales, (s) => s.createdAt, yesterday.start, yesterday.end, saleCollected) +
    sumInRange(repairs, (r) => r.createdAt, yesterday.start, yesterday.end, (r) => Number(r.advancePaid || 0));

  const thisWeekSales = sumInRange(sales, (s) => s.createdAt, thisWeek.start, thisWeek.end, saleBillValue);
  const lastWeekSales = sumInRange(sales, (s) => s.createdAt, lastWeekStart, lastWeekEnd, saleBillValue);

  const thisMonthCollected =
    sumInRange(sales, (s) => s.createdAt, thisMonth.start, thisMonth.end, saleCollected) +
    sumInRange(repairs, (r) => r.createdAt, thisMonth.start, thisMonth.end, (r) => Number(r.advancePaid || 0));
  const lastMonthCollected =
    sumInRange(sales, (s) => s.createdAt, lastMonth.start, lastMonth.end, saleCollected) +
    sumInRange(repairs, (r) => r.createdAt, lastMonth.start, lastMonth.end, (r) => Number(r.advancePaid || 0));

  const pendingFromCustomers = customers.reduce((s, c) => s + Number(c.pendingAmount || 0), 0);
  const pendingFromRepairs = repairs
    .filter((r) => r.repairStatus !== "Delivered")
    .reduce((s, r) => s + Number(r.remainingAmount || 0), 0);
  const pendingMoney = pendingFromCustomers + pendingFromRepairs;

  const lowStockItems = inventory
    .filter((i) => Number(i.currentStock) <= Number(i.minimumStock))
    .slice(0, 8)
    .map((i) => ({
      _id: i._id,
      name: [i.brand, i.modelNumber].filter(Boolean).join(" "),
      category: i.category,
      left: Number(i.currentStock),
      minimum: Number(i.minimumStock)
    }));

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const recentSales = sales.filter((s) => s.createdAt >= monthAgo);

  const categoryMap = new Map<string, { sold: number; earned: number }>();
  const productMap = new Map<string, { sold: number; earned: number }>();

  for (const sale of recentSales) {
    for (const item of sale.items || []) {
      const cat = item.category || "Other";
      const qty = Number(item.quantity || 0);
      const earned = Number(item.total ?? 0) || Number(item.sellingPrice || 0) * qty;
      const catRow = categoryMap.get(cat) || { sold: 0, earned: 0 };
      catRow.sold += qty;
      catRow.earned += earned;
      categoryMap.set(cat, catRow);

      const productName = item.description || cat;
      const prodRow = productMap.get(productName) || { sold: 0, earned: 0 };
      prodRow.sold += qty;
      prodRow.earned += earned;
      productMap.set(productName, prodRow);
    }
  }

  const topCategories = Array.from(categoryMap.entries())
    .map(([name, v]) => ({ name, sold: v.sold, earned: Math.round(v.earned) }))
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 6);

  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, sold: v.sold, earned: Math.round(v.earned) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6);

  const paymentMap = new Map<string, number>();
  for (const sale of recentSales) {
    const mode = sale.paymentMethod || "Cash";
    paymentMap.set(mode, (paymentMap.get(mode) || 0) + saleCollected(sale));
  }
  const paymentTotal = Array.from(paymentMap.values()).reduce((s, v) => s + v, 0);
  const paymentSplit = Array.from(paymentMap.entries())
    .map(([method, amount]) => ({
      method,
      amount: Math.round(amount),
      percent: paymentTotal ? Math.round((amount / paymentTotal) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const expenseByCategory = new Map<string, number>();
  for (const expense of expenses.filter((e) => inRange(new Date(e.date), thisMonth.start, thisMonth.end))) {
    expenseByCategory.set(
      expense.category,
      (expenseByCategory.get(expense.category) || 0) + Number(expense.amount || 0)
    );
  }
  const expenseBreakdown = Array.from(expenseByCategory.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const dayOfWeekSales = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const bounds = dayBounds(d);
    const total = sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleBillValue);
    const key = d.toLocaleDateString("en-IN", { weekday: "long" });
    dayOfWeekSales.set(key, (dayOfWeekSales.get(key) || 0) + total);
  }
  const busiestDay = Array.from(dayOfWeekSales.entries()).sort((a, b) => b[1] - a[1])[0];

  const weekChart = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(thisWeek.start);
    d.setDate(d.getDate() + index);
    const bounds = dayBounds(d);
    const daySales = sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleBillValue);
    const daySpent = sumInRange(expenses, (e) => new Date(e.date), bounds.start, bounds.end, (e) => Number(e.amount || 0));
    const dayProfit =
      sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleItemProfit) - daySpent;
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      sales: Math.round(daySales),
      spent: Math.round(daySpent),
      profit: Math.round(dayProfit)
    };
  });

  const monthChart = Array.from({ length: 6 }).map((_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const bounds = monthBounds(d);
    const collected =
      sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleCollected) +
      sumInRange(repairs, (r) => r.createdAt, bounds.start, bounds.end, (r) => Number(r.advancePaid || 0));
    const spent = sumInRange(expenses, (e) => new Date(e.date), bounds.start, bounds.end, (e) => Number(e.amount || 0));
    return {
      month: d.toLocaleString("en-IN", { month: "short" }),
      collected: Math.round(collected),
      spent: Math.round(spent),
      profit: Math.round(collected - spent)
    };
  });

  const openRepairs = repairs.filter((r) => !["Delivered", "Completed"].includes(r.repairStatus)).length;
  const inventoryValue = inventory.reduce(
    (s, i) => s + Number(i.purchasePrice || 0) * Number(i.currentStock || 0),
    0
  );

  const profitTrend = Array.from({ length: 30 }).map((_, index) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - index));
    const bounds = dayBounds(d);
    const daySales = sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleBillValue);
    const dayCollected =
      sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleCollected) +
      sumInRange(repairs, (r) => r.createdAt, bounds.start, bounds.end, (r) => Number(r.advancePaid || 0));
    const daySpent = sumInRange(expenses, (e) => new Date(e.date), bounds.start, bounds.end, (e) => Number(e.amount || 0));
    const dayGross = sumInRange(sales, (s) => s.createdAt, bounds.start, bounds.end, saleItemProfit);
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      sales: Math.round(daySales),
      collected: Math.round(dayCollected),
      spent: Math.round(daySpent),
      profit: Math.round(dayGross + sumInRange(repairs, (r) => r.createdAt, bounds.start, bounds.end, (r) => Number(r.advancePaid || 0)) - daySpent)
    };
  });

  const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekdayChart = weekdayOrder.map((day) => ({
    day: day.slice(0, 3),
    fullDay: day,
    sales: Math.round(dayOfWeekSales.get(day) || 0)
  }));

  const repairStatusMap = new Map<string, number>();
  for (const repair of repairs) {
    const status = repair.repairStatus || "Pending";
    repairStatusMap.set(status, (repairStatusMap.get(status) || 0) + 1);
  }
  const repairStatusChart = Array.from(repairStatusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const inventoryByCategory = Array.from(
    inventory.reduce((map, item) => {
      const cat = item.category || "Other";
      const value = Number(item.purchasePrice || 0) * Number(item.currentStock || 0);
      map.set(cat, (map.get(cat) || 0) + value);
      return map;
    }, new Map<string, number>())
  )
    .map(([category, value]) => ({ category, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const monthSalesOnly = sumInRange(sales, (s) => s.createdAt, thisMonth.start, thisMonth.end, saleBillValue);
  const monthRepairIncome = sumInRange(
    repairs,
    (r) => r.createdAt,
    thisMonth.start,
    thisMonth.end,
    (r) => Number(r.advancePaid || 0)
  );
  const monthExpenseTotal = sumInRange(
    expenses,
    (e) => new Date(e.date),
    thisMonth.start,
    thisMonth.end,
    (e) => Number(e.amount || 0)
  );

  const businessMixChart = [
    { name: "Product sales", value: Math.round(monthSalesOnly), fill: "#c9a227" },
    { name: "Repair income", value: Math.round(monthRepairIncome), fill: "#00d1b2" },
    { name: "Expenses", value: Math.round(monthExpenseTotal), fill: "#e74c3c" }
  ];

  const totalBilled30d = recentSales.reduce((s, x) => s + saleBillValue(x), 0);
  const totalCollected30d = recentSales.reduce((s, x) => s + saleCollected(x), 0);
  const grossProfit30d = recentSales.reduce((s, x) => s + saleItemProfit(x), 0);
  const expense30d = expenses
    .filter((e) => new Date(e.date) >= monthAgo)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const avgBillValue = recentSales.length ? Math.round(totalBilled30d / recentSales.length) : 0;
  const avgDailySales = Math.round(totalBilled30d / 30);
  const collectionRate = totalBilled30d ? Math.round((totalCollected30d / totalBilled30d) * 100) : 0;
  const grossMarginPercent = totalBilled30d ? Math.round((grossProfit30d / totalBilled30d) * 100) : 0;
  const expenseRatio = totalBilled30d ? Math.round((expense30d / totalBilled30d) * 100) : 0;

  const insights: string[] = [];

  if (todayNetProfit >= 0) {
    insights.push(`Today you kept ₹${Math.round(todayNetProfit).toLocaleString("en-IN")} as profit after expenses.`);
  } else {
    insights.push(
      `Today you are in loss of ₹${Math.round(Math.abs(todayNetProfit)).toLocaleString("en-IN")} — spending is more than earning.`
    );
  }

  insights.push(compareText("Money collected today vs yesterday", todayCollected, yesterdayCollected));
  insights.push(compareText("This week sales vs last week", thisWeekSales, lastWeekSales));
  insights.push(compareText("This month collection vs last month", thisMonthCollected, lastMonthCollected));

  if (topCategories[0]) {
    insights.push(
      `Best-selling category in last 30 days: ${topCategories[0].name} (${topCategories[0].sold} items sold).`
    );
  }

  if (busiestDay && busiestDay[1] > 0) {
    insights.push(`${busiestDay[0]} is usually your strongest day — keep enough stock ready.`);
  }

  if (paymentSplit[0]) {
    insights.push(`Most payments come by ${paymentSplit[0].method} (${paymentSplit[0].percent}% of last 30 days).`);
  }

  if (pendingMoney > 0) {
    insights.push(
      `₹${Math.round(pendingMoney).toLocaleString("en-IN")} is still pending from customers — remind them to pay.`
    );
  }

  if (lowStockItems.length > 0) {
    insights.push(`${lowStockItems.length} products are low in stock — order before you run out.`);
  }

  if (openRepairs > 0) {
    insights.push(`${openRepairs} repair jobs are still open — finish them to collect remaining money.`);
  }

  const verdictTitle =
    todayNetProfit > 0
      ? "Today is a good day for your shop"
      : todayNetProfit < 0
        ? "Today you spent more than you earned"
        : "Today you broke even";

  const verdictMessage =
    todayNetProfit > 0
      ? `After all sales and expenses, you kept about ₹${Math.round(todayNetProfit).toLocaleString("en-IN")} today.`
      : todayNetProfit < 0
        ? `You lost about ₹${Math.round(Math.abs(todayNetProfit)).toLocaleString("en-IN")} today because expenses were higher than profit.`
        : "Sales profit and expenses matched today — no loss, no extra gain.";

  return {
    generatedAt: now.toISOString(),
    shop: {
      name: settings.shopName,
      address: settings.address,
      phone: settings.phone
    },
    verdict: {
      title: verdictTitle,
      message: verdictMessage,
      tone: todayNetProfit > 0 ? "good" : todayNetProfit < 0 ? "bad" : "neutral"
    },
    today: {
      moneyIn: Math.round(todayCollected),
      moneyOut: Math.round(todaySpent),
      salesValue: Math.round(todaySalesValue),
      profit: Math.round(todayNetProfit),
      billsCount: todaySales.length,
      repairsCount: todayRepairs.length,
      isProfit: todayNetProfit >= 0,
      simpleSummary:
        todayCollected === 0 && todaySpent === 0
          ? "No sales or expenses recorded today yet."
          : `You received ₹${Math.round(todayCollected).toLocaleString("en-IN")} and spent ₹${Math.round(todaySpent).toLocaleString("en-IN")} today.`
    },
    comparisons: {
      todayVsYesterday: {
        today: Math.round(todayCollected),
        yesterday: Math.round(yesterdayCollected),
        percent: pctChange(todayCollected, yesterdayCollected),
        text: compareText("Collection", todayCollected, yesterdayCollected)
      },
      weekVsLastWeek: {
        thisWeek: Math.round(thisWeekSales),
        lastWeek: Math.round(lastWeekSales),
        percent: pctChange(thisWeekSales, lastWeekSales),
        text: compareText("Weekly sales", thisWeekSales, lastWeekSales)
      },
      monthVsLastMonth: {
        thisMonth: Math.round(thisMonthCollected),
        lastMonth: Math.round(lastMonthCollected),
        percent: pctChange(thisMonthCollected, lastMonthCollected),
        text: compareText("Monthly collection", thisMonthCollected, lastMonthCollected)
      }
    },
    counts: {
      totalProducts: inventory.length,
      outOfStockCount: inventory.filter((i) => Number(i.currentStock) <= 0).length,
      lowStockCount: inventory.filter(
        (i) => Number(i.currentStock) > 0 && Number(i.currentStock) <= Number(i.minimumStock)
      ).length,
      openRepairs,
      inventoryValue: Math.round(inventoryValue)
    },
    weekChart,
    monthChart,
    topCategories,
    topProducts,
    paymentSplit,
    pendingMoney: Math.round(pendingMoney),
    lowStock: lowStockItems,
    expenseBreakdown,
    repairs: {
      open: openRepairs,
      thisMonth: countInRange(repairs, (r) => r.createdAt, thisMonth.start, thisMonth.end)
    },
    insights: insights.slice(0, 8),
    advanced: {
      avgBillValue,
      avgDailySales,
      grossMarginPercent,
      collectionRate,
      expenseRatio,
      totalBilled30d: Math.round(totalBilled30d),
      totalCollected30d: Math.round(totalCollected30d),
      billsLast30d: recentSales.length
    },
    profitTrend,
    weekdayChart,
    repairStatusChart,
    businessMixChart,
    inventoryByCategory,
    recentSales: [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((sale) => ({
      id: sale._id,
      billNumber: sale.billNumber,
      amount: saleBillValue(sale),
      customerName: sale.customerSnapshot?.name || "Walk-in",
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt
    }))
  };
}
