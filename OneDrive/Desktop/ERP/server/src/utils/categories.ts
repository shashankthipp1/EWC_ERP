export const PRODUCT_CATEGORIES = [
  "Watches",
  "Trimmers",
  "Wall Clocks",
  "Torch Lights",
  "Alarm Clocks",
  "Batteries",
  "Mobile Accessories",
  "Repair Parts"
] as const;

export const BATTERY_CATEGORY = "Batteries" as const;
export const ACCESSORY_CATEGORY = "Mobile Accessories" as const;
export const WATCH_CATEGORY = "Watches" as const;

export const STANDARD_CATEGORIES = ["Wall Clocks", "Trimmers", "Alarm Clocks", "Torch Lights"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BATTERY_TYPES = ["", "AA", "AAA", "CR2032", "LR44", "9V", "Rechargeable", "Other"] as const;

export const EXPENSE_CATEGORIES = [
  "Shop Rent",
  "Electricity",
  "Stock Purchase",
  "Salaries",
  "Repair Materials",
  "Miscellaneous"
] as const;

export const PAYMENT_MODES = ["Cash", "UPI", "Card"] as const;

