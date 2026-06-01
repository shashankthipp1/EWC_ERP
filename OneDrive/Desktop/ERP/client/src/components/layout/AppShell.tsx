import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileDock } from "./MobileDock";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const routeMeta: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Command dashboard", subtitle: "Real-time KPIs across venues" },
  "/inventory": { title: "Inventory control", subtitle: "Stock, alerts, suppliers & purchase orders" },
  "/billing": { title: "Point of sale", subtitle: "Fast checkout for cashiers" },
  "/orders": { title: "Purchase orders", subtitle: "Vendor replenishment workflows" },
  "/repairs": { title: "Service desk", subtitle: "Repairs & fulfillment" },
  "/finance": { title: "Expenses", subtitle: "Operating costs & payouts" },
  "/customers": { title: "Guests & CRM", subtitle: "Customer relationships" },
  "/reports": { title: "Analytics & reports", subtitle: "Exports and daily close" },
  "/notifications": { title: "Live activity", subtitle: "Operational feed" },
  "/staff": { title: "Team & roles", subtitle: "Staff administration" },
  "/settings": { title: "Settings", subtitle: "Venue profile & backups" }
};

export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = routeMeta[pathname] || { title: "Workspace" };
  const mainPad = collapsed ? "lg:pl-[76px]" : "lg:pl-[268px]";

  return (
    <div className="min-h-screen bg-mesh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${mainPad}`}>
        <TopBar title={meta.title} subtitle={meta.subtitle} sidebarCollapsed={collapsed} />
        <main className="main-content flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <MobileDock menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} onMenuClose={() => setMenuOpen(false)} />
    </div>
  );
}
