import { Plus } from "lucide-react";
import { useState } from "react";
import { joinColors, parseColorsFromVariant } from "../data/productFields";
import { Button, Field, inputClass } from "./ui";

type Props = {
  label: string;
  quantity: number;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddColor?: (color: string) => Promise<void>;
  canAddColors?: boolean;
};

export function MultiColorField({ label, quantity, value, options, onChange, onAddColor, canAddColors }: Props) {
  const selected = parseColorsFromVariant(value);
  const multi = quantity > 1;
  const [newColor, setNewColor] = useState("");

  function toggle(color: string) {
    if (!multi) {
      onChange(color);
      return;
    }
    const set = new Set(selected);
    if (set.has(color)) set.delete(color);
    else if (set.size < quantity) set.add(color);
    onChange(joinColors([...set]));
  }

  async function submitNewColor() {
    const c = newColor.trim();
    if (!c || !onAddColor) return;
    await onAddColor(c);
    setNewColor("");
    if (!multi) onChange(c);
  }

  return (
    <Field label={label} hint={multi ? `Select up to ${quantity} colors` : undefined}>
      <div className="flex flex-wrap gap-2">
        {options.map((color) => {
          const active = selected.includes(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggle(color)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:border-brand/30"
              }`}
            >
              {active && "✓ "}
              {color}
            </button>
          );
        })}
      </div>
      {canAddColors && onAddColor && (
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            placeholder="Add new color…"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" onClick={submitNewColor}>
            <Plus size={14} />
          </Button>
        </div>
      )}
    </Field>
  );
}
