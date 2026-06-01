import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../api/http";
import { Button, Card, EmptyState, Skeleton } from "../../components/ui";
import { currency } from "../../utils/format";

type Suggestion = {
  product: string;
  category: string;
  currentStock: number;
  threshold: number;
  suggestedQuantity: number;
  estimatedCost: number;
};

export function StockAlertsPanel() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/reorder-suggestions");
      setItems(data.suggestions);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Low stock alerts</h3>
          <p className="text-sm text-muted">Items at or below minimum threshold</p>
        </div>
        <Link to="/orders">
          <Button variant="outline" size="sm">
            Create purchase order
          </Button>
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Stock levels healthy" description="No SKUs are below minimum threshold right now." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Suggest order</th>
                <th className="px-4 py-3">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.product} className="data-grid-row">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cream">{row.product}</p>
                    <p className="text-xs text-muted">{row.category}</p>
                  </td>
                  <td className="px-4 py-3 text-danger font-semibold">{row.currentStock}</td>
                  <td className="px-4 py-3">{row.threshold}</td>
                  <td className="px-4 py-3 font-semibold text-brand">{row.suggestedQuantity}</td>
                  <td className="px-4 py-3">{currency(row.estimatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
