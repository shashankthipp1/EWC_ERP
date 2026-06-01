import {
  ACCESSORY_CATEGORY,
  ACCESSORY_TYPES,
  ALARM_CLOCK_CATEGORY,
  BATTERY_CATEGORY,
  CALCULATOR_CATEGORY,
  categoryOmitsColorField,
  categoryUsesVariant,
  isBatteryCategory,
  LEGACY_BATTERY_CATEGORY,
  normalizeCategory,
  PRODUCT_CATEGORIES,
  ProductCategory,
  TORCH_CATEGORY,
  TRIMMER_CATEGORY,
  TRIMMER_VARIANTS,
  WALL_CLOCK_CATEGORY
} from "./categories";

export type FieldKey =
  | "brand"
  | "modelNumber"
  | "colorVariant"
  | "batteryType"
  | "accessoryType"
  | "strapType"
  | "watchDisplay"
  | "currentStock"
  | "purchasePrice"
  | "sellingPrice"
  | "mrp"
  | "quantity";

export type FieldDef = {
  key: FieldKey;
  label: string;
  type: "text" | "number" | "select" | "multiColor";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  adminOnly?: boolean;
};

export type ProductFormValues = {
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

export type OrderLineValues = {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  batteryType: string;
  accessoryType: string;
  accessoryName: string;
  strapType: string;
  watchDisplay: string;
  quantity: number;
  purchasePrice: number;
};

export function parseColorsFromVariant(value: string): string[] {
  return value
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinColors(colors: string[]): string {
  return colors.filter(Boolean).join(" | ");
}

export function getInventoryFieldDefs(category: string, colorOptions: readonly string[] = []): FieldDef[] {
  const c = normalizeCategory(category);
  const colors = colorOptions.length ? colorOptions : [];

  if (c === WALL_CLOCK_CATEGORY) {
    return [
      { key: "brand", label: "Brand name", type: "text", required: true },
      { key: "modelNumber", label: "Model number", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "colorVariant", label: "Colors", type: "multiColor", options: colors, required: true },
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
      { key: "colorVariant", label: "Color", type: "select", options: colors, required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }
  if (c === TRIMMER_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "colorVariant", label: "Variant", type: "select", options: TRIMMER_VARIANTS, required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }
  if (c === CALCULATOR_CATEGORY || c === TORCH_CATEGORY) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }
  if (isBatteryCategory(c)) {
    return [
      { key: "brand", label: "Company", type: "text", required: true },
      { key: "batteryType", label: "Battery number", type: "text", required: true, placeholder: "e.g. CR2032" },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true }
    ];
  }
  if (c === ACCESSORY_CATEGORY) {
    return [
      { key: "accessoryType", label: "Accessory type", type: "select", options: ACCESSORY_TYPES, required: true },
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Cost price ₹", type: "number", required: true, adminOnly: true },
      { key: "sellingPrice", label: "Selling price ₹", type: "number", required: true }
    ];
  }
  return [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "modelNumber", label: "Model", type: "text" },
    { key: "currentStock", label: "Quantity", type: "number", required: true },
    { key: "purchasePrice", label: "Cost price ₹", type: "number", adminOnly: true }
  ];
}

export function getOrderFieldDefs(category: string, colorOptions: readonly string[] = []): FieldDef[] {
  return getInventoryFieldDefs(category, colorOptions)
    .filter((f) => f.key !== "purchasePrice" && f.key !== "mrp" && f.key !== "sellingPrice")
    .map((f) => (f.key === "currentStock" ? { ...f, key: "quantity" as const, label: "Quantity" } : f));
}

export function emptyProduct(category: ProductCategory = "Wall Clocks"): ProductFormValues {
  return {
    category,
    brand: "",
    modelNumber: "",
    colorVariant: "",
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    currentStock: 0,
    minimumStock: 5,
    batteryType: "",
    accessoryType: "",
    strapType: "",
    watchDisplay: "",
    supplierName: ""
  };
}

export function emptyOrderLine(category: ProductCategory = "Wall Clocks"): OrderLineValues {
  return {
    category,
    brand: "",
    modelNumber: "",
    colorVariant: "",
    batteryType: "",
    accessoryType: "",
    accessoryName: "",
    strapType: "",
    watchDisplay: "",
    quantity: 1,
    purchasePrice: 0
  };
}

export function productFromInventory(item: {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  minimumStock: number;
  batteryType: string;
  accessoryType?: string;
  strapType?: string;
  watchDisplay?: string;
  supplierName?: string;
}): ProductFormValues {
  return {
    category: item.category,
    brand: item.brand,
    modelNumber: item.modelNumber,
    colorVariant: item.colorVariant,
    purchasePrice: item.purchasePrice ?? 0,
    sellingPrice: item.sellingPrice,
    mrp: item.mrp ?? item.sellingPrice,
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    batteryType: item.batteryType || "",
    accessoryType: item.accessoryType || "",
    strapType: item.strapType || "",
    watchDisplay: item.watchDisplay || "",
    supplierName: item.supplierName || ""
  };
}

export function orderLineFromProduct(item: {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  batteryType: string;
  accessoryType?: string;
  purchasePrice?: number;
  currentStock: number;
  minimumStock: number;
}): OrderLineValues {
  return {
    category: item.category,
    brand: item.brand,
    modelNumber: item.modelNumber,
    colorVariant: item.colorVariant,
    batteryType: item.batteryType,
    accessoryType: item.accessoryType || "",
    accessoryName: "",
    strapType: "",
    watchDisplay: "",
    quantity: Math.max(1, item.minimumStock * 2 - item.currentStock),
    purchasePrice: item.purchasePrice ?? 0
  };
}

function fieldValue(values: ProductFormValues | OrderLineValues, key: FieldKey): string | number {
  if (key === "quantity") return "quantity" in values ? values.quantity : 0;
  if (key === "currentStock") return "currentStock" in values ? values.currentStock : 0;
  if (key === "purchasePrice") return values.purchasePrice ?? 0;
  if (key === "sellingPrice") return "sellingPrice" in values ? values.sellingPrice : 0;
  if (key === "mrp") return "mrp" in values ? values.mrp : 0;
  return (values as Record<string, string | number>)[key] ?? "";
}

export function validateInventoryForm(values: ProductFormValues): string | null {
  for (const field of getInventoryFieldDefs(values.category)) {
    if (field.adminOnly || !field.required) continue;
    const v = fieldValue(values, field.key);
    if (field.type === "multiColor") {
      if (!parseColorsFromVariant(String(v)).length) return `${field.label} is required`;
      continue;
    }
    if (v === "" || (field.type === "number" && Number(v) < 0)) return `${field.label} is required`;
  }
  if (normalizeCategory(values.category) === WALL_CLOCK_CATEGORY) {
    if (values.mrp <= 0) return "MRP is required";
    if (values.sellingPrice <= 0) return "Selling price is required";
  }
  return null;
}

export function validateOrderLine(values: OrderLineValues): string | null {
  for (const field of getOrderFieldDefs(values.category)) {
    if (!field.required) continue;
    const v = fieldValue(values, field.key);
    if (field.type === "multiColor" && !parseColorsFromVariant(String(v)).length) return `${field.label} is required`;
    if (v === "") return `${field.label} is required`;
    if (field.type === "number" && field.key === "quantity" && Number(v) <= 0) return "Quantity must be at least 1";
  }
  return null;
}

export function toInventoryPayload(values: ProductFormValues) {
  const c = normalizeCategory(values.category);
  return {
    ...values,
    category: c === LEGACY_BATTERY_CATEGORY ? BATTERY_CATEGORY : values.category,
    sellingPrice:
      c === WALL_CLOCK_CATEGORY || c === ACCESSORY_CATEGORY ? values.sellingPrice : values.purchasePrice || values.sellingPrice,
    mrp: c === WALL_CLOCK_CATEGORY ? values.mrp : values.sellingPrice,
    colorVariant: categoryOmitsColorField(c) ? "" : values.colorVariant,
    batteryType: isBatteryCategory(c) ? values.batteryType : "",
    accessoryType: c === ACCESSORY_CATEGORY ? values.accessoryType : "",
    modelNumber: c === ACCESSORY_CATEGORY ? "" : values.modelNumber
  };
}

export function productDisplayLabel(item: Partial<ProductFormValues> & { category?: string }) {
  const c = normalizeCategory(item.category || "");
  if (isBatteryCategory(c)) return [item.brand, item.batteryType].filter(Boolean).join(" · ");
  if (c === ACCESSORY_CATEGORY) return [item.accessoryType, item.brand].filter(Boolean).join(" · ");
  if (categoryOmitsColorField(c)) return [item.brand, item.modelNumber].filter(Boolean).join(" · ");
  if (categoryUsesVariant(c) || c === ALARM_CLOCK_CATEGORY || c === WALL_CLOCK_CATEGORY) {
    return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
  }
  return [item.brand, item.modelNumber].filter(Boolean).join(" · ");
}

export function orderLineDisplayLabel(line: OrderLineValues) {
  return productDisplayLabel(line);
}

export function orderListParts(line: OrderLineValues) {
  const c = normalizeCategory(line.category);
  const base = { quantity: line.quantity };
  switch (c) {
    case WALL_CLOCK_CATEGORY:
    case ALARM_CLOCK_CATEGORY:
      return { ...base, brand: line.brand, model: line.modelNumber, colors: line.colorVariant };
    case TRIMMER_CATEGORY:
      return { ...base, brand: line.brand, model: line.modelNumber, variant: line.colorVariant };
    case CALCULATOR_CATEGORY:
    case TORCH_CATEGORY:
      return { ...base, brand: line.brand, model: line.modelNumber };
    case BATTERY_CATEGORY:
    case LEGACY_BATTERY_CATEGORY:
      return { ...base, company: line.brand, batteryNumber: line.batteryType };
    case ACCESSORY_CATEGORY:
      return { ...base, accessoryType: line.accessoryType, brand: line.brand };
    default:
      return { ...base, brand: line.brand, model: line.modelNumber };
  }
}

export function orderLineToPayload(line: OrderLineValues) {
  return {
    category: line.category,
    brand: line.brand,
    modelNumber: line.modelNumber,
    colorVariant: line.colorVariant,
    batteryType: line.batteryType,
    accessoryType: line.accessoryType,
    quantity: line.quantity,
    purchasePrice: line.purchasePrice
  };
}

export function formValuesForFields(values: ProductFormValues | OrderLineValues): Record<string, string | number> {
  return { ...values, currentStock: "quantity" in values ? values.quantity : (values as ProductFormValues).currentStock };
}

export { PRODUCT_CATEGORIES };
