import { clsx } from "clsx";
import { X } from "lucide-react";
import { useUiStore } from "../../store/uiStore";

const toneStyles = {
  critical: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-accent/30 bg-accentSoft text-accent"
};

export function ActivityFeed({ className = "" }: { className?: string }) {
  const { notifications, dismissNotification } = useUiStore();

  return (
    <div className={clsx("space-y-2", className)}>
      {notifications.map((item) => (
        <article
          key={item.id}
          className="group flex gap-3 rounded-xl border border-line bg-panel/80 p-3 shadow-soft transition hover:border-brand/20"
        >
          <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", toneStyles[item.tone])}>
            <item.icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-cream">{item.title}</p>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted">{item.time}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => dismissNotification(item.id)}
            className="shrink-0 rounded-lg p-1 text-muted opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </article>
      ))}
    </div>
  );
}
