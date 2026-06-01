import { useQuery } from "@tanstack/react-query";
import { BarChart3, Boxes, FileBarChart2, Percent, TrendingUp, TriangleAlert } from "lucide-react";
import { api } from "../../api/http";
import { usePermissions } from "../../hooks/usePermissions";
import { SimpleStatCard } from "./SimpleStatCard";
import { currency } from "../../utils/format";

/** Simple report shortcuts for shop owners */
export function EwcReportHub() {
  const { canViewCost } = usePermissions();
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics")).data
  });

  if (!data) return null;

  return (
    <div className="mb-8 space-y-4">
      <div className="rounded-2xl border border-brand/20 bg-brand/10 p-5">
        <p className="text-lg font-bold">Reports at a glance</p>
        <p className="mt-1 text-base text-muted">Tap a card below. Scroll down for full daily report.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SimpleStatCard icon={TrendingUp} label="Today's sales" value={currency(data.today?.salesValue ?? 0)} tone="brand" />
        <SimpleStatCard icon={BarChart3} label="This month" value={currency(data.comparisons?.monthVsLastMonth?.thisMonth ?? 0)} tone="success" />
        <SimpleStatCard icon={Boxes} label="Products in stock" value={data.counts?.totalProducts ?? 0} />
        <SimpleStatCard icon={TriangleAlert} label="Low stock count" value={data.counts?.lowStockCount ?? 0} tone="warning" />
        {canViewCost && (
          <>
            <SimpleStatCard icon={Percent} label="Stock value (cost)" value={currency(data.counts?.inventoryValue ?? 0)} tone="accent" />
            <SimpleStatCard icon={FileBarChart2} label="Profit (see daily report)" value="Below ↓" hint="Open daily report for profit" />
          </>
        )}
      </div>
    </div>
  );
}
