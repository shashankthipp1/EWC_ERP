import { canViewCost } from "./roles.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InventoryLike = { purchasePrice?: number; toObject?: () => Record<string, unknown> } & any;

export function toPlainInventory(item: InventoryLike): Record<string, unknown> {
  if (typeof item.toObject === "function") return item.toObject();
  return { ...item };
}

export function serializeInventoryItem(item: InventoryLike, role?: string): Record<string, unknown> {
  const plain = toPlainInventory(item);
  if (!canViewCost(role)) {
    delete plain.purchasePrice;
  }
  return plain;
}

export function serializeInventoryList(items: InventoryLike[], role?: string) {
  return items.map((item) => serializeInventoryItem(item, role));
}

export function stripProfitFromAnalytics<T extends Record<string, unknown>>(data: T): T {
  const clone = JSON.parse(JSON.stringify(data)) as T & Record<string, unknown>;

  const redact = (obj: Record<string, unknown>) => {
    delete obj.profit;
    delete obj.profitLoss;
    delete obj.grossMarginPercent;
    delete obj.purchasePrice;
    if (obj.today && typeof obj.today === "object") {
      const t = obj.today as Record<string, unknown>;
      delete t.profit;
      delete t.isProfit;
      t.simpleSummary = "Sales and activity summary (profit hidden for your role).";
    }
    if (obj.advanced && typeof obj.advanced === "object") {
      delete (obj.advanced as Record<string, unknown>).grossMarginPercent;
    }
  };

  redact(clone as Record<string, unknown>);
  for (const key of ["weekChart", "monthChart", "profitTrend"] as const) {
    const arr = clone[key];
    if (Array.isArray(arr)) {
      (clone as Record<string, unknown>)[key] = arr.map((row) => {
        const r = { ...(row as Record<string, unknown>) };
        delete r.profit;
        delete r.spent;
        return r;
      });
    }
  }

  if (clone.verdict && typeof clone.verdict === "object") {
    const v = clone.verdict as Record<string, unknown>;
    v.title = "Today's activity";
    v.message = String(v.message || "").replace(/profit|loss/gi, "activity");
  }

  return clone;
}
