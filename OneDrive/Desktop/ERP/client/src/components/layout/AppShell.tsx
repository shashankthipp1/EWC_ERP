import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { APP_HEADER } from "../../constants/branding";
import { MobileDock } from "./MobileDock";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const routeMeta: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "What should you do next?" },
  "/inventory": { title: "Inventory", subtitle: "Search products and check stock" },
  "/billing": { title: "Billing", subtitle: "Tap products to make a bill" },
  "/sales": { title: "Sales", subtitle: "Past bills and invoices" },
  "/orders": { title: "Purchases", subtitle: "Order stock from suppliers" },
  "/reports": { title: "Reports", subtitle: "Sales and stock reports" },
  "/staff": { title: "Users", subtitle: "Staff accounts" },
  "/settings": { title: "Settings", subtitle: "Shop details" }
};

export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = routeMeta[pathname] || { title: "EWC ERP" };
  const mainPad = collapsed ? "lg:pl-[80px]" : "lg:pl-[280px]";

  return (
    <div className="min-h-screen bg-mesh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${mainPad}`}>
        <TopBar title={meta.title} subtitle={meta.subtitle || APP_HEADER} sidebarCollapsed={collapsed} />
        <main className="main-content flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <MobileDock menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} onMenuClose={() => setMenuOpen(false)} />
    </div>
  );
}
