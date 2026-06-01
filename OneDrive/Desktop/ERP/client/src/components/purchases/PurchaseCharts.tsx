import { ReactNode, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { OrderLineValues } from "../../data/productFields";
import { currency } from "../../utils/format";

const CHART_COLORS = ["#2dd4bf", "#818cf8", "#fbbf24", "#f87171", "#34d399", "#a78bfa", "#fb923c", "#38bdf8"];

type SavedOrder = {
  status: string;
  items?: Array<{ category: string; quantity: number }>;
  totalEstimatedCost?: number;
  createdAt?: string;
};

type Suggestion = { product: string; suggestedQuantity: number };

type Props = {
  lines: OrderLineValues[];
  savedOrders: SavedOrder[];
  suggestions: Suggestion[];
  showCost: boolean;
  grandTotal: number;
};

function ChartCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-4">
      <p className="text-sm font-semibold text-cream">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-3 h-[200px] w-full">{children}</div>
    </div>
  );
}

export function PurchaseCharts({ lines, savedOrders, suggestions, showCost, grandTotal }: Props) {
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) {
      map.set(line.category, (map.get(line.category) || 0) + line.quantity);
    }
    return [...map.entries()].map(([name, value]) => ({ name: name.replace(" ", "\n"), value }));
  }, [lines]);

  const byLineQty = useMemo(() => {
    return lines.slice(0, 8).map((line, i) => {
      const label = [line.brand, line.modelNumber || line.batteryType || line.accessoryType]
        .filter(Boolean)
        .join(" ")
        .slice(0, 18);
      return { name: label || `Line ${i + 1}`, qty: line.quantity };
    });
  }, [lines]);

  const orderStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of savedOrders) {
      map.set(o.status || "Draft", (map.get(o.status || "Draft") || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [savedOrders]);

  const lowStockBars = useMemo(() => {
    return suggestions.slice(0, 6).map((s) => ({
      name: s.product.length > 16 ? `${s.product.slice(0, 14)}…` : s.product,
      qty: s.suggestedQuantity
    }));
  }, [suggestions]);

  const summary = useMemo(
    () => ({
      lines: lines.length,
      units: lines.reduce((s, l) => s + l.quantity, 0),
      categories: new Set(lines.map((l) => l.category)).size
    }),
    [lines]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-brand/10 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-brand">{summary.lines}</p>
          <p className="text-xs text-muted">Lines</p>
        </div>
        <div className="rounded-xl border border-line bg-success/10 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-success">{summary.units}</p>
          <p className="text-xs text-muted">Total units</p>
        </div>
        <div className="rounded-xl border border-line bg-accent/10 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-accent">{summary.categories}</p>
          <p className="text-xs text-muted">Categories</p>
        </div>
        {showCost && (
          <div className="rounded-xl border border-line bg-warning/10 px-4 py-3 text-center">
            <p className="text-lg font-bold text-warning">{currency(grandTotal)}</p>
            <p className="text-xs text-muted">Est. cost</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {byCategory.length > 0 ? (
          <ChartCard title="Units by category" hint="Current list">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} units`, "Qty"]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Units by category" hint="Add lines to see chart">
            <p className="flex h-full items-center justify-center text-xs text-muted">No data yet</p>
          </ChartCard>
        )}

        {byLineQty.length > 0 ? (
          <ChartCard title="Quantity per item" hint="Top lines in list">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLineQty} layout="vertical" margin={{ left: 4, right: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Quantity per item">
            <p className="flex h-full items-center justify-center text-xs text-muted">Add lines to see chart</p>
          </ChartCard>
        )}

        {orderStatus.length > 0 ? (
          <ChartCard title="Saved lists" hint="By status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {orderStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Saved lists">
            <p className="flex h-full items-center justify-center text-xs text-muted">No saved orders</p>
          </ChartCard>
        )}

        {lowStockBars.length > 0 ? (
          <ChartCard title="Reorder suggestions" hint="From low stock">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowStockBars} margin={{ bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Reorder suggestions">
            <p className="flex h-full items-center justify-center text-xs text-muted">Stock levels OK</p>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
