export type StockTone = "success" | "warning" | "danger";

export function getStockStatus(current: number, minimum = 5) {
  if (current <= 0) {
    return { label: "Out of stock", shortLabel: "Out", tone: "danger" as StockTone };
  }
  if (current <= minimum) {
    return { label: "Low stock", shortLabel: "Low", tone: "warning" as StockTone };
  }
  return { label: "Available", shortLabel: "OK", tone: "success" as StockTone };
}
