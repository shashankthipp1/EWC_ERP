import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LogOut,
  ReceiptText,
  Settings,
  Clock,
  Wrench
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, APP_TAGLINE } from "../constants/branding";
import { MobileNav } from "./MobileNav";
import { Badge } from "./ui";

const nav = [
  { to: "/", label: "Insights", icon: BarChart3 },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/billing", label: "Sales", icon: ReceiptText },
  { to: "/orders", label: "Order Lists", icon: ClipboardList },
  { to: "/repairs", label: "Repairs", icon: Wrench },
  { to: "/finance", label: "Expenditure", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/settings", label: "Settings", icon: Settings }
];

const routeTitles: Record<string, string> = {
  "/": "Shop Insights",
  "/inventory": "Inventory",
  "/billing": "Sales",
  "/orders": "Orders",
  "/repairs": "Repairs",
  "/finance": "Expenditure",
  "/reports": "Reports",
  "/settings": "Settings",
  "/customers": "Customers",
  "/staff": "Staff",
  "/notifications": "Alerts"
};

export function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = routeTitles[pathname] || "Workspace";

  return (
    <div className="min-h-screen lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-white/[0.06] bg-navyLight/95 backdrop-blur-2xl lg:flex">
        <div className="border-b border-white/[0.06] px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold to-goldLight text-navy shadow-glow">
              <Clock size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-cream">{APP_NAME}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">{APP_TAGLINE}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/35">Operations</p>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm ${isActive ? "nav-item-active" : "nav-item-idle"}`
              }
            >
              <item.icon size={18} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-cream">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <Badge tone="gold">{user?.role}</Badge>
            </div>
            <button
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-cream/80 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-cream"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[280px]">
        <header
          className="sticky top-0 z-20 border-b border-white/[0.06] bg-navyLight/90 backdrop-blur-xl"
          style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8 lg:py-4">
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">{APP_NAME}</p>
              <h2 className="truncate text-lg font-semibold text-cream">{pageTitle}</h2>
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Enterprise workspace</p>
              <h2 className="text-lg font-semibold text-cream">{pageTitle}</h2>
            </div>
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <Badge tone="accent">Live</Badge>
              <span className="text-xs text-muted">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </header>

        <main className="main-content flex-1 bg-mesh px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <MobileNav menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} onMenuClose={() => setMenuOpen(false)} />
    </div>
  );
}
