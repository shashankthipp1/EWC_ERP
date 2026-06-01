import { Plus, Trash2 } from "lucide-react";
import { ACTIVE_PRODUCT_CATEGORIES } from "../../data/categories";
import { FieldKey, OrderLineValues, orderLineDisplayLabel } from "../../data/productFields";
import { Button, compactInputClass } from "../ui";
import { OrderLineCompactFields } from "./OrderLineCompactFields";

type Props = {
  lines: OrderLineValues[];
  colorOptions: string[];
  canEdit: boolean;
  onAddLine: () => void;
  onUpdate: (index: number, key: FieldKey, value: string | number) => void;
  onCategoryChange: (index: number, category: OrderLineValues["category"]) => void;
  onRemove: (index: number) => void;
};

export function OrderLineTable({ lines, colorOptions, canEdit, onAddLine, onUpdate, onCategoryChange, onRemove }: Props) {
  if (!lines.length) {
    return (
      <div className="rounded-xl border border-dashed border-line py-10 text-center">
        <p className="text-sm text-muted">No items yet</p>
        {canEdit && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onAddLine}>
            <Plus size={16} /> Add first line
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="hidden overflow-hidden rounded-xl border border-line md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/80 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="w-10 px-3 py-2">#</th>
              <th className="w-[130px] px-2 py-2">Category</th>
              <th className="px-2 py-2">Product details</th>
              <th className="w-[72px] px-2 py-2">Qty</th>
              {canEdit && <th className="w-10 px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-b border-line/60 align-top hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-xs text-muted">{i + 1}</td>
                <td className="px-2 py-2">
                  {canEdit ? (
                    <select
                      className={compactInputClass}
                      value={line.category}
                      onChange={(e) => onCategoryChange(i, e.target.value as OrderLineValues["category"])}
                    >
                      {ACTIVE_PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs">{line.category}</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {canEdit ? (
                    <OrderLineCompactFields line={line} colorOptions={colorOptions} onChange={(k, v) => onUpdate(i, k, v)} />
                  ) : (
                    <span className="text-sm">{orderLineDisplayLabel(line) || "—"}</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {canEdit ? (
                    <input
                      type="number"
                      min={1}
                      className={`${compactInputClass} text-center font-semibold`}
                      value={line.quantity || ""}
                      onChange={(e) => onUpdate(i, "quantity", Number(e.target.value) || 1)}
                    />
                  ) : (
                    <span className="font-semibold">{line.quantity}</span>
                  )}
                </td>
                {canEdit && (
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: slim stacked rows */}
      <ul className="space-y-2 md:hidden">
        {lines.map((line, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface-2/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted">Line {i + 1}</span>
              {canEdit && (
                <button type="button" onClick={() => onRemove(i)} className="text-danger">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {canEdit ? (
              <>
                <select
                  className={`${compactInputClass} mb-2`}
                  value={line.category}
                  onChange={(e) => onCategoryChange(i, e.target.value as OrderLineValues["category"])}
                >
                  {ACTIVE_PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <OrderLineCompactFields line={line} colorOptions={colorOptions} onChange={(k, v) => onUpdate(i, k, v)} />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted">Qty</span>
                  <input
                    type="number"
                    min={1}
                    className={`${compactInputClass} max-w-[80px]`}
                    value={line.quantity}
                    onChange={(e) => onUpdate(i, "quantity", Number(e.target.value) || 1)}
                  />
                </label>
              </>
            ) : (
              <p className="text-sm">
                {line.category} · {orderLineDisplayLabel(line)} · ×{line.quantity}
              </p>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <button
          type="button"
          onClick={onAddLine}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm font-medium text-muted transition hover:border-brand/40 hover:text-brand"
        >
          <Plus size={16} /> Add another line
        </button>
      )}
    </div>
  );
}
