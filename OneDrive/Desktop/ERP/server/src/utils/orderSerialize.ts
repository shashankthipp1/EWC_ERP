import type { Document } from "mongoose";

export function itemDataToObject(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (data instanceof Map) return Object.fromEntries(data.entries());
  if (typeof data === "object") return data as Record<string, unknown>;
  return {};
}

export function serializeOrder(order: Document | Record<string, unknown>) {
  const raw = typeof (order as Document).toObject === "function" ? (order as Document).toObject() : { ...order };
  const o = raw as {
    items?: Array<{ category?: string; quantity?: number; data?: unknown }>;
    [key: string]: unknown;
  };
  return {
    ...o,
    items: (o.items || []).map((item) => ({
      category: item.category,
      quantity: item.quantity,
      data: itemDataToObject(item.data)
    }))
  };
}
