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
};

export function CategoryBar({ active, onChange }: Props) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onChange("")}
        className={clsx(
          "flex min-h-[56px] min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-xs font-bold transition active:scale-[0.97]",
          !active ? "border-brand bg-brand/15 text-brand" : "border-line bg-surface-2 text-muted"
        )}
      >
        <LayoutGrid size={22} />
        All
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
              "flex min-h-[56px] min-w-[80px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[10px] font-bold leading-tight transition active:scale-[0.97]",
              on ? "border-brand bg-brand/15 text-brand" : "border-line bg-surface-2 text-muted"
            )}
          >
            <Icon size={22} strokeWidth={on ? 2.5 : 2} />
            <span className="max-w-[72px] text-center">{cat.replace(" ", "\n")}</span>
          </button>
        );
      })}
    </div>
  );
}
