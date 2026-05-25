import { Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, Field, SectionHeader, inputClass } from "../components/ui";
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from "../data/categories";
import { currency, formatDate } from "../utils/format";

export function Finance() {
  const [expenses, setExpenses] = useState<
    Array<{ _id: string; date: string; category: string; description: string; amount: number; paymentMode: string }>
  >([]);
  const [expense, setExpense] = useState({
    category: "Miscellaneous" as string,
    description: "",
    amount: 0,
    paymentMode: "Cash",
    date: new Date().toISOString().slice(0, 10)
  });
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; description: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const { data } = await api.get("/finance/expenses");
    setExpenses(data.expenses);
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/finance/expenses/${deleteTarget._id}`);
      toast.success("Expense deleted");
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
    try {
      await api.post("/finance/expenses", expense);
      toast.success("Expense recorded");
      setExpense({ category: "Miscellaneous", description: "", amount: 0, paymentMode: "Cash", date: new Date().toISOString().slice(0, 10) });
      load();
    } catch {
      toast.error("Failed to save expense");
    }
  }

  const monthTotal = expenses
    .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((s, e) => s + e.amount, 0);
  const todayTotal = expenses
    .filter((e) => formatDate(e.date) === formatDate(new Date()))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Shop expenses" title="Expenditure Tracking" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-cream/60">Today&apos;s expenses</p>
          <p className="mt-2 text-2xl font-bold text-danger">{currency(todayTotal)}</p>
        </Card>
        <Card>
          <p className="text-sm text-cream/60">This month</p>
          <p className="mt-2 text-2xl font-bold">{currency(monthTotal)}</p>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-semibold">Add Expense</h2>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Date">
              <input className={inputClass} type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} required />
            </Field>
            <Field label="Category">
              <select className={inputClass} value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input className={inputClass} value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} required />
            </Field>
            <Field label="Amount (₹)">
              <input className={inputClass} type="number" min={0} value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: Number(e.target.value) })} required />
            </Field>
            <Field label="Payment Mode">
              <select className={inputClass} value={expense.paymentMode} onChange={(e) => setExpense({ ...expense, paymentMode: e.target.value })}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Button type="submit">
              <Plus size={16} /> Add Expense
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Expense History ({expenses.length})</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {expenses.map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-2 rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{e.description}</p>
                  <p className="text-xs text-cream/50">
                    {e.category} · {formatDate(e.date)} · {e.paymentMode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-danger">{currency(e.amount)}</span>
                  <Button variant="ghost" className="!min-h-8 !px-2 !text-xs text-danger" onClick={() => setDeleteTarget({ _id: e._id, description: e.description })}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!expenses.length && <p className="text-cream/50">No expenses recorded yet.</p>}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete expense?"
        message={deleteTarget ? `Remove "${deleteTarget.description}"?` : ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
