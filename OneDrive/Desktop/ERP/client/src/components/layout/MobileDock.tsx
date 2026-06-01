import {
  BarChart3,
  Bell,
  LogOut,
  MoreHorizontal,
  Package,
  ScanLine,
  Settings,
  Truck,
  Wallet,
  Wrench,
  X
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { brand } from "../../design-system/tokens";
import { Badge, Button } from "../ui";

const dock = [
  { to: "/", label: "Home", icon: BarChart3, end: true },
  { to: "/billing", label: "POS", icon: ScanLine },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/orders", label: "PO", icon: Truck }
];

const more = [
  { to: "/notifications", label: "Feed", icon: Bell },
  { to: "/finance", label: "Spend", icon: Wallet },
  { to: "/repairs", label: "Service", icon: Wrench },
  { to: "/settings", label: "Setup", icon: Settings }
];

type Props = {
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
};

export function MobileDock({ menuOpen, onMenuOpen, onMenuClose }: Props) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    onMenuClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-navyLight/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {dock.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex flex-1 justify-center">
              {({ isActive }) => (
                <span
                  className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold ${
                    isActive ? "text-brand" : "text-muted"
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={onMenuOpen} className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-muted">
            <MoreHorizontal size={22} />
            More
          </button>
        </div>
      </nav>

      {menuOpen && <button type="button" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onMenuClose} aria-label="Close" />}

      <aside
        className={`fixed bottom-0 left-0 right-0 z-[60] max-h-[88vh] overflow-hidden rounded-t-3xl border border-line bg-panel shadow-panel transition-transform duration-300 lg:hidden ${
          menuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-display font-bold text-cream">{brand.name}</p>
            <p className="text-xs text-muted">{brand.tagline}</p>
          </div>
          <button type="button" onClick={onMenuClose} className="grid h-10 w-10 place-items-center rounded-xl border border-line">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          {user && (
            <div className="mb-4 rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <Badge tone="brand">{user.role}</Badge>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {more.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMenuClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center gap-2 rounded-xl border px-3 text-sm font-medium ${
                    isActive ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-cream/80"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="border-t border-line p-4">
          <Button variant="secondary" className="w-full" onClick={() => { onMenuClose(); logout(); }}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
