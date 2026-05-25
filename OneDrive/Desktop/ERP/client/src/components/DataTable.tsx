import { ReactNode } from "react";
import { Button } from "./ui";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Hide on mobile card view (e.g. actions column still shown) */
  hideOnMobile?: boolean;
  mobileLabel?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
};

export function DataTable<T>({ columns, rows, rowKey, page, pages, onPageChange, emptyMessage = "No records found" }: Props<T>) {
  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const actionColumn = columns.find((c) => c.key === "actions");

  return (
    <div>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.08] bg-navyLight/40 px-4 py-12 text-center text-sm text-muted">
            {emptyMessage}
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={rowKey(row)}
              className="rounded-2xl border border-white/[0.08] bg-navyLight/50 p-4 shadow-soft"
            >
              <dl className="space-y-2.5">
                {mobileColumns.map((col) => {
                  const value = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode;
                  if (col.key === "actions") return null;
                  return (
                    <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
                        {col.mobileLabel || col.header}
                      </dt>
                      <dd className="min-w-0 text-right font-medium text-cream">{value}</dd>
                    </div>
                  );
                })}
              </dl>
              {actionColumn?.render && (
                <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-3">{actionColumn.render(row)}</div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-navyLight/40 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                {columns.map((col) => (
                  <th key={col.key} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center text-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={rowKey(row)}
                    className={`border-t border-white/[0.04] transition hover:bg-white/[0.03] ${idx % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-5 py-3.5 text-cream/90 ${col.className || ""}`}>
                        {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted sm:text-left">
            Page <span className="font-semibold text-cream">{page}</span> of {pages}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button className="w-full sm:w-auto" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
