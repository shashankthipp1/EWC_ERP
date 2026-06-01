import { ChevronLeft, ChevronRight, LogOut, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { brand, navSections } from "../../design-system/tokens";
import { navIconMap } from "./navIcons";
import { Badge } from "../ui";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const width = collapsed ? "w-[76px]" : "w-[268px]";

  return (
    <aside
      className={`sidebar-shell fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] shadow-panel transition-[width] duration-300 lg:flex ${width}`}
    >
      <div className={`flex items-center border-b border-white/[0.08] ${collapsed ? "justify-center px-2 py-5" : "gap-3 px-5 py-5"}`}>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-navy shadow-glow">
          <Sparkles size={20} strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight">{brand.name}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">{brand.tagline}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-muted/80">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = navIconMap[item.icon];
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
                        collapsed ? "justify-center px-2" : "px-3"
                      } ${isActive ? "nav-item-active !text-navy" : "nav-item-idle"}`
                    }
                  >
                    <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        {!collapsed && user && (
          <div className="mb-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
              </div>
              <Badge tone="brand">{user.role}</Badge>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-sidebar-muted transition hover:bg-white/[0.06] hover:text-sidebar-text ${collapsed ? "px-0" : "px-3"}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          type="button"
          onClick={logout}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-sidebar-muted transition hover:border-white/20 hover:bg-white/[0.05] hover:text-sidebar-text ${collapsed ? "px-0" : "px-3"}`}
        >
          <LogOut size={16} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
