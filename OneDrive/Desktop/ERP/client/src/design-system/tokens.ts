/** Venue / hospitality POS design tokens (CSS variables set in index.css). */
export const brand = {
  name: "VenueOS",
  tagline: "Restaurant · Hotel · Retail",
  product: "Unified operations platform"
} as const;

export const navSections = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard" as const, end: true },
      { to: "/billing", label: "Point of Sale", icon: "ScanLine" as const },
      { to: "/notifications", label: "Live feed", icon: "Bell" as const }
    ]
  },
  {
    label: "Operations",
    items: [
      { to: "/inventory", label: "Inventory", icon: "Package" as const },
      { to: "/orders", label: "Purchase orders", icon: "Truck" as const },
      { to: "/customers", label: "Guests & CRM", icon: "Users" as const },
      { to: "/repairs", label: "Service desk", icon: "Wrench" as const }
    ]
  },
  {
    label: "Finance",
    items: [
      { to: "/finance", label: "Expenses", icon: "Wallet" as const },
      { to: "/reports", label: "Reports", icon: "BarChart3" as const }
    ]
  },
  {
    label: "Admin",
    items: [
      { to: "/staff", label: "Team", icon: "UserCog" as const },
      { to: "/settings", label: "Settings", icon: "Settings" as const }
    ]
  }
];
