import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { clsx } from "clsx";

export function SimpleStatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  onClick
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "accent";
  onClick?: () => void;
}) {
  const tones = {
    brand: "from-brand/20 to-brand/5 text-brand",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    danger: "from-danger/20 to-danger/5 text-danger",
    accent: "from-accent/20 to-accent/5 text-accent"
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={clsx(
        "enterprise-card flex w-full min-h-[120px] flex-col justify-between p-5 text-left transition",
        onClick && "hover:shadow-lift active:scale-[0.99]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={clsx("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ring-1 ring-black/5", tones[tone])}>
          <Icon size={28} strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-base font-medium text-muted">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight text-cream">{value}</p>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
    </Tag>
  );
}
