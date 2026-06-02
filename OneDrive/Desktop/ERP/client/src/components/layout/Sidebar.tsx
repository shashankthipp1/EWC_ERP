import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { brand, mainNav } from "../../design-system/tokens";
import { usePermissions } from "../../hooks/usePermissions";
import { navIconMap } from "./navIcons";
import { Badge } from "../ui";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const { canManageUsers } = usePermissions();
  const width = collapsed ? "w-[80px]" : "w-[280px]";
  const items = mainNav.filter((item) => !item.adminOnly || canManageUsers);

  return (
    <aside className={`sidebar-shell fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 shadow-panel transition-[width] duration-300 lg:flex ${width}`}>
      <div className={`flex items-center border-b border-white/10 ${collapsed ? "justify-center px-2 py-5" : "gap-4 px-5 py-6"}`}>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white font-display text-lg font-extrabold text-[#123c87] shadow-soft">
          {brand.shortName}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{brand.name}</p>
            <p className="mt-1 text-xs leading-snug text-sidebar-muted">Welcome, Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = navIconMap[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex min-h-[48px] items-center gap-4 rounded-xl text-sm font-semibold transition ${
                  collapsed ? "justify-center px-2" : "px-4"
                } ${isActive ? "nav-item-active !text-navy" : "nav-item-idle"}`
              }
            >
              <Icon size={22} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!collapsed && user && (
          <div className="mb-3 rounded-xl border border-white/20 bg-white/10 p-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-sm text-sidebar-muted">{user.email}</p>
            <Badge tone="brand" className="mt-2 !border-white/30 !bg-white/20 !text-white">
              {user.role}
            </Badge>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={`mb-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 text-sm text-sidebar-muted hover:bg-white/10 ${collapsed ? "px-0" : "px-3"}`}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && "Hide menu"}
        </button>
        <button
          type="button"
          onClick={logout}
          className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 text-sm font-medium text-sidebar-muted hover:bg-white/10 ${collapsed ? "px-0" : "px-3"}`}
        >
          <LogOut size={20} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
