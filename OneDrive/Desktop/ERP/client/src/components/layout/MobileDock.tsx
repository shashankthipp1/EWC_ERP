import { LayoutDashboard, LogOut, MoreHorizontal, Package, ReceiptText, ScanLine, X } from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { brand, mainNav } from "../../design-system/tokens";
import { usePermissions } from "../../hooks/usePermissions";
import { navIconMap } from "./navIcons";
import { Badge, Button } from "../ui";

const dockPrimary = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/inventory", label: "Stock", icon: Package },
  { to: "/billing", label: "Bill", icon: ScanLine },
  { to: "/sales", label: "Sales", icon: ReceiptText }
] as const;

type Props = {
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
};

export function MobileDock({ menuOpen, onMenuOpen, onMenuClose }: Props) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { canManageUsers } = usePermissions();
  const moreItems = mainNav.filter((n) => !dockPrimary.some((d) => d.to === n.to)).filter((i) => !i.adminOnly || canManageUsers);

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
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-navyLight/98 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-5 gap-0 px-1 pt-1">
          {dockPrimary.map((item) => (
            <NavLink key={item.to} to={item.to} end={"end" in item ? item.end : false} className="flex justify-center">
              {({ isActive }) => (
                <span className={`flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${isActive ? "text-brand" : "text-muted"}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={onMenuOpen} className="flex min-h-[56px] flex-col items-center justify-center text-[11px] font-bold text-muted">
            <MoreHorizontal size={24} />
            More
          </button>
        </div>
      </nav>

      {menuOpen && <button type="button" className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={onMenuClose} aria-label="Close" />}

      <aside
        className={`fixed bottom-0 left-0 right-0 z-[60] max-h-[90vh] overflow-hidden rounded-t-3xl border border-line bg-panel shadow-panel transition-transform lg:hidden ${
          menuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-display text-lg font-bold">{brand.name}</p>
            <p className="text-sm text-muted">{brand.tagline}</p>
          </div>
          <button type="button" onClick={onMenuClose} className="grid h-12 w-12 place-items-center rounded-xl border border-line">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          {user && (
            <div className="mb-4 rounded-2xl border border-line bg-surface-2 p-4">
              <p className="font-semibold">{user.name}</p>
              <Badge tone="brand" className="mt-2">
                {user.role}
              </Badge>
            </div>
          )}
          <div className="grid gap-2">
            {moreItems.map((item) => {
              const Icon = navIconMap[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onMenuClose}
                  className={({ isActive }) =>
                    `flex min-h-[52px] items-center gap-4 rounded-2xl border px-4 text-base font-semibold ${
                      isActive ? "border-brand/40 bg-brand/10 text-brand" : "border-line"
                    }`
                  }
                >
                  <Icon size={22} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
        <div className="border-t border-line p-4">
          <Button variant="secondary" className="w-full min-h-[52px] text-base" onClick={() => { onMenuClose(); logout(); }}>
            <LogOut size={20} /> Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
