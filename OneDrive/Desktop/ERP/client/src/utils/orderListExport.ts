import { normalizeCategory } from "../data/categories";
import { OrderLineValues, orderLineDisplayLabel, orderListParts } from "../data/productFields";
import { exportOrderListToDoc, exportOrderListToPdf, ShopHeader } from "./exporters";

export type OrderExportRow = {
  sno: number;
  category: string;
  details: string;
  quantity: number;
};

export function lineToExportRow(line: OrderLineValues, index: number): OrderExportRow {
  const parts = orderListParts(line);
  const c = normalizeCategory(line.category);
  let details = "";

  const p = parts as Record<string, string | number | undefined>;
  switch (c) {
    case "Wall Clocks":
    case "Alarm Clocks":
      details = [p.brand, p.model, p.colors].filter(Boolean).join(" · ");
      break;
    case "Trimmers":
      details = [p.brand, p.model, p.variant].filter(Boolean).join(" · ");
      break;
    case "Calculators":
    case "Torch Lights":
      details = [p.brand, p.model].filter(Boolean).join(" · ");
      break;
    case "Watch Batteries":
    case "Batteries":
      details = [p.company, p.batteryNumber].filter(Boolean).join(" · ");
      break;
    case "Mobile Accessories":
      details = [p.accessoryType, p.brand].filter(Boolean).join(" · ");
      break;
    default:
      details = orderLineDisplayLabel(line);
  }

  return {
    sno: index + 1,
    category: line.category,
    details,
    quantity: line.quantity
  };
}

function plainItemData(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (data instanceof Map) return Object.fromEntries(data.entries());
  if (typeof data === "object") return data as Record<string, unknown>;
  return {};
}

export function savedItemToOrderLine(item: {
  category: string;
  quantity: number;
  data?: Record<string, unknown> | Map<string, unknown>;
}): OrderLineValues {
  const d = plainItemData(item.data);
  return {
    category: item.category as OrderLineValues["category"],
    brand: String(d.brand || ""),
    modelNumber: String(d.modelNumber || d.accessoryName || ""),
    colorVariant: String(d.colorVariant || ""),
    batteryType: String(d.batteryType || ""),
    accessoryType: String(d.accessoryType || ""),
    accessoryName: String(d.accessoryName || d.modelNumber || ""),
    strapType: String(d.strapType || ""),
    watchDisplay: String(d.watchDisplay || ""),
    quantity: item.quantity,
    purchasePrice: Number(d.purchasePrice || 0)
  };
}

export function buildOrderExportRows(lines: OrderLineValues[]) {
  return lines.map(lineToExportRow).map((r) => ({
    sno: r.sno,
    category: r.category,
    item: r.details,
    quantity: r.quantity
  }));
}

export function downloadOrderListPdf(lines: OrderLineValues[], shop: ShopHeader, orderNumber?: string) {
  if (!lines.length) return;
  exportOrderListToPdf(buildOrderExportRows(lines), shop, orderNumber);
}

export function downloadOrderListDoc(lines: OrderLineValues[], shop: ShopHeader, orderNumber?: string) {
  if (!lines.length) return;
  exportOrderListToDoc(buildOrderExportRows(lines), shop, orderNumber);
}

export function formatSavedOrderItem(item: { category: string; quantity: number; data?: Record<string, unknown> }): string {
  const d = item.data;
  if (!d || !Object.keys(d).length) return item.category;
  return orderLineDisplayLabel(savedItemToOrderLine(item));
}
