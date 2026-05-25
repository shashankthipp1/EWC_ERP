import {
  ACCESSORY_CATEGORY,
  BATTERY_CATEGORY,
  PRODUCT_CATEGORIES,
  ProductCategory,
  STANDARD_CATEGORIES,
  WATCH_CATEGORY
} from "./categories";
import { PRODUCT_COLOR_OPTIONS } from "./colors";

export const STRAP_TYPES = ["Chain", "Belt"] as const;
export const WATCH_DISPLAY_TYPES = ["Simple", "Day and Date"] as const;
export const ACCESSORY_TYPES = ["Charger", "Cable", "Case", "Screen Guard", "Earphone", "Power Bank", "Other"] as const;

export type FieldKey =
  | "brand"
  | "modelNumber"
  | "colorVariant"
  | "batteryType"
  | "accessoryType"
  | "accessoryName"
  | "strapType"
  | "watchDisplay"
  | "currentStock"
  | "purchasePrice"
  | "quantity";

export type FieldDef = {
  key: FieldKey;
  label: string;
  type: "text" | "number" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
};

export type ProductFormValues = {
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
        placeholder: "e.g. AA, CR2032, LR44 — enter any size"
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
      { key: "strapType", label: "Chain or belt", type: "select", options: STRAP_TYPES, required: true },
      { key: "watchDisplay", label: "Simple or day & date", type: "select", options: WATCH_DISPLAY_TYPES, required: true },
      { key: "currentStock", label: "Quantity", type: "number", required: true },
      { key: "purchasePrice", label: "Purchase price (each) ₹", type: "number", required: true }
    ];
  }
  if (isStandardCategory(category)) {
    return [
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "modelNumber", label: "Model number", type: "text", required: true },
      { key: "colorVariant", label: "Color", type: "select", options: PRODUCT_COLOR_OPTIONS, required: true },
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
    .map((f) => {
      if (f.key === "currentStock") return { ...f, key: "quantity" as const, label: "Order quantity" };
      if (f.key === "colorVariant") return { ...f, label: "Color", type: "select" as const, options: PRODUCT_COLOR_OPTIONS };
      return f;
    });
}

export function emptyProduct(category: ProductCategory = "Wall Clocks"): ProductFormValues {
  return {
    category,
    brand: "",
    modelNumber: "",
    colorVariant: "",
    purchasePrice: 0,
    sellingPrice: 0,
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
  purchasePrice: number;
  sellingPrice: number;
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
    purchasePrice: item.purchasePrice,
    sellingPrice: item.sellingPrice,
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    batteryType: item.batteryType || "",
    accessoryType: item.accessoryType || "",
    strapType: item.strapType || "",
    watchDisplay: item.watchDisplay || "",
    supplierName: item.supplierName || ""
  };
}

function normalizeColorForSelect(color: string): string {
  const t = color.trim();
  if (!t) return "";
  const parts = t.split(/[|/]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const joined = parts.join(" / ");
  const match = PRODUCT_COLOR_OPTIONS.find((c) => joined.toLowerCase().includes(c.toLowerCase()));
  return match || joined;
}

export function orderLineFromProduct(item: {
  category: ProductCategory;
  brand: string;
  modelNumber: string;
  colorVariant: string;
  batteryType: string;
  accessoryType?: string;
  strapType?: string;
  watchDisplay?: string;
  purchasePrice: number;
  currentStock: number;
  minimumStock: number;
}): OrderLineValues {
  return {
    category: item.category,
    brand: item.brand,
    modelNumber: item.modelNumber,
    colorVariant: normalizeColorForSelect(item.colorVariant),
    batteryType: item.batteryType,
    accessoryType: item.accessoryType || "",
    accessoryName: item.category === ACCESSORY_CATEGORY ? item.modelNumber : "",
    strapType: item.strapType || "",
    watchDisplay: item.watchDisplay || "",
    quantity: Math.max(1, item.minimumStock * 2 - item.currentStock),
    purchasePrice: item.purchasePrice
  };
}

function fieldValue(values: ProductFormValues | OrderLineValues, key: FieldKey): string | number {
  if (key === "accessoryName") return "accessoryName" in values ? values.accessoryName : values.modelNumber;
  if (key === "quantity") return "quantity" in values ? values.quantity : 0;
  if (key === "currentStock") return "currentStock" in values ? values.currentStock : ("quantity" in values ? values.quantity : 0);
  if (key === "purchasePrice") return values.purchasePrice;
  return (values as Record<string, string | number>)[key] ?? "";
}

export function validateInventoryForm(values: ProductFormValues): string | null {
  for (const field of getInventoryFieldDefs(values.category)) {
    if (!field.required) continue;
    const v = fieldValue(values, field.key);
    if (v === "") return `${field.label} is required`;
    if (field.type === "number") {
      const num = Number(v);
      if (field.key === "purchasePrice" || field.key === "currentStock") {
        if (num < 0) return `${field.label} cannot be negative`;
      } else if (num <= 0) {
        return `${field.label} is required`;
      }
    }
  }
  return null;
}

export function validateOrderLine(values: OrderLineValues): string | null {
  for (const field of getOrderFieldDefs(values.category)) {
    if (!field.required) continue;
    const v = fieldValue(values, field.key);
    if (v === "") return `${field.label} is required`;
    if (field.type === "number" && field.key === "quantity" && Number(v) <= 0) {
      return `${field.label} must be at least 1`;
    }
  }
  return null;
}

export function toInventoryPayload(values: ProductFormValues) {
  return {
    ...values,
    sellingPrice: values.sellingPrice || values.purchasePrice,
    colorVariant: isStandardCategory(values.category) ? values.colorVariant : "",
    batteryType: values.category === BATTERY_CATEGORY ? values.batteryType : "",
    accessoryType: values.category === ACCESSORY_CATEGORY ? values.accessoryType : "",
    strapType: values.category === WATCH_CATEGORY ? values.strapType : "",
    watchDisplay: values.category === WATCH_CATEGORY ? values.watchDisplay : "",
    modelNumber:
      values.category === ACCESSORY_CATEGORY || isStandardCategory(values.category) || values.category === "Repair Parts"
        ? values.modelNumber
        : ""
  };
}

export function productDisplayLabel(item: Partial<ProductFormValues> & { category?: string }) {
  const c = item.category || "";
  if (c === BATTERY_CATEGORY) return [item.brand, item.batteryType].filter(Boolean).join(" · ");
  if (c === ACCESSORY_CATEGORY) return [item.accessoryType, item.modelNumber].filter(Boolean).join(" · ");
  if (c === WATCH_CATEGORY) return [item.brand, item.strapType, item.watchDisplay].filter(Boolean).join(" · ");
  if (isStandardCategory(c)) return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
  return [item.brand, item.modelNumber, item.colorVariant].filter(Boolean).join(" · ");
}

export function orderLineDisplayLabel(line: OrderLineValues) {
  return productDisplayLabel({
    category: line.category,
    brand: line.brand,
    modelNumber: line.modelNumber,
    colorVariant: line.colorVariant,
    batteryType: line.batteryType,
    accessoryType: line.accessoryType,
    strapType: line.strapType,
    watchDisplay: line.watchDisplay
  });
}

export function orderLineToPayload(line: OrderLineValues) {
  return {
    category: line.category,
    brand: line.brand,
    modelNumber: line.modelNumber,
    colorVariant: line.colorVariant,
    batteryType: line.batteryType,
    accessoryType: line.accessoryType,
    accessoryName: line.modelNumber,
    strapType: line.strapType,
    watchDisplay: line.watchDisplay,
    quantity: line.quantity,
    purchasePrice: line.purchasePrice
  };
}

export function formValuesForFields(values: ProductFormValues | OrderLineValues): Record<string, string | number> {
  const row: Record<string, string | number> = { ...values };
  if ("quantity" in values) row.currentStock = values.quantity;
  return row;
}

export { PRODUCT_CATEGORIES };
