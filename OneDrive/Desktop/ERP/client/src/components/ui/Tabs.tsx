import { clsx } from "clsx";

export type TabItem = { id: string; label: string; badge?: string | number };

export function Tabs({
  tabs,
  active,
  onChange,
  className = ""
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface-2/80 p-1 mobile-scroll-x", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
            active === tab.id ? "bg-brand text-navy shadow-soft" : "text-muted hover:bg-white/[0.04] hover:text-cream"
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                active === tab.id ? "bg-navy/20 text-navy" : "bg-white/10 text-muted"
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
