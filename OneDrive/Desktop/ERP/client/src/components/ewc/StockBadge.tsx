import { clsx } from "clsx";
import { getStockStatus } from "../../utils/stockStatus";

export function StockBadge({ current, minimum = 5, large }: { current: number; minimum?: number; large?: boolean }) {
  const s = getStockStatus(current, minimum);
  const styles = {
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30"
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border font-bold",
        styles[s.tone],
        large ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs"
      )}
    >
      {s.label}
    </span>
  );
}
