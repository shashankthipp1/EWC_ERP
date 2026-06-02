import { Bell, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Badge, Button } from "../ui";

type Props = {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
};

export function TopBar({ title, subtitle, sidebarCollapsed }: Props) {
  const { theme, toggleTheme } = useTheme();
  const pad = sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[268px]";

  return (
    <header className={`sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur ${pad}`} style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">EWC ERP</p>
          <h1 className="font-display text-xl font-bold tracking-tight text-cream sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 md:flex">
            <Search size={16} className="text-muted" />
            <input
              className="w-44 bg-transparent text-sm outline-none placeholder:text-muted"
              placeholder="Search product, bill…"
              readOnly
              aria-hidden
            />
          </div>
          <Badge tone="success" className="hidden sm:inline-flex">
            Live
          </Badge>
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Link to="/notifications">
            <Button variant="secondary" size="sm" className="!min-w-10 !border-line !bg-surface-2 !px-2.5 !text-cream" aria-label="Notifications">
              <Bell size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
