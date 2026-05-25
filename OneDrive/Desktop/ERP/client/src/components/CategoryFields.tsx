import { FieldDef, FieldKey } from "../data/productFields";
import { colorSelectOptions } from "../data/colors";
import { Field, inputClass } from "./ui";

type Props = {
  fields: FieldDef[];
  values: Record<string, string | number>;
  onChange: (key: FieldKey, value: string | number) => void;
};

function selectOptions(field: FieldDef, values: Record<string, string | number>): string[] {
  const base = [...(field.options || [])];
  if (field.key === "colorVariant") {
    return colorSelectOptions(String(values.colorVariant || ""));
  }
  const current = String(values[field.key] ?? "").trim();
  if (current && !base.includes(current)) return [current, ...base];
  return base;
}

export function CategoryFields({ fields, values, onChange }: Props) {
  return (
    <>
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          {field.type === "select" ? (
            <select
              className={inputClass}
              value={String(values[field.key] ?? "")}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="">{field.required ? `Select ${field.label.toLowerCase()}` : "—"}</option>
              {selectOptions(field, values).map((opt) => (
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
      ))}
    </>
  );
}
