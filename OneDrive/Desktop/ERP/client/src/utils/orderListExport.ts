import { OrderLineValues, orderLineDisplayLabel } from "../data/productFields";
import { exportOrderListToDoc, exportOrderListToPdf, ShopHeader } from "./exporters";

export type OrderExportRow = {
  sno: number;
  category: string;
  item: string;
  quantity: number;
};

export function lineToExportRow(line: OrderLineValues, index: number): OrderExportRow {
  return {
    sno: index + 1,
    category: line.category,
    item: orderLineDisplayLabel(line),
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

export function buildOrderExportRows(lines: OrderLineValues[]): OrderExportRow[] {
  return lines.map(lineToExportRow);
}

export function downloadOrderListPdf(
  lines: OrderLineValues[],
  shop: ShopHeader,
  orderNumber?: string
) {
  if (!lines.length) return;
  exportOrderListToPdf(buildOrderExportRows(lines), shop, orderNumber);
}

export function downloadOrderListDoc(
  lines: OrderLineValues[],
  shop: ShopHeader,
  orderNumber?: string
) {
  if (!lines.length) return;
  exportOrderListToDoc(buildOrderExportRows(lines), shop, orderNumber);
}

/** Plain-text detail for legacy saved orders missing structured data */
export function formatSavedOrderItem(item: {
  category: string;
  quantity: number;
  data?: Record<string, unknown>;
}): string {
  const d = item.data;
  if (!d || !Object.keys(d).length) return item.category;
  return orderLineDisplayLabel(savedItemToOrderLine(item));
}
