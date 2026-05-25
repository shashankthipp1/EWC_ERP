import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LogOut,
  Settings,
  ReceiptText,
  Wrench,
  X
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME } from "../constants/branding";
import { Badge } from "./ui";

const bottomNav = [
  { to: "/", label: "Insights", icon: BarChart3, end: true },
  { to: "/inventory", label: "Stock", icon: Boxes },
  { to: "/billing", label: "Sales", icon: ReceiptText },
  { to: "/orders", label: "Orders", icon: ClipboardList }
];

const menuNav = [
  { to: "/repairs", label: "Repairs", icon: Wrench },
  { to: "/finance", label: "Expenditure", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/settings", label: "Settings", icon: Settings }
];

type Props = {
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
};

export function MobileNav({ menuOpen, onMenuOpen, onMenuClose }: Props) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    onMenuClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close drawer on route change only
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
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-navyLight/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {bottomNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex flex-1 justify-center">
              {({ isActive }) => (
                <span
                  className={`flex min-h-[52px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
                    isActive ? "text-gold" : "text-cream/55"
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onMenuOpen}
            className={`flex min-h-[52px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
              menuOpen ? "text-gold" : "text-cream/55"
            }`}
            aria-label="Open menu"
          >
            <Settings size={22} />
            More
          </button>
        </div>
      </nav>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMenuClose}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 right-0 z-[60] max-h-[85vh] overflow-hidden rounded-t-3xl border border-white/[0.08] bg-panel shadow-panel transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-sm font-bold text-cream">{APP_NAME}</p>
            <p className="text-xs text-muted">All modules</p>
          </div>
          <button
            type="button"
            onClick={onMenuClose}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-cream active:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(85vh - 140px)" }}>
          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cream">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <Badge tone="gold">{user?.role}</Badge>
            </div>
          </div>

          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-cream/35">More modules</p>
          <div className="space-y-1">
            {menuNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMenuClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-medium transition active:scale-[0.99] ${
                    isActive ? "bg-gold/15 text-gold" : "text-cream/80 active:bg-white/5"
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onMenuClose();
              logout();
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-cream/80 active:bg-white/5"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
