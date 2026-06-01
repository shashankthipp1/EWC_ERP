import { Calendar, Download, FileBarChart2, History, Printer, ReceiptText, RefreshCw, Trash2, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { EwcReportHub } from "../components/ewc/EwcReportHub";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, MetricCard, SectionHeader, inputClass } from "../components/ui";
import { exportRowsToExcel, exportRowsToPdf } from "../utils/exporters";
import { currency, formatDate, formatDateTime } from "../utils/format";

type ReportTab = "sales" | "all";

type DeleteTarget = {
  type: "sale" | "repair" | "expense";
  id: string;
  label: string;
  detail?: string;
};

type HistoryEntry = {
  date: string;
  salesCount: number;
  salesTotal: number;
  collection: number;
  repairCount: number;
  repairCollection: number;
  expenseTotal: number;
  netProfit: number;
};

type DailyReport = {
  date: string;
  generatedAt: string;
  sales: {
    count: number;
    subtotal: number;
    gstAmount: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    grossProfit: number;
    cogs: number;
    bills: Array<{
      _id: string;
      billNumber: string;
      customerName: string;
      customerPhone: string;
      itemCount: number;
      totalAmount: number;
      paidAmount: number;
      paymentMethod: string;
      status: string;
      staffName: string;
      createdAt: string;
    }>;
  };
  repairs: {
    count: number;
    advanceCollected: number;
    items: Array<{
      _id: string;
      receiptNumber: string;
      customerName: string;
      deviceType: string;
      advancePaid: number;
      repairStatus: string;
      createdAt: string;
    }>;
  };
  expenses: {
    count: number;
    total: number;
    items: Array<{
      _id: string;
      category: string;
      description: string;
      amount: number;
      paymentMode: string;
      date: string;
    }>;
  };
  summary: {
    collection: number;
    salesRevenue: number;
    salesCollection: number;
    repairCollection: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    isProfit: boolean;
  };
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function displayDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return formatDate(new Date(y, m - 1, d));
}

export function Reports() {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [tab, setTab] = useState<ReportTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["report-history"],
    queryFn: async () => (await api.get("/reports/history")).data as { history: HistoryEntry[] },
    refetchInterval: 60_000
  });

  const dailyQuery = useQuery({
    queryKey: ["daily-report", selectedDate],
    queryFn: async () =>
      (await api.get("/reports/daily", { params: { date: selectedDate } })).data as { report: DailyReport },
    refetchInterval: 30_000
  });

  const report = dailyQuery.data?.report;
  const history = historyQuery.data?.history || [];
  const isToday = selectedDate === todayKey();

  const exportRows = useMemo(() => {
    if (!report) return [];
    if (tab === "sales") {
      return report.sales.bills.map((bill) => ({
        Date: displayDate(report.date),
        "Bill No": bill.billNumber,
        Customer: bill.customerName,
        Phone: bill.customerPhone,
        Items: bill.itemCount,
        Total: bill.totalAmount,
        Paid: bill.paidAmount,
        Status: bill.status,
        Payment: bill.paymentMethod,
        Staff: bill.staffName,
        Time: formatDateTime(bill.createdAt)
      }));
    }
    return [
      ...report.sales.bills.map((bill) => ({
        Type: "Sale",
        Ref: bill.billNumber,
        Party: bill.customerName,
        Amount: bill.paidAmount,
        Detail: `${bill.itemCount} items · ${bill.paymentMethod}`,
        Time: formatDateTime(bill.createdAt)
      })),
      ...report.repairs.items.map((repair) => ({
        Type: "Repair",
        Ref: repair.receiptNumber,
        Party: repair.customerName,
        Amount: repair.advancePaid,
        Detail: `${repair.deviceType} · ${repair.repairStatus}`,
        Time: formatDateTime(repair.createdAt)
      })),
      ...report.expenses.items.map((expense) => ({
        Type: "Expense",
        Ref: expense.category,
        Party: expense.description,
        Amount: -expense.amount,
        Detail: expense.paymentMode,
        Time: formatDate(expense.date)
      }))
    ];
  }, [report, tab, selectedDate]);

  function refresh() {
    historyQuery.refetch();
    dailyQuery.refetch();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "sale") {
        await api.delete(`/sales/${deleteTarget.id}`);
        toast.success("Sale deleted — stock restored");
      } else if (deleteTarget.type === "repair") {
        await api.delete(`/repairs/${deleteTarget.id}`);
        toast.success("Repair deleted");
      } else {
        await api.delete(`/finance/expenses/${deleteTarget.id}`);
        toast.success("Expense deleted");
      }
      setDeleteTarget(null);
      refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function deleteMessage(target: DeleteTarget) {
    if (target.type === "sale") {
      return `Remove ${target.label}? Product quantities will be added back to inventory.`;
    }
    if (target.type === "repair") {
      return `Remove repair ${target.label}? This cannot be undone.`;
    }
    return `Remove expense "${target.label}"? Report totals will update immediately.`;
  }

  return (
    <div className="space-y-6">
      <EwcReportHub />
      <SectionHeader
        eyebrow="Live from your shop data"
        title="Sales & Daily Reports"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={refresh} disabled={dailyQuery.isFetching}>
              <RefreshCw size={16} className={dailyQuery.isFetching ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button
              variant="secondary"
              disabled={!exportRows.length}
              onClick={() => exportRowsToExcel(`report-${selectedDate}-${tab}`, exportRows)}
            >
              <Download size={16} /> Excel
            </Button>
            <Button
              variant="secondary"
              disabled={!exportRows.length}
              onClick={() =>
                exportRowsToPdf(
                  `report-${selectedDate}-${tab}`,
                  `${tab === "sales" ? "Sales" : "All"} Report — ${displayDate(selectedDate)}`,
                  exportRows
                )
              }
            >
              PDF
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card className="xl:sticky xl:top-24 xl:self-start">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="text-gold" />
            <h2 className="font-semibold">Report History</h2>
          </div>
          <p className="mb-3 text-xs text-cream/50">Every day with sales, repairs, or expenses. Tap a date — totals stay current.</p>
          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            {history.map((entry) => (
              <button
                key={entry.date}
                type="button"
                onClick={() => setSelectedDate(entry.date)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  selectedDate === entry.date
                    ? "border-gold/40 bg-gold/10 text-cream"
                    : "border-line/40 bg-navy/40 text-cream/80 hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{displayDate(entry.date)}</span>
                  {entry.date === todayKey() && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">Today</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-cream/50">
                  {entry.salesCount} sales · {entry.repairCount} repairs · {currency(entry.netProfit)} net
                </p>
              </button>
            ))}
            {!history.length && !historyQuery.isLoading && (
              <p className="text-sm text-cream/50">No activity yet. Record a sale to start history.</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex-1 min-w-[200px]">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <Calendar size={12} /> Report date
                </span>
                <input
                  className={inputClass}
                  type="date"
                  value={selectedDate}
                  max={todayKey()}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <Button variant={tab === "sales" ? "primary" : "secondary"} onClick={() => setTab("sales")}>
                  <ReceiptText size={16} /> Sales Report
                </Button>
                <Button variant={tab === "all" ? "primary" : "secondary"} onClick={() => setTab("all")}>
                  <FileBarChart2 size={16} /> All Report
                </Button>
              </div>
            </div>
            {report && (
              <p className="mt-3 text-xs text-cream/45">
                {isToday ? "Today’s report" : `Report for ${displayDate(selectedDate)}`} · updated{" "}
                {formatDateTime(report.generatedAt)}
              </p>
            )}
          </Card>

          {dailyQuery.isLoading && <p className="text-cream/60">Loading report…</p>}
          {dailyQuery.isError && <p className="text-danger">Could not load report. Check connection and try again.</p>}

          {report && tab === "sales" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Bills" value={String(report.sales.count)} detail="Sales invoices this day" icon={ReceiptText} />
                <MetricCard label="Sales total" value={currency(report.sales.totalAmount)} detail="Bill value (incl. GST)" icon={FileBarChart2} tone="gold" />
                <MetricCard label="Collected" value={currency(report.sales.paidAmount)} detail="Cash received from sales" icon={ReceiptText} tone="brand" />
                <MetricCard
                  label="Gross profit"
                  value={currency(report.sales.grossProfit)}
                  detail="Selling minus purchase cost"
                  icon={FileBarChart2}
                  tone={report.summary.isProfit ? "gold" : "violet"}
                />
              </div>
              <Card>
                <h2 className="mb-4 font-semibold">Sales bills ({report.sales.bills.length})</h2>
                <div className="space-y-2 max-h-[480px] overflow-y-auto">
                  {report.sales.bills.map((bill) => (
                    <div
                      key={bill._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line/40 bg-navy/40 px-3 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{bill.billNumber} · {bill.customerName}</p>
                        <p className="text-xs text-cream/50">
                          {bill.itemCount} items · {bill.paymentMethod} · {bill.staffName} · {formatDateTime(bill.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-gold">{currency(bill.totalAmount)}</p>
                          <p className="text-xs text-cream/50">
                            Paid {currency(bill.paidAmount)} · {bill.status}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="!min-h-8 !px-2 !text-xs text-danger"
                          onClick={() =>
                            setDeleteTarget({ type: "sale", id: bill._id, label: bill.billNumber })
                          }
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!report.sales.bills.length && <p className="text-cream/50">No sales on this date.</p>}
                </div>
              </Card>
            </>
          )}

          {report && tab === "all" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total collection" value={currency(report.summary.collection)} detail="Sales paid + repair advance" icon={FileBarChart2} />
                <MetricCard label="Expenses" value={currency(report.summary.totalExpenses)} detail={`${report.expenses.count} entries`} icon={FileBarChart2} tone="violet" />
                <MetricCard
                  label="Net profit / loss"
                  value={currency(report.summary.netProfit)}
                  detail="Profit from sales + repairs − expenses"
                  icon={FileBarChart2}
                  tone={report.summary.isProfit ? "gold" : "violet"}
                />
                <MetricCard label="Pending (sales)" value={currency(report.sales.pendingAmount)} detail="Unpaid bill balance" icon={ReceiptText} tone="brand" />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <ReceiptText size={16} className="text-gold" /> Sales
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-cream/60">Bills</dt><dd>{report.sales.count}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">Revenue</dt><dd>{currency(report.sales.totalAmount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">Collected</dt><dd className="text-gold">{currency(report.sales.paidAmount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">GST</dt><dd>{currency(report.sales.gstAmount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">Gross profit</dt><dd>{currency(report.sales.grossProfit)}</dd></div>
                  </dl>
                </Card>
                <Card>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Wrench size={16} className="text-accent" /> Repairs
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-cream/60">New jobs</dt><dd>{report.repairs.count}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">Advance collected</dt><dd className="text-gold">{currency(report.repairs.advanceCollected)}</dd></div>
                  </dl>
                  <div className="mt-4 max-h-48 space-y-1 overflow-y-auto">
                    {report.repairs.items.map((r) => (
                      <div key={r._id} className="flex items-center justify-between gap-2 text-xs">
                        <p className="text-cream/70">
                          {r.receiptNumber} · {r.customerName} · {currency(r.advancePaid)}
                        </p>
                        <Button
                          variant="ghost"
                          className="!min-h-7 !px-1.5 !text-[10px] text-danger"
                          onClick={() =>
                            setDeleteTarget({ type: "repair", id: r._id, label: r.receiptNumber })
                          }
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    {!report.repairs.items.length && <p className="text-cream/50 text-xs">No repairs this day.</p>}
                  </div>
                </Card>
                <Card>
                  <h3 className="mb-3 font-semibold">Expenditure</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-cream/60">Entries</dt><dd>{report.expenses.count}</dd></div>
                    <div className="flex justify-between"><dt className="text-cream/60">Total</dt><dd className="text-danger">{currency(report.expenses.total)}</dd></div>
                  </dl>
                  <div className="mt-4 max-h-48 space-y-1 overflow-y-auto">
                    {report.expenses.items.map((e) => (
                      <div key={e._id} className="flex items-center justify-between gap-2 text-xs">
                        <p className="text-cream/70">
                          {e.category} · {e.description} · {currency(e.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          className="!min-h-7 !px-1.5 !text-[10px] text-danger"
                          onClick={() =>
                            setDeleteTarget({
                              type: "expense",
                              id: e._id,
                              label: e.description,
                              detail: e.category
                            })
                          }
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    {!report.expenses.items.length && <p className="text-cream/50 text-xs">No expenses this day.</p>}
                  </div>
                </Card>
              </div>

              <Card>
                <h2 className="mb-4 font-semibold">Full day ledger</h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {report.sales.bills.map((bill) => (
                    <div
                      key={`sale-${bill._id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          <span className="text-gold">Sale</span> · {bill.billNumber}
                        </p>
                        <p className="text-xs text-cream/50">
                          {bill.customerName} · {bill.itemCount} items · {bill.paymentMethod} · {formatDateTime(bill.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gold">{currency(bill.paidAmount)}</span>
                        <Button
                          variant="ghost"
                          className="!min-h-8 !px-2 !text-xs text-danger"
                          onClick={() =>
                            setDeleteTarget({ type: "sale", id: bill._id, label: bill.billNumber })
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {report.repairs.items.map((repair) => (
                    <div
                      key={`repair-${repair._id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          <span className="text-accent">Repair</span> · {repair.receiptNumber}
                        </p>
                        <p className="text-xs text-cream/50">
                          {repair.customerName} · {repair.deviceType} · {repair.repairStatus} · {formatDateTime(repair.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gold">{currency(repair.advancePaid)}</span>
                        <Button
                          variant="ghost"
                          className="!min-h-8 !px-2 !text-xs text-danger"
                          onClick={() =>
                            setDeleteTarget({ type: "repair", id: repair._id, label: repair.receiptNumber })
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {report.expenses.items.map((expense) => (
                    <div
                      key={`expense-${expense._id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          <span className="text-danger">Expense</span> · {expense.category}
                        </p>
                        <p className="text-xs text-cream/50">
                          {expense.description} · {expense.paymentMode} · {formatDate(expense.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-danger">−{currency(expense.amount)}</span>
                        <Button
                          variant="ghost"
                          className="!min-h-8 !px-2 !text-xs text-danger"
                          onClick={() =>
                            setDeleteTarget({
                              type: "expense",
                              id: expense._id,
                              label: expense.description,
                              detail: expense.category
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!report.sales.bills.length && !report.repairs.items.length && !report.expenses.items.length && (
                    <p className="text-cream/50">No transactions on this date.</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget?.type === "sale"
            ? "Delete sale?"
            : deleteTarget?.type === "repair"
              ? "Delete repair?"
              : "Delete expense?"
        }
        message={deleteTarget ? deleteMessage(deleteTarget) : ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
