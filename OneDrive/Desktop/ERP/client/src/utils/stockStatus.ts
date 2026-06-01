export type StockTone = "success" | "warning" | "danger";

export function getStockStatus(current: number, minimum = 5) {
  if (current <= 0) {
    return { label: "Out of Stock", shortLabel: "Out", icon: "🔴", tone: "danger" as StockTone };
  }
  if (current <= minimum) {
    return { label: "Low Stock", shortLabel: "Low", icon: "🟠", tone: "warning" as StockTone };
  }
  return { label: "In Stock", shortLabel: "OK", icon: "🟢", tone: "success" as StockTone };
}
