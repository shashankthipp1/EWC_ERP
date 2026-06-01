/** Active retail categories for the watch / clock / accessories store. */
export const PRODUCT_CATEGORIES = [
  "Wall Clocks",
  "Alarm Clocks",
  "Trimmers",
  "Calculators",
  "Torch Lights",
  "Watch Batteries",
  "Mobile Accessories",
  /** @deprecated Legacy records — do not use for new products */
  "Batteries",
  "Watches",
  "Repair Parts"
] as const;

export const WALL_CLOCK_CATEGORY = "Wall Clocks" as const;
export const ALARM_CLOCK_CATEGORY = "Alarm Clocks" as const;
export const TRIMMER_CATEGORY = "Trimmers" as const;
export const CALCULATOR_CATEGORY = "Calculators" as const;
export const TORCH_CATEGORY = "Torch Lights" as const;
export const BATTERY_CATEGORY = "Watch Batteries" as const;
export const LEGACY_BATTERY_CATEGORY = "Batteries" as const;
export const ACCESSORY_CATEGORY = "Mobile Accessories" as const;

/** Categories that use Brand + Model + Color/Variant pattern */
export const STANDARD_MODEL_CATEGORIES = [
  WALL_CLOCK_CATEGORY,
  ALARM_CLOCK_CATEGORY,
  TRIMMER_CATEGORY,
  CALCULATOR_CATEGORY,
  TORCH_CATEGORY
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const TRIMMER_VARIANTS = [
  "Black",
  "Black + Gold",
  "Professional",
  "Rechargeable",
  "Silver",
  "White"
] as const;

export const ACCESSORY_TYPES = [
  "Charger",
  "Cable",
  "Earphones",
  "Neckband",
  "Bluetooth Speaker",
  "Adapter",
  "Tempered Glass",
  "Mobile Cover",
  "Power Bank",
  "Other"
] as const;

export const DEFAULT_PRODUCT_COLORS = [
  "Black",
  "White",
  "Silver",
  "Brown",
  "Blue",
  "Gold",
  "Red",
  "Green",
  "Grey",
  "Rose Gold",
  "Ivory",
  "Multicolor"
] as const;

export const EXPENSE_CATEGORIES = [
  "Shop Rent",
  "Electricity",
  "Stock Purchase",
  "Salaries",
  "Repair Materials",
  "Miscellaneous"
] as const;

export const PAYMENT_MODES = ["Cash", "UPI", "Card"] as const;
export const SALE_PAYMENT_MODES = ["Cash", "UPI", "Card", "Mixed"] as const;

export function normalizeCategory(category: string): string {
  const c = category.trim();
  if (c === LEGACY_BATTERY_CATEGORY) return BATTERY_CATEGORY;
  return c;
}

export function isBatteryCategory(category: string) {
  const c = normalizeCategory(category);
  return c === BATTERY_CATEGORY || c === LEGACY_BATTERY_CATEGORY;
}

export function categoryUsesVariant(category: string) {
  return normalizeCategory(category) === TRIMMER_CATEGORY;
}

export function categoryUsesColor(category: string) {
  const c = normalizeCategory(category);
  return c === WALL_CLOCK_CATEGORY || c === ALARM_CLOCK_CATEGORY;
}

export function categoryOmitsColorField(category: string) {
  const c = normalizeCategory(category);
  return c === CALCULATOR_CATEGORY || c === TORCH_CATEGORY;
}
