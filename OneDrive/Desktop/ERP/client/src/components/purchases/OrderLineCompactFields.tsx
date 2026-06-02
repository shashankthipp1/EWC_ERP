import { colorSelectOptions } from "../../data/colors";
import {
  FieldDef,
  FieldKey,
  formValuesForFields,
  getOrderFieldDefs,
  OrderLineValues,
  parseColorsFromVariant
} from "../../data/productFields";
import { compactInputClass } from "../ui";

type Props = {
  line: OrderLineValues;
  colorOptions: string[];
  onChange: (key: FieldKey, value: string | number) => void;
};

function CompactField({
  field,
  values,
  colorOptions,
  onChange
}: {
  field: FieldDef;
  values: Record<string, string | number>;
  colorOptions: string[];
  onChange: (key: FieldKey, value: string | number) => void;
}) {
  const label = field.label.replace(" name", "").replace(" number", "#");

  if (field.type === "multiColor") {
    const opts = colorSelectOptions(String(values.colorVariant || ""), colorOptions);
    return (
      <label className="flex min-w-[88px] flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
        <select
          className={compactInputClass}
          value={String(values.colorVariant ?? "")}
          onChange={(e) => onChange("colorVariant", e.target.value)}
        >
          <option value="">Color</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "select") {
    const opts = field.options || [];
    const current = String(values[field.key] ?? "");
    const list = current && !opts.includes(current) ? [current, ...opts] : [...opts];
    return (
      <label className="flex min-w-[88px] flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
        <select className={compactInputClass} value={current} onChange={(e) => onChange(field.key, e.target.value)}>
          <option value="">—</option>
          {list.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex min-w-[72px] flex-1 flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <input
        className={compactInputClass}
        type={field.type === "number" ? "number" : "text"}
        min={field.type === "number" ? 0 : undefined}
        placeholder={field.placeholder}
        value={field.type === "number" ? String(values[field.key] ?? "") : String(values[field.key] ?? "")}
        onChange={(e) =>
          onChange(field.key, field.type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)
        }
      />
    </label>
  );
}

export function OrderLineCompactFields({ line, colorOptions, onChange }: Props) {
  const fields = getOrderFieldDefs(line.category, colorOptions).filter((f) => f.key !== "quantity");
  const values = formValuesForFields(line);
  const selectedUnitColors = parseColorsFromVariant(line.colorVariant);
  const selectableColors = colorSelectOptions(String(values.colorVariant || ""), colorOptions);

  function setUnitColor(index: number, color: string) {
    const next = Array.from({ length: Math.max(1, line.quantity) }, (_, i) => selectedUnitColors[i] || selectedUnitColors[0] || "");
    next[index] = color;
    onChange("colorVariant", next.filter(Boolean).join(" | "));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {fields.map((field) => (
        <CompactField key={field.key} field={field} values={values} colorOptions={colorOptions} onChange={onChange} />
      ))}
      {line.category === "Wall Clocks" && line.quantity > 1 && (
        <div className="w-full rounded-lg border border-line/70 bg-surface-2/50 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Color split (per unit)</p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: line.quantity }).map((_, idx) => (
              <label key={idx} className="flex items-center gap-2 text-[11px]">
                <span className="w-8 shrink-0 text-muted">#{idx + 1}</span>
                <select
                  className={compactInputClass}
                  value={selectedUnitColors[idx] || selectedUnitColors[0] || ""}
                  onChange={(e) => setUnitColor(idx, e.target.value)}
                >
                  <option value="">Color</option>
                  {selectableColors.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
