import { FieldDef, FieldKey } from "../data/productFields";
import { colorSelectOptions } from "../data/colors";
import { MultiColorField } from "./MultiColorField";
import { Field, inputClass } from "./ui";

type Props = {
  fields: FieldDef[];
  values: Record<string, string | number>;
  onChange: (key: FieldKey, value: string | number) => void;
  quantity?: number;
  colorOptions?: string[];
  canAddColors?: boolean;
  onAddColor?: (color: string) => Promise<void>;
};

function selectOptions(field: FieldDef, values: Record<string, string | number>, colorOptions: string[]): string[] {
  if (field.key === "colorVariant" && field.type === "select") {
    return colorSelectOptions(String(values.colorVariant || ""), colorOptions);
  }
  const base = [...(field.options || [])];
  const current = String(values[field.key] ?? "").trim();
  if (current && !base.includes(current)) return [current, ...base];
  return base;
}

export function CategoryFields({
  fields,
  values,
  onChange,
  quantity = 1,
  colorOptions = [],
  canAddColors,
  onAddColor
}: Props) {
  return (
    <>
      {fields.map((field) => {
        if (field.type === "multiColor") {
          return (
            <MultiColorField
              key={field.key}
              label={field.label}
              quantity={quantity}
              value={String(values.colorVariant ?? "")}
              options={colorSelectOptions(String(values.colorVariant || ""), colorOptions)}
              onChange={(v) => onChange("colorVariant", v)}
              canAddColors={canAddColors}
              onAddColor={onAddColor}
            />
          );
        }

        return (
          <Field key={field.key} label={field.label}>
            {field.type === "select" ? (
              <select
                className={inputClass}
                value={String(values[field.key] ?? "")}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                <option value="">{field.required ? `Select ${field.label.toLowerCase()}` : "—"}</option>
                {selectOptions(field, values, colorOptions).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                type={field.type}
                min={field.type === "number" ? 0 : undefined}
                placeholder={field.placeholder}
                value={field.type === "number" ? String(values[field.key] ?? 0) : String(values[field.key] ?? "")}
                onChange={(e) =>
                  onChange(field.key, field.type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)
                }
              />
            )}
          </Field>
        );
      })}
    </>
  );
}
