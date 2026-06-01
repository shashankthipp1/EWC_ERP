import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, IndianRupee, Package, Plus, ScanLine, TrendingUp, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { QuickAction } from "../components/ewc/QuickActionBar";
import { SimpleStatCard } from "../components/ewc/SimpleStatCard";
import { StockBadge } from "../components/ewc/StockBadge";
import { Card, PageShell, Skeleton } from "../components/ui";
import { usePermissions } from "../hooks/usePermissions";
import { currency, formatDateTime } from "../utils/format";

type Analytics = {
  today: { salesValue: number; billsCount: number };
  comparisons: { monthVsLastMonth: { thisMonth: number } };
  counts: { totalProducts: number; lowStockCount: number; outOfStockCount?: number };
  lowStock: Array<{ name: string; category: string; left: number; minimum: number }>;
  recentSales: Array<{ billNumber: string; amount: number; customerName: string; paymentMethod: string; createdAt: string }>;
};

export function EwcDashboard() {
  const { canManageInventory } = usePermissions();

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

  const outOfStock = analytics.counts.outOfStockCount ?? 0;

  return (
    <PageShell className="space-y-5">
      <div className="rounded-2xl border border-brand/25 bg-brand/10 p-5">
        <p className="text-lg font-bold">Shop overview</p>
        <p className="mt-1 text-sm text-muted">Tap a big button to start billing or add stock.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickAction to="/billing" icon={ScanLine} label="New bill" primary />
        {canManageInventory && <QuickAction to="/inventory" icon={Plus} label="Add product" />}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SimpleStatCard
          icon={IndianRupee}
          label="Today's sales"
          value={currency(analytics.today.salesValue)}
          hint={`${analytics.today.billsCount} bills`}
          tone="brand"
        />
        <SimpleStatCard icon={TrendingUp} label="This month" value={currency(analytics.comparisons.monthVsLastMonth.thisMonth)} tone="success" />
        <SimpleStatCard icon={Package} label="Total products" value={analytics.counts.totalProducts} />
        <SimpleStatCard icon={AlertTriangle} label="Low stock" value={analytics.counts.lowStockCount} tone="warning" />
        <SimpleStatCard icon={XCircle} label="Out of stock" value={outOfStock} tone="danger" />
      </div>

      {(analytics.lowStock.length > 0 || outOfStock > 0) && (
        <Card className="!p-4">
          <h2 className="mb-3 text-base font-bold">Stock alerts</h2>
          <ul className="space-y-2">
            {analytics.lowStock.slice(0, 6).map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="truncate">{item.name}</span>
                <StockBadge current={item.left} minimum={item.minimum} />
              </li>
            ))}
          </ul>
          <Link to="/inventory" className="mt-3 inline-block text-sm font-semibold text-brand">
            Open inventory →
          </Link>
        </Card>
      )}

      {analytics.recentSales.length > 0 && (
        <Card className="!p-4">
          <h2 className="mb-3 text-base font-bold">Recent bills</h2>
          <ul className="space-y-2">
            {analytics.recentSales.slice(0, 5).map((sale) => (
              <li key={sale.billNumber} className="flex justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <div>
                  <p className="font-mono font-semibold text-brand">{sale.billNumber}</p>
                  <p className="text-xs text-muted">{formatDateTime(sale.createdAt)}</p>
                </div>
                <p className="font-bold">{currency(sale.amount)}</p>
              </li>
            ))}
          </ul>
          <Link to="/sales" className="mt-3 inline-block text-sm font-semibold text-brand">
            All sales →
          </Link>
        </Card>
      )}
    </PageShell>
  );
}
