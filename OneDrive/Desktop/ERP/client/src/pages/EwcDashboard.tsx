import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  IndianRupee,
  Package,
  Plus,
  ReceiptText,
  ScanLine,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { QuickAction } from "../components/ewc/QuickActionBar";
import { SimpleStatCard } from "../components/ewc/SimpleStatCard";
import { StockBadge } from "../components/ewc/StockBadge";
import { Card, PageShell, Skeleton } from "../components/ui";
import { usePermissions } from "../hooks/usePermissions";
import { currency, formatDateTime } from "../utils/format";

type Analytics = {
  today: { moneyIn: number; salesValue: number; billsCount: number };
  comparisons: { monthVsLastMonth: { thisMonth: number } };
  counts: { totalProducts: number; lowStockCount: number; inventoryValue: number };
  lowStock: Array<{ name: string; category: string; left: number; minimum: number }>;
  recentSales: Array<{ billNumber: string; amount: number; customerName: string; paymentMethod: string; createdAt: string }>;
  topProducts: Array<{ name: string; sold: number; earned: number }>;
};

export function EwcDashboard() {
  const { canViewCost, canManageInventory } = usePermissions();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics")).data as Analytics
  });

  const { data: customerData } = useQuery({
    queryKey: ["customers-count"],
    queryFn: async () => {
      const { data } = await api.get("/customers");
      return (data.customers?.length ?? 0) as number;
    }
  });

  if (isLoading || !analytics) {
    return (
      <PageShell className="space-y-4">
        <Skeleton className="h-16" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-6">
      <div className="rounded-2xl border border-brand/25 bg-brand/10 p-5">
        <p className="text-lg font-bold text-cream">What should you do next?</p>
        <p className="mt-1 text-base text-muted">Tap a big button below to bill a customer or check stock.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickAction to="/billing" icon={ScanLine} label="Quick billing" primary />
        {canManageInventory && <QuickAction to="/inventory" icon={Plus} label="Add product" />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SimpleStatCard icon={IndianRupee} label="Today's sales" value={currency(analytics.today.salesValue)} hint={`${analytics.today.billsCount} bills today`} tone="brand" />
        <SimpleStatCard icon={TrendingUp} label="This month" value={currency(analytics.comparisons.monthVsLastMonth.thisMonth)} tone="success" />
        {canViewCost && (
          <SimpleStatCard icon={Boxes} label="Stock value (cost)" value={currency(analytics.counts.inventoryValue)} tone="accent" />
        )}
        <SimpleStatCard icon={Package} label="Total products" value={analytics.counts.totalProducts} />
        <SimpleStatCard icon={AlertTriangle} label="Low stock items" value={analytics.counts.lowStockCount} tone="warning" />
        <SimpleStatCard icon={Users} label="Total customers" value={customerData ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="text-warning" size={22} /> Low stock alerts
          </h2>
          {analytics.lowStock.length === 0 ? (
            <p className="text-base text-muted">All products have enough stock.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.lowStock.slice(0, 8).map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{item.name}</p>
                    <p className="text-sm text-muted">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{item.left} left</p>
                    <StockBadge current={item.left} minimum={item.minimum} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/inventory" className="mt-4 inline-block text-base font-semibold text-brand">
            View all stock →
          </Link>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <ReceiptText className="text-brand" size={22} /> Recent sales
          </h2>
          <ul className="space-y-3">
            {analytics.recentSales.slice(0, 8).map((sale) => (
              <li key={sale.billNumber} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-mono text-base font-bold text-brand">{sale.billNumber}</p>
                  <p className="text-lg font-bold">{currency(sale.amount)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {sale.customerName || "Walk-in"} · {sale.paymentMethod} · {formatDateTime(sale.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <Link to="/sales" className="mt-4 inline-block text-base font-semibold text-brand">
            All sales →
          </Link>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="text-success" size={22} /> Fast selling products
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.topProducts.slice(0, 6).map((p) => (
            <div key={p.name} className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-2xl font-bold text-brand">{p.sold} sold</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
