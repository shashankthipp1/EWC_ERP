import {
  ACCESSORY_CATEGORY,
  BATTERY_CATEGORY,
  PRODUCT_CATEGORIES,
  ProductCategory,
  STANDARD_CATEGORIES,
  WATCH_CATEGORY
} from "./categories.js";

export type ProductPayload = {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  batteryType: string;
  accessoryType: string;
  strapType: string;
  watchDisplay: string;
  supplierName: string;
};

export const STRAP_TYPES = ["Chain", "Belt"] as const;
export const WATCH_DISPLAY_TYPES = ["Simple", "Day and Date"] as const;
export const ACCESSORY_TYPES = ["Charger", "Cable", "Case", "Screen Guard", "Earphone", "Power Bank", "Other"] as const;

export type FieldKey =
  | "brand"
  | "modelNumber"
  | "colorVariant"
  | "batteryType"
  | "accessoryType"
  | "strapType"
  | "watchDisplay"
  | "currentStock"
  | "quantity"
  | "purchasePrice";

export type FieldDef = {
  key: FieldKey;
  label: string;
  type: "text" | "number" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
};

export function isStandardCategory(category: string) {
  return (STANDARD_CATEGORIES as readonly string[]).includes(category);
}

export function getInventoryFieldDefs(category: string): FieldDef[] {
  if (category === BATTERY_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      {
        key: "batteryType",
        label: "Battery number",
        type: "text",
        required: true,
        placeholder: "e.g. AA, CR2032, LR44"
      },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
    ];
  }
  if (category === ACCESSORY_CATEGORY) {
    return [
      { key: "accessoryType", label: "Type of accessory", type: "select", options: ACCESSORY_TYPES, required: true },
      { key: "modelNumber", label: "Accessory name", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
    ];
  }
  if (category === WATCH_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "strapType", label: "Strap type", type: "select", options: STRAP_TYPES, required: true },
      { key: "watchDisplay", label: "Display", type: "select", options: WATCH_DISPLAY_TYPES, required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
    ];
  }
  if (isStandardCategory(category)) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model number", type: "text", required: true },
      { key: "colorVariant", label: "Color", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
    ];
  }
  return [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "modelNumber", label: "Model / description", type: "text" },
    { key: "currentStock", label: "Quantity", type: "number", required: true },
    { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
  ];
}

export function getOrderFieldDefs(category: string): FieldDef[] {
  return getInventoryFieldDefs(category)
    .filter((f) => f.key !== "purchasePrice")
    .map((f) => (f.key === "currentStock" ? { ...f, key: "quantity" as FieldKey, label: "Quantity" } : f));
}

export function parseProductBody(body: Record<string, unknown>): ProductPayload {
  const category = String(body.category || "").trim() as ProductCategory;
  const purchasePrice = Number(body.purchasePrice ?? 0);
  const sellingPrice = Number(body.sellingPrice ?? 0) || purchasePrice;
  return {
    category,
    brand: String(body.brand || "").trim(),
    modelNumber: String(body.modelNumber || body.accessoryName || "").trim(),
    colorVariant: String(body.colorVariant || "").trim(),
    purchasePrice,
    sellingPrice,
    currentStock: Number(body.currentStock ?? 0),
    minimumStock: Number(body.minimumStock ?? 5),
    batteryType: String(body.batteryType || "").trim(),
    accessoryType: String(body.accessoryType || "").trim(),
    strapType: String(body.strapType || "").trim(),
    watchDisplay: String(body.watchDisplay || "").trim(),
    supplierName: String(body.supplierName || "").trim()
  };
}

export function validateProductPayload(data: ProductPayload): string[] {
  const errors: string[] = [];
  if (!PRODUCT_CATEGORIES.includes(data.category)) errors.push("Invalid category");

  const defs = getInventoryFieldDefs(data.category);
  for (const field of defs) {
    if (!field.required) continue;
    const value = fieldValue(data, field.key);
    if (value === "" || value === undefined || (field.type === "number" && Number(value) < 0)) {
      errors.push(`${field.label} is required`);
    }
  }
  if (data.purchasePrice < 0) errors.push("Purchase price cannot be negative");
  if (data.currentStock < 0) errors.push("Quantity cannot be negative");
  return errors;
}

function fieldValue(data: ProductPayload, key: FieldKey): string | number {
  if (key === "quantity") return data.currentStock;
  if (key === "currentStock") return data.currentStock;
  if (key === "purchasePrice") return data.purchasePrice;
  return (data as Record<string, string | number>)[key] ?? "";
}

export function productFingerprint(input: {
  category: string;
  brand?: string;
  modelNumber?: string;
  colorVariant?: string;
  batteryType?: string;
  accessoryType?: string;
  strapType?: string;
  watchDisplay?: string;
}) {
  const c = input.category;
  if (c === BATTERY_CATEGORY) {
    return [c, (input.brand || "").trim().toLowerCase(), (input.batteryType || "").trim().toLowerCase()].join("|");
  }
  if (c === ACCESSORY_CATEGORY) {
    return [c, (input.accessoryType || "").trim().toLowerCase(), (input.modelNumber || "").trim().toLowerCase()].join("|");
  }
  if (c === WATCH_CATEGORY) {
    return [c, (input.brand || "").trim().toLowerCase(), (input.strapType || "").trim().toLowerCase(), (input.watchDisplay || "").trim().toLowerCase()].join("|");
  }
  if (isStandardCategory(c)) {
    return [
      c,
      (input.brand || "").trim().toLowerCase(),
      (input.modelNumber || "").trim().toLowerCase(),
      (input.colorVariant || "").trim().toLowerCase()
    ].join("|");
  }
  return [
    c,
    (input.brand || "").trim().toLowerCase(),
    (input.modelNumber || "").trim().toLowerCase(),
    (input.colorVariant || "").trim().toLowerCase(),
    (input.batteryType || "").trim().toLowerCase()
  ].join("|");
}

export function buildProductSearchText(fields: ProductPayload & { productId?: string }) {
  return [
    fields.productId,
    fields.category,
    fields.brand,
    fields.modelNumber,
    fields.colorVariant,
    fields.batteryType,
    fields.accessoryType,
    fields.strapType,
    fields.watchDisplay,
    fields.supplierName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function productDisplayLabel(item: Partial<ProductPayload> & { category?: string }) {
  const c = item.category || "";
  if (c === BATTERY_CATEGORY) return [item.brand, item.batteryType].filter(Boolean).join(" · ");
  if (c === ACCESSORY_CATEGORY) return [item.accessoryType, item.modelNumber].filter(Boolean).join(" · ");
  if (c === WATCH_CATEGORY) return [item.brand, item.strapType, item.watchDisplay].filter(Boolean).join(" · ");
  if (isStandardCategory(c)) return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
  return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
}

export function inventoryToOrderLine(item: ProductPayload & { _id?: string }) {
  return {
    category: item.category,
    brand: item.brand,
    modelNumber: item.modelNumber,
    colorVariant: item.colorVariant,
    batteryType: item.batteryType,
    accessoryType: item.accessoryType,
    accessoryName: item.modelNumber,
    strapType: item.strapType,
    watchDisplay: item.watchDisplay,
    quantity: Math.max(1, item.minimumStock * 2 - item.currentStock),
    purchasePrice: item.purchasePrice
  };
}

export function normalizeOrderItem(raw: Record<string, unknown>) {
  const category = String(raw.category || "Watches");
  const quantity = Number(raw.quantity ?? raw.currentStock ?? 1);
  const data = {
    brand: String(raw.brand || "").trim(),
    modelNumber: String(raw.modelNumber || raw.accessoryName || "").trim(),
    colorVariant: String(raw.colorVariant || "").trim(),
    batteryType: String(raw.batteryType || "").trim(),
    accessoryType: String(raw.accessoryType || "").trim(),
    accessoryName: String(raw.accessoryName || raw.modelNumber || "").trim(),
    strapType: String(raw.strapType || "").trim(),
    watchDisplay: String(raw.watchDisplay || "").trim(),
    purchasePrice: Number(raw.purchasePrice ?? 0)
  };
  return { category, quantity, data, purchasePrice: data.purchasePrice };
}

export function orderLineLabel(item: { category?: string; data?: Record<string, unknown> } & Record<string, unknown>) {
  const d = (item.data || item) as Record<string, unknown>;
  const category = String(item.category || d.category || "");
  return productDisplayLabel({
    category: category as ProductPayload["category"],
    brand: String(d.brand || ""),
    modelNumber: String(d.modelNumber || d.accessoryName || ""),
    colorVariant: String(d.colorVariant || ""),
    batteryType: String(d.batteryType || ""),
    accessoryType: String(d.accessoryType || ""),
    strapType: String(d.strapType || ""),
    watchDisplay: String(d.watchDisplay || "")
  });
}
