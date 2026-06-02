import { clsx } from "clsx";
import {
  AlarmClock,
  Battery,
  Calculator,
  Clock,
  LayoutGrid,
  Plug,
  Scissors,
  Flashlight
} from "lucide-react";
import { ACTIVE_PRODUCT_CATEGORIES } from "../../data/categories";

const ICONS: Record<string, typeof Clock> = {
  "Wall Clocks": Clock,
  "Alarm Clocks": AlarmClock,
  Trimmers: Scissors,
  Calculators: Calculator,
  "Torch Lights": Flashlight,
  "Watch Batteries": Battery,
  "Mobile Accessories": Plug
};

type Props = {
  active: string;
  onChange: (category: string) => void;
  vertical?: boolean;
};

export function CategoryBar({ active, onChange, vertical = false }: Props) {
  const containerClass = vertical
    ? "flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-none"
    : "-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none";
  const baseBtn = vertical
    ? "flex min-h-[46px] w-full shrink-0 items-center justify-start gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.97]"
    : "flex min-h-[56px] min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-xs font-bold transition active:scale-[0.97]";
  const itemBtn = vertical
    ? "flex min-h-[46px] w-full shrink-0 items-center justify-start gap-2 rounded-xl border px-3 py-2 text-xs font-bold leading-tight transition active:scale-[0.97]"
    : "flex min-h-[56px] min-w-[80px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[10px] font-bold leading-tight transition active:scale-[0.97]";

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={() => onChange("")}
        className={clsx(
          baseBtn,
          !active ? "border-brand bg-brand/15 text-brand" : "border-line bg-surface-2 text-muted"
        )}
      >
        <LayoutGrid size={22} />
        <span>All</span>
      </button>
      {ACTIVE_PRODUCT_CATEGORIES.map((cat) => {
        const Icon = ICONS[cat] || LayoutGrid;
        const on = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={clsx(
              itemBtn,
              on ? "border-brand bg-brand/15 text-brand" : "border-line bg-surface-2 text-muted"
            )}
          >
            <Icon size={22} strokeWidth={on ? 2.5 : 2} />
            <span className={clsx(vertical ? "text-left text-[11px]" : "max-w-[72px] text-center")}>{cat.replace(" ", vertical ? " " : "\n")}</span>
          </button>
        );
      })}
    </div>
  );
}
