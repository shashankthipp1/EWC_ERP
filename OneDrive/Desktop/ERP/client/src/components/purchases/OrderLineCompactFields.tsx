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

  return (
    <div className="flex flex-wrap items-end gap-2">
      {fields.map((field) => (
        <CompactField key={field.key} field={field} values={values} colorOptions={colorOptions} onChange={onChange} />
      ))}
      {line.category === "Wall Clocks" && line.quantity > 1 && parseColorsFromVariant(line.colorVariant).length > 1 && (
        <span className="self-center text-[10px] text-muted">({line.quantity} units)</span>
      )}
    </div>
  );
}
