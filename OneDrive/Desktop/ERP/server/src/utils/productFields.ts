import {
  ACCESSORY_CATEGORY,
  ACCESSORY_TYPES,
  ALARM_CLOCK_CATEGORY,
  BATTERY_CATEGORY,
  CALCULATOR_CATEGORY,
  categoryOmitsColorField,
  categoryUsesVariant,
  DEFAULT_PRODUCT_COLORS,
  isBatteryCategory,
  LEGACY_BATTERY_CATEGORY,
  normalizeCategory,
  PRODUCT_CATEGORIES,
  ProductCategory,
  TORCH_CATEGORY,
  TRIMMER_CATEGORY,
  TRIMMER_VARIANTS,
  WALL_CLOCK_CATEGORY
} from "./categories.js";

export type ProductPayload = {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  currentStock: number;
  minimumStock: number;
  batteryType: string;
  accessoryType: string;
  strapType: string;
  watchDisplay: string;
  supplierName: string;
};

export type FieldKey =
  | "brand"
  | "modelNumber"
  | "colorVariant"
  | "batteryType"
  | "accessoryType"
  | "strapType"
  | "watchDisplay"
  | "currentStock"
  | "minimumStock"
  | "quantity"
  | "purchasePrice"
  | "sellingPrice"
  | "mrp";

export type FieldDef = {
  key: FieldKey;
  label: string;
  type: "text" | "number" | "select" | "multiColor";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  adminOnly?: boolean;
};

export function getInventoryFieldDefs(category: string, colorOptions: readonly string[] = DEFAULT_PRODUCT_COLORS): FieldDef[] {
  const c = normalizeCategory(category);
  const stockAlertField = { key: "minimumStock" as const, label: "Low stock alert at", type: "number" as const, required: true };

  if (c === WALL_CLOCK_CATEGORY) {
    return [
      { key: "brand", label: "Brand name", type: "text", required: true },
      { key: "modelNumber", label: "Model number", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "colorVariant", label: "Colors", type: "multiColor", options: colorOptions, required: true },
      stockAlertField,
      { key: "mrp", label: "MRP ₹", type: "number", required: true },
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }

  if (c === ALARM_CLOCK_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "colorVariant", label: "Color", type: "select", options: colorOptions, required: true },
      stockAlertField,
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }

  if (c === TRIMMER_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "colorVariant", label: "Variant", type: "select", options: TRIMMER_VARIANTS, required: true },
      stockAlertField,
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }

  if (c === CALCULATOR_CATEGORY || c === TORCH_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      stockAlertField,
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }

  if (isBatteryCategory(c)) {
    return [
      { key: "brand", label: "Company", type: "text", required: true },
      { key: "batteryType", label: "Battery number", type: "text", required: true, placeholder: "e.g. CR2032, LR44" },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      stockAlertField,
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }

  if (c === ACCESSORY_CATEGORY) {
    return [
      { key: "accessoryType", label: "Accessory type", type: "select", options: ACCESSORY_TYPES, required: true },
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      stockAlertField,
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true },
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true }
    ];
  }

  return [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "modelNumber", label: "Model", type: "text" },
    { key: "currentStock", label: "Quantity", type: "number", required: true },
    stockAlertField,
    { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true },
    { key: "purchasePrice", label: "Cost price ₹", type: "number", adminOnly: true }
  ];
}

export function getOrderFieldDefs(category: string, colorOptions: readonly string[] = DEFAULT_PRODUCT_COLORS): FieldDef[] {
  return getInventoryFieldDefs(category, colorOptions)
    .filter((f) => f.key !== "purchasePrice" && f.key !== "mrp" && f.key !== "sellingPrice")
    .map((f) => (f.key === "currentStock" ? { ...f, key: "quantity" as FieldKey, label: "Quantity" } : f));
}

export function parseColorsFromVariant(value: string): string[] {
  return value
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinColors(colors: string[]): string {
  return colors.filter(Boolean).join(" | ");
}

export function parseProductBody(body: Record<string, unknown>): ProductPayload {
  const category = normalizeCategory(String(body.category || "")) as ProductCategory;
  const purchasePrice = Number(body.purchasePrice ?? 0);
  const explicitSell = Number(body.sellingPrice ?? 0);
  const sellingPrice = explicitSell > 0 ? explicitSell : purchasePrice;
  const mrp = Number(body.mrp ?? 0) || sellingPrice;

  let colorVariant = String(body.colorVariant || "").trim();
  if (Array.isArray(body.colors)) {
    colorVariant = joinColors(body.colors.map((c) => String(c)));
  }

  return {
    category: (category === LEGACY_BATTERY_CATEGORY ? BATTERY_CATEGORY : category) as ProductCategory,
    brand: String(body.brand || "").trim(),
    modelNumber: String(body.modelNumber || body.accessoryName || "").trim(),
    colorVariant,
    purchasePrice,
    sellingPrice,
    mrp: category === WALL_CLOCK_CATEGORY ? mrp : sellingPrice,
    currentStock: Number(body.currentStock ?? 0),
    minimumStock: Number(body.minimumStock ?? 5),
    batteryType: String(body.batteryType || "").trim(),
    accessoryType: String(body.accessoryType || "").trim(),
    strapType: "",
    watchDisplay: "",
    supplierName: String(body.supplierName || "").trim()
  };
}

export function validateProductPayload(data: ProductPayload, colorOptions?: readonly string[]): string[] {
  const errors: string[] = [];
  if (!PRODUCT_CATEGORIES.includes(data.category) && data.category !== LEGACY_BATTERY_CATEGORY) {
    errors.push("Invalid category");
  }

  const defs = getInventoryFieldDefs(data.category, colorOptions).filter((f) => !f.adminOnly);
  for (const field of defs) {
    if (!field.required) continue;
    const value = fieldValue(data, field.key);
    if (field.type === "multiColor") {
      const colors = parseColorsFromVariant(String(value));
      if (!colors.length) errors.push("Select at least one color");
      if (data.currentStock > 1 && colors.length > data.currentStock) {
        errors.push(`Select up to ${data.currentStock} colors for this quantity`);
      }
      continue;
    }
    if (value === "" || value === undefined || (field.type === "number" && Number(value) < 0)) {
      errors.push(`${field.label} is required`);
    }
  }

  if (data.category === WALL_CLOCK_CATEGORY) {
    if (data.mrp <= 0) errors.push("MRP is required");
    if (data.sellingPrice <= 0) errors.push("Selling price is required");
  }

  if (data.purchasePrice < 0) errors.push("Cost price cannot be negative");
  if (data.currentStock < 0) errors.push("Quantity cannot be negative");
  if (data.minimumStock < 0) errors.push("Low stock alert level cannot be negative");

  const costRequired = getInventoryFieldDefs(data.category, colorOptions).some((f) => f.key === "purchasePrice" && f.required && f.adminOnly);
  if (costRequired && data.purchasePrice <= 0) errors.push("Cost price is required");

  return errors;
}

function fieldValue(data: ProductPayload, key: FieldKey): string | number {
  if (key === "quantity") return data.currentStock;
  if (key === "currentStock") return data.currentStock;
  if (key === "minimumStock") return data.minimumStock;
  if (key === "purchasePrice") return data.purchasePrice;
  if (key === "sellingPrice") return data.sellingPrice;
  if (key === "mrp") return data.mrp;
  return (data as Record<string, string | number>)[key] ?? "";
}

export function productFingerprint(input: {
  category: string;
  brand?: string;
  modelNumber?: string;
  colorVariant?: string;
  batteryType?: string;
  accessoryType?: string;
}) {
  const c = normalizeCategory(input.category);
  if (isBatteryCategory(c)) {
    return [c, (input.brand || "").trim().toLowerCase(), (input.batteryType || "").trim().toLowerCase()].join("|");
  }
  if (c === ACCESSORY_CATEGORY) {
    return [c, (input.accessoryType || "").trim().toLowerCase(), (input.brand || "").trim().toLowerCase()].join("|");
  }
  if (categoryOmitsColorField(c)) {
    return [c, (input.brand || "").trim().toLowerCase(), (input.modelNumber || "").trim().toLowerCase()].join("|");
  }
  if (categoryUsesVariant(c) || c === ALARM_CLOCK_CATEGORY || c === WALL_CLOCK_CATEGORY) {
    return [
      c,
      (input.brand || "").trim().toLowerCase(),
      (input.modelNumber || "").trim().toLowerCase(),
      (input.colorVariant || "").trim().toLowerCase()
    ].join("|");
  }
  return [c, (input.brand || "").trim().toLowerCase(), (input.modelNumber || "").trim().toLowerCase()].join("|");
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
    fields.supplierName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function productDisplayLabel(item: Partial<ProductPayload> & { category?: string }) {
  const c = normalizeCategory(item.category || "");
  if (isBatteryCategory(c)) return [item.brand, item.batteryType].filter(Boolean).join(" · ");
  if (c === ACCESSORY_CATEGORY) return [item.accessoryType, item.brand].filter(Boolean).join(" · ");
  if (categoryOmitsColorField(c)) return [item.brand, item.modelNumber].filter(Boolean).join(" · ");
  if (categoryUsesVariant(c)) {
    return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
  }
  if (c === ALARM_CLOCK_CATEGORY || c === WALL_CLOCK_CATEGORY) {
    return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
  }
  return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
}

/** Category-specific order list line for exports and PDFs */
export function orderListLineParts(item: { category?: string; data?: Record<string, unknown> } & Record<string, unknown>) {
  const d = (item.data || item) as Record<string, unknown>;
  const category = normalizeCategory(String(item.category || d.category || ""));
  const brand = String(d.brand || "");
  const model = String(d.modelNumber || d.accessoryName || "");
  const qty = Number(item.quantity ?? d.quantity ?? 1);
  const colors = String(d.colorVariant || "");
  const variant = categoryUsesVariant(category) ? colors : "";
  const battery = String(d.batteryType || "");
  const accessoryType = String(d.accessoryType || "");

  switch (category) {
    case WALL_CLOCK_CATEGORY:
      return { brand, model, quantity: qty, colors };
    case ALARM_CLOCK_CATEGORY:
      return { brand, model, quantity: qty, colors };
    case TRIMMER_CATEGORY:
      return { brand, model, quantity: qty, variant };
    case CALCULATOR_CATEGORY:
    case TORCH_CATEGORY:
      return { brand, model, quantity: qty };
    case BATTERY_CATEGORY:
    case LEGACY_BATTERY_CATEGORY:
      return { company: brand, batteryNumber: battery, quantity: qty };
    case ACCESSORY_CATEGORY:
      return { accessoryType, brand, quantity: qty };
    default:
      return { brand, model, quantity: qty, colors };
  }
}

export function orderLineLabel(item: { category?: string; data?: Record<string, unknown> } & Record<string, unknown>) {
  const parts = orderListLineParts(item);
  const category = normalizeCategory(String(item.category || (item.data as Record<string, unknown>)?.category || ""));
  if (isBatteryCategory(category)) {
    return [`${parts.company}`, parts.batteryNumber].filter(Boolean).join(" · ");
  }
  if (category === ACCESSORY_CATEGORY) {
    return [parts.accessoryType, parts.brand].filter(Boolean).join(" · ");
  }
  if (category === TRIMMER_CATEGORY) {
    return [parts.brand, parts.model, parts.variant].filter(Boolean).join(" · ");
  }
  if (categoryOmitsColorField(category)) {
    return [parts.brand, parts.model].filter(Boolean).join(" · ");
  }
  return [parts.brand, parts.model, parts.colors].filter(Boolean).join(" · ");
}

export function inventoryToOrderLine(item: ProductPayload & { _id?: string }) {
  return {
    category: item.category,
    brand: item.brand,
    modelNumber: item.modelNumber,
    colorVariant: item.colorVariant,
    batteryType: item.batteryType,
    accessoryType: item.accessoryType,
    quantity: Math.max(1, item.minimumStock * 2 - item.currentStock),
    purchasePrice: item.purchasePrice
  };
}

export function normalizeOrderItem(raw: Record<string, unknown>) {
  const category = normalizeCategory(String(raw.category || "Wall Clocks"));
  const quantity = Number(raw.quantity ?? raw.currentStock ?? 1);
  const data = {
    brand: String(raw.brand || "").trim(),
    modelNumber: String(raw.modelNumber || raw.accessoryName || "").trim(),
    colorVariant: String(raw.colorVariant || "").trim(),
    batteryType: String(raw.batteryType || "").trim(),
    accessoryType: String(raw.accessoryType || "").trim(),
    purchasePrice: Number(raw.purchasePrice ?? 0)
  };
  return { category, quantity, data, purchasePrice: data.purchasePrice };
}
