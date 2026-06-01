import { ReactNode } from "react";
import { Button } from "./ui";
import { EmptyState } from "./ui/EmptyState";
import { Inbox } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
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
  loading?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  page,
  pages,
  onPageChange,
  emptyMessage = "No records found",
  loading = false
}: Props<T>) {
  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const actionColumn = columns.find((c) => c.key === "actions");

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-14 rounded-xl border border-line" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={emptyMessage} />
        ) : (
          rows.map((row) => (
            <article key={rowKey(row)} className="rounded-2xl border border-line bg-panel/80 p-4 shadow-soft">
              <dl className="space-y-2.5">
                {mobileColumns.map((col) => {
                  const value = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode;
                  if (col.key === "actions") return null;
                  return (
                    <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                        {col.mobileLabel || col.header}
                      </dt>
                      <dd className="min-w-0 text-right font-medium text-cream">{value}</dd>
                    </div>
                  );
                })}
              </dl>
              {actionColumn?.render && (
                <div className="mt-4 flex justify-end border-t border-line pt-3">{actionColumn.render(row)}</div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-panel/60 shadow-soft md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/90">
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
                  <td colSpan={columns.length} className="px-5 py-12">
                    <EmptyState icon={Inbox} title={emptyMessage} />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={rowKey(row)} className="data-grid-row">
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
