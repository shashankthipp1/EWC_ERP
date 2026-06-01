import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { clsx } from "clsx";

export function QuickAction({
  to,
  icon: Icon,
  label,
  primary
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={clsx(
        "flex min-h-[56px] flex-1 items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-base font-bold transition active:scale-[0.98]",
        primary
          ? "border-brand/40 bg-gradient-brand text-navy shadow-glow"
          : "border-line bg-surface-2 text-cream hover:border-brand/30"
      )}
    >
      <Icon size={24} strokeWidth={2} />
      {label}
    </Link>
  );
}
