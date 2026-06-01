import { clsx } from "clsx";
import { Banknote, CreditCard, Split, Smartphone } from "lucide-react";

const MODES = [
  { id: "Cash", label: "Cash", icon: Banknote },
  { id: "UPI", label: "UPI", icon: Smartphone },
  { id: "Card", label: "Card", icon: CreditCard },
  { id: "Mixed", label: "Split", icon: Split }
] as const;

type Props = {
  value: string;
  onChange: (mode: string) => void;
};

export function PaymentBar({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MODES.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={clsx(
              "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-bold transition active:scale-[0.97]",
              on ? "border-brand bg-brand text-navy shadow-glow" : "border-line bg-surface-2 text-muted"
            )}
          >
            <m.icon size={20} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
