import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, IndianRupee, Package, Plus, ReceiptText, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { Card, PageShell, Skeleton } from "../components/ui";
import { currency, formatDateTime } from "../utils/format";

type Analytics = {
  today: { salesValue: number; billsCount: number };
  comparisons: { monthVsLastMonth: { thisMonth: number } };
  counts: { totalProducts: number; lowStockCount: number; outOfStockCount?: number };
  lowStock: Array<{ name: string; category: string; left: number; minimum: number }>;
  recentSales: Array<{ billNumber: string; amount: number; customerName: string; paymentMethod: string; createdAt: string }>;
};

export function EwcDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics")).data as Analytics
  });

  if (isLoading || !analytics) {
    return (
      <PageShell className="space-y-4">
        <Skeleton className="h-16" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </PageShell>
    );
  }

  const salesSeries = analytics.recentSales
    .slice()
    .reverse()
    .slice(0, 7)
    .map((s) => s.amount);
  const maxSales = Math.max(...salesSeries, 1);
  const points = salesSeries
    .map((amount, index) => {
      const x = (index / Math.max(salesSeries.length - 1, 1)) * 100;
      const y = 100 - (amount / maxSales) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <PageShell className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Today Overview</p>
          <h2 className="font-display text-2xl font-bold text-cream">Welcome, Admin</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs text-muted">
          <span>01 Jun 2026 - 01 Jun 2026</span>
          <button
            type="button"
            className="inline-flex min-h-[32px] items-center gap-2 rounded-md bg-brand px-3 text-xs font-semibold text-white shadow-soft"
          >
            <Download size={14} />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!rounded-xl !border-0 !bg-[#e8f0ff] !p-4">
          <p className="text-xs font-semibold text-[#2f4f88]">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-[#1659d8]">{currency(analytics.today.salesValue)}</p>
          <p className="mt-1 text-xs text-[#2f4f88]">Today Sale</p>
        </Card>
        <Card className="!rounded-xl !border-0 !bg-[#e8f9ef] !p-4">
          <p className="text-xs font-semibold text-[#2b6f4b]">Total Profit</p>
          <p className="mt-1 text-2xl font-bold text-[#0f9d58]">{currency(analytics.comparisons.monthVsLastMonth.thisMonth)}</p>
          <p className="mt-1 text-xs text-[#2b6f4b]">This Month</p>
        </Card>
        <Card className="!rounded-xl !border-0 !bg-[#edf2ff] !p-4">
          <p className="text-xs font-semibold text-[#4b4aa3]">Total Products</p>
          <p className="mt-1 text-2xl font-bold text-[#6a5cf6]">{analytics.counts.totalProducts}</p>
          <p className="mt-1 text-xs text-[#4b4aa3]">In Inventory</p>
        </Card>
        <Card className="!rounded-xl !border-0 !bg-[#fff3e8] !p-4">
          <p className="text-xs font-semibold text-[#8b5b2e]">Low Stock</p>
          <p className="mt-1 text-2xl font-bold text-[#f59e0b]">{analytics.counts.lowStockCount}</p>
          <p className="mt-1 text-xs text-[#8b5b2e]">Need Restock</p>
        </Card>
      </div>

      <Card className="!p-4">
        <p className="mb-2 text-sm font-semibold text-muted">Quick Actions</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Link to="/billing" className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white">
            <ScanLine size={16} /> + New Bill
          </Link>
          <Link to="/inventory" className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm font-semibold text-cream">
            <Package size={16} /> Inventory
          </Link>
          <Link to="/sales" className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm font-semibold text-cream">
            <Plus size={16} /> Sales Report
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1.2fr]">
        <Card className="!p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-bold">Sales Overview</p>
            <span className="rounded-md border border-line bg-surface-2 px-3 py-1 text-xs text-muted">This Week</span>
          </div>
          <div className="h-56 rounded-xl border border-line bg-surface-2 p-3">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <polyline fill="none" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" points={`0,100 ${points} 100,100`} />
              <polyline fill="none" stroke="#2563eb" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
            </svg>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="!p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Top Selling Products</p>
              <Package size={18} className="text-muted" />
            </div>
            <ul className="space-y-2">
              {analytics.lowStock.slice(0, 4).map((item) => (
                <li key={item.name} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <span className="truncate text-sm">{item.name}</span>
                  <span className="text-xs font-semibold text-muted">{item.left} Pcs</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Low Stock Alert</p>
              <AlertTriangle size={18} className="text-warning" />
            </div>
            <ul className="space-y-2">
              {analytics.lowStock.slice(0, 4).map((item) => (
                <li key={`${item.name}-alert`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-semibold text-danger">Stock: {item.left} Pcs</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="!p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText size={18} className="text-brand" />
            <p className="font-semibold">Recent Bills</p>
          </div>
          <Link to="/sales" className="text-sm font-semibold text-brand">
            View All
          </Link>
        </div>
        <div className="grid gap-2">
          {analytics.recentSales.slice(0, 4).map((sale) => (
            <div key={sale.billNumber} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">{sale.billNumber}</p>
                <p className="text-xs text-muted">{formatDateTime(sale.createdAt)}</p>
              </div>
              <p className="font-bold text-brand">{currency(sale.amount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
