import { IndianRupee, Plus, Trash2, Wallet } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PaymentBar } from "../components/pos/PaymentBar";
import { Button, Card, Field, PageShell, compactInputClass, inputClass } from "../components/ui";
import { EXPENSE_CATEGORIES } from "../data/categories";
import { currency, formatDate } from "../utils/format";

type ExpenseRow = {
  _id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
};

export function Finance() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState({
    category: "Miscellaneous",
    description: "",
    amount: 0,
    paymentMode: "Cash",
    date: new Date().toISOString().slice(0, 10)
  });
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/finance/expenses");
      setExpenses(data.expenses);
    } catch {
      toast.error("Could not load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const todayTotal = useMemo(
    () =>
      expenses
        .filter((e) => formatDate(e.date) === formatDate(new Date()))
        .reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const monthTotal = useMemo(
    () =>
      expenses
        .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
        .reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/finance/expenses/${deleteTarget._id}`);
      toast.success("Expense removed");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!expense.description.trim()) return toast.error("Enter what you spent on");
    if (expense.amount <= 0) return toast.error("Enter amount");
    setSaving(true);
    try {
      await api.post("/finance/expenses", {
        ...expense,
        description: expense.description.trim(),
        paymentMode: expense.paymentMode === "Mixed" ? "Cash" : expense.paymentMode
      });
      toast.success("Expense saved");
      setExpense({
        category: "Miscellaneous",
        description: "",
        amount: 0,
        paymentMode: "Cash",
        date: new Date().toISOString().slice(0, 10)
      });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/15 text-danger">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Expenditure</h1>
          <p className="text-sm text-muted">Record rent, bills, stock purchases, and daily shop spending.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted">Today</p>
          <p className="mt-1 text-2xl font-bold text-danger">{currency(todayTotal)}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-muted">This month</p>
          <p className="mt-1 text-2xl font-bold">{currency(monthTotal)}</p>
        </Card>
        <Card className="!p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-muted">Total entries</p>
          <p className="mt-1 text-2xl font-bold text-brand">{expenses.length}</p>
        </Card>
      </div>

      <Card className="!p-4 sm:!p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
          <Plus size={20} className="text-brand" /> Add expense
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Date">
            <input
              className={inputClass}
              type="date"
              value={expense.date}
              onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              required
            />
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setExpense({ ...expense, category: c })}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    expense.category === c ? "border-brand bg-brand/15 text-brand" : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="What did you spend on?">
            <input
              className={inputClass}
              placeholder="e.g. Shop rent, electricity bill"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              required
            />
          </Field>

          <Field label="Amount ₹">
            <input
              className={`${inputClass} text-lg font-bold`}
              type="number"
              min={1}
              step={1}
              value={expense.amount || ""}
              onChange={(e) => setExpense({ ...expense, amount: Number(e.target.value) || 0 })}
              required
            />
          </Field>

          <Field label="Paid how?">
            <PaymentBar
              value={expense.paymentMode === "Mixed" ? "Cash" : expense.paymentMode}
              onChange={(m) => setExpense({ ...expense, paymentMode: m === "Mixed" ? "Cash" : m })}
            />
          </Field>

          <Button type="submit" className="w-full !min-h-[52px]" disabled={saving}>
            <IndianRupee size={20} />
            {saving ? "Saving…" : "Save expense"}
          </Button>
        </form>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <h2 className="mb-3 text-base font-bold">Expense history</h2>
        {loading ? (
          <p className="text-center text-muted">Loading…</p>
        ) : expenses.length === 0 ? (
          <p className="py-8 text-center text-muted">No expenses yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e._id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
                <div className="min-w-0">
                  <p className="font-semibold">{e.description}</p>
                  <p className="text-xs text-muted">
                    {e.category} · {formatDate(e.date)} · {e.paymentMode}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-lg font-bold text-danger">−{currency(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(e)}
                    className="grid h-10 w-10 place-items-center rounded-lg text-danger hover:bg-danger/10"
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this expense?"
        message={deleteTarget ? `"${deleteTarget.description}" — ${currency(deleteTarget.amount)}` : ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </PageShell>
  );
}
