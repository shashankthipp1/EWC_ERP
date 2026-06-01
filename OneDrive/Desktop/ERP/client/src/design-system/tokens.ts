/** EWC Retail Management System — design tokens */
export const brand = {
  name: "EWC ERP",
  shortName: "EWC",
  header: "EWC Retail Management System",
  tagline: "Smart Inventory • Smart Billing • Smart Business"
} as const;

export type MainNavIcon =
  | "LayoutDashboard"
  | "Package"
  | "ScanLine"
  | "ReceiptText"
  | "Truck"
  | "BarChart3"
  | "UserCog"
  | "Settings";

export type MainNavItem = {
  to: string;
  label: string;
  icon: MainNavIcon;
  end?: boolean;
  adminOnly?: boolean;
};

/** Simple menu — icon + label for every item */
export const mainNav: MainNavItem[] = [
  { to: "/", label: "Dashboard", icon: "LayoutDashboard", end: true },
  { to: "/inventory", label: "Inventory", icon: "Package" },
  { to: "/billing", label: "Billing", icon: "ScanLine" },
  { to: "/sales", label: "Sales", icon: "ReceiptText" },
  { to: "/orders", label: "Purchases", icon: "Truck" },
  { to: "/reports", label: "Reports", icon: "BarChart3" },
  { to: "/staff", label: "Users", icon: "UserCog", adminOnly: true },
  { to: "/settings", label: "Settings", icon: "Settings" }
];
