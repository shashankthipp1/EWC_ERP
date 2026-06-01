import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export { EmptyState } from "./ui/EmptyState";
export { Tabs } from "./ui/Tabs";
export type { TabItem } from "./ui/Tabs";
export { ActivityFeed } from "./ui/ActivityFeed";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={clsx("enterprise-card p-4 sm:p-6", className)}>{children}</section>;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-gradient-brand text-navy shadow-glow hover:brightness-105 active:scale-[0.98]",
    secondary: "border border-line bg-surface-2/80 text-cream hover:bg-white/[0.06]",
    outline: "border border-brand/40 bg-transparent text-brand hover:bg-brand/10",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "bg-transparent text-cream/80 hover:bg-white/[0.06] hover:text-cream"
  };
  const sizes = {
    sm: "min-h-8 px-3 py-1.5 text-xs",
    md: "min-h-10 px-4 py-2 text-sm",
    lg: "min-h-12 px-6 py-3 text-base"
  };
  return (
    <button
      className={clsx(
        "inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[44px] touch-manipulation rounded-xl border border-line bg-navyLight/60 px-3.5 py-2.5 text-base text-cream shadow-inner outline-none transition placeholder:text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/15 sm:text-sm";

export function Badge({
  children,
  tone = "neutral",
  className = ""
}: {
  children: ReactNode;
  tone?: "gold" | "brand" | "success" | "danger" | "neutral" | "accent";
  className?: string;
}) {
  const tones = {
    gold: "border-brand/30 bg-brand/10 text-brand",
    brand: "border-brand/30 bg-brand/10 text-brand",
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-danger/30 bg-danger/10 text-danger",
    neutral: "border-line bg-surface-2 text-muted",
    accent: "border-accent/30 bg-accentSoft text-accent"
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "h-32" }: { className?: string }) {
  return <div className={clsx("skeleton-shimmer rounded-2xl border border-line", className)} />;
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "brand",
  trend
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon: LucideIcon;
  tone?: "gold" | "brand" | "success" | "danger" | "neutral" | "violet" | "accent";
  trend?: ReactNode;
}) {
  const tones = {
    gold: "from-brand/20 to-brand/5 text-brand ring-brand/20",
    brand: "from-brand/20 to-brand/5 text-brand ring-brand/20",
    success: "from-success/20 to-success/5 text-success ring-success/20",
    danger: "from-danger/20 to-danger/5 text-danger ring-danger/20",
    neutral: "from-white/10 to-white/5 text-cream ring-white/10",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 ring-violet-500/20",
    accent: "from-accent/20 to-accent/5 text-accent ring-accent/20"
  };
  return (
    <Card className="group relative overflow-hidden transition hover:shadow-lift">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand/5 blur-2xl transition group-hover:bg-brand/10" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">{value}</p>
          {detail && <p className="mt-2 text-xs text-muted">{detail}</p>}
          {trend && <div className="mt-2">{trend}</div>}
        </div>
        <div className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1", tones[tone])}>
          <Icon size={22} strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
            <span className="hidden h-px w-6 bg-brand/60 sm:inline" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={clsx("page-shell animate-slide-up", className)}>{children}</div>;
}
