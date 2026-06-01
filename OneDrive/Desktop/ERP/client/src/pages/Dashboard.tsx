import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Lightbulb,
  Minus,
  Percent,
  Plus,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench
} from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../api/http";
import { usePermissions } from "../hooks/usePermissions";
import { ActivityFeed, Button, Card, MetricCard, PageShell, SectionHeader, Skeleton } from "../components/ui";
import { APP_NAME } from "../constants/branding";
import { currency, formatDateTime } from "../utils/format";

const CHART_COLORS = ["#2dd4bf", "#6366f1", "#8b7cf6", "#38bdf8", "#f87171", "#34d399", "#f472b6", "#fbbf24"];

const tooltipStyle = { background: "#1a2d4a", border: "1px solid #2d4a6f", borderRadius: 8, fontSize: 12 };

type Analytics = {
  generatedAt: string;
  shop: { name: string };
  verdict: { title: string; message: string; tone: "good" | "bad" | "neutral" };
  today: {
    moneyIn: number;
    moneyOut: number;
    salesValue: number;
    profit: number;
    billsCount: number;
    repairsCount: number;
    isProfit: boolean;
    simpleSummary: string;
  };
  comparisons: {
    todayVsYesterday: { today: number; yesterday: number; percent: number | null; text: string };
    weekVsLastWeek: { thisWeek: number; lastWeek: number; percent: number | null; text: string };
    monthVsLastMonth: { thisMonth: number; lastMonth: number; percent: number | null; text: string };
  };
  counts: { totalProducts: number; lowStockCount: number; openRepairs: number; inventoryValue: number };
  weekChart: Array<{ day: string; label: string; sales: number; spent: number; profit: number }>;
  monthChart: Array<{ month: string; collected: number; spent: number; profit: number }>;
  topCategories: Array<{ name: string; sold: number; earned: number }>;
  topProducts: Array<{ name: string; sold: number; earned: number }>;
  paymentSplit: Array<{ method: string; amount: number; percent: number }>;
  pendingMoney: number;
  lowStock: Array<{ _id: string; name: string; category: string; left: number; minimum: number }>;
  expenseBreakdown: Array<{ category: string; amount: number }>;
  repairs: { open: number; thisMonth: number };
  insights: string[];
  advanced: {
    avgBillValue: number;
    avgDailySales: number;
    grossMarginPercent: number;
    collectionRate: number;
    expenseRatio: number;
    totalBilled30d: number;
    totalCollected30d: number;
    billsLast30d: number;
  };
  profitTrend: Array<{ label: string; sales: number; collected: number; spent: number; profit: number }>;
  weekdayChart: Array<{ day: string; fullDay: string; sales: number }>;
  repairStatusChart: Array<{ status: string; count: number }>;
  businessMixChart: Array<{ name: string; value: number; fill: string }>;
  inventoryByCategory: Array<{ category: string; value: number }>;
  recentSales: Array<{
    id: string;
    billNumber: string;
    amount: number;
    customerName: string;
    paymentMethod: string;
    createdAt: string;
  }>;
};

function CompareBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs text-cream/50">No past data</span>;
  if (percent === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-cream/60">
        <Minus size={14} /> Same as before
      </span>
    );
  }
  const up = percent > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {up ? "Up" : "Down"} {Math.abs(percent)}%
    </span>
  );
}

function ChartCard({
  title,
  hint,
  children,
  className = ""
}: {
  title: string;
  hint: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <h3 className="font-semibold text-cream">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-cream/50">{hint}</p>
      {children}
    </Card>
  );
}

function VerdictBanner({ verdict }: { verdict: Analytics["verdict"] }) {
  const styles = {
    good: "border-success/40 bg-success/10",
    bad: "border-danger/40 bg-danger/10",
    neutral: "border-gold/30 bg-gold/10"
  };
  const icon =
    verdict.tone === "good" ? (
      <TrendingUp className="text-success" size={28} />
    ) : verdict.tone === "bad" ? (
      <TrendingDown className="text-danger" size={28} />
    ) : (
      <CircleDollarSign className="text-gold" size={28} />
    );

  return (
    <Card className={`border-2 ${styles[verdict.tone]}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-navy/50">{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-cream sm:text-2xl">{verdict.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">{verdict.message}</p>
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { canViewCost } = usePermissions();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics")).data as Analytics,
    refetchInterval: 60_000
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const categoryChartData = data.topCategories.map((c) => ({ name: c.name, earned: c.earned, sold: c.sold }));

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_minmax(280px,360px)]">
          <div className="space-y-6">
            <SectionHeader
              eyebrow={data.shop?.name || APP_NAME}
              title="Venue command center"
              subtitle="Real-time revenue, inventory risk, and operational KPIs across locations."
            />
            <VerdictBanner verdict={data.verdict} />
          </div>
          <Card className="h-fit xl:sticky xl:top-24">
            <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-muted">Live activity</h3>
            <p className="mb-4 text-xs text-muted">Alerts & operational feed</p>
            <ActivityFeed />
          </Card>
        </div>

        <Card className="border-gold/20 bg-gold/5">
          <p className="text-sm font-medium text-gold">Today in one line</p>
          <p className="mt-2 text-lg text-cream">{data.today.simpleSummary}</p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Money received today" value={currency(data.today.moneyIn)} detail={`${data.today.billsCount} bills · ${data.today.repairsCount} repairs`} icon={Wallet} tone="gold" />
          <MetricCard label="Money spent today" value={currency(data.today.moneyOut)} detail="All shop expenses today" icon={ReceiptText} tone="neutral" />
          <MetricCard label="Sales today" value={currency(data.today.salesValue)} detail="Total bill amount" icon={ShoppingBag} tone="brand" />
          {canViewCost && (
            <MetricCard
              label={data.today.isProfit ? "Profit today" : "Loss today"}
              value={currency(Math.abs(data.today.profit))}
              detail={data.today.isProfit ? "Kept after expenses" : "Spent more than earned"}
              icon={data.today.isProfit ? TrendingUp : TrendingDown}
              tone={data.today.isProfit ? "success" : "danger"}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Today vs yesterday", data: data.comparisons.todayVsYesterday, current: data.comparisons.todayVsYesterday.today, prev: data.comparisons.todayVsYesterday.yesterday },
            { title: "Week vs last week", data: data.comparisons.weekVsLastWeek, current: data.comparisons.weekVsLastWeek.thisWeek, prev: data.comparisons.weekVsLastWeek.lastWeek },
            { title: "Month vs last month", data: data.comparisons.monthVsLastMonth, current: data.comparisons.monthVsLastMonth.thisMonth, prev: data.comparisons.monthVsLastMonth.lastMonth }
          ].map((box) => (
            <Card key={box.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{box.title}</p>
              <p className="mt-2 text-2xl font-bold text-cream">{currency(box.current)}</p>
              <p className="mt-1 text-xs text-cream/50">Before: {currency(box.prev)}</p>
              <div className="mt-2">
                <CompareBadge percent={box.data.percent} />
              </div>
              <p className="mt-3 text-sm text-cream/70">{box.data.text}</p>
            </Card>
          ))}
        </div>

        {/* Advanced Analytics Section */}
        <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 via-transparent to-accent/5 p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-gold">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-cream">Advanced Analytics</h2>
                <p className="text-sm text-cream/60">Deep graphs — see trends, best days, and where money goes</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/billing">
                <Button size="sm">
                  <Plus size={14} /> Sale
                </Button>
              </Link>
              <Link to="/reports">
                <Button size="sm" variant="secondary">
                  <ReceiptText size={14} /> Reports
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Avg bill (30 days)", value: currency(data.advanced.avgBillValue), tip: "Average amount per bill" },
              { label: "Avg sales / day", value: currency(data.advanced.avgDailySales), tip: "Daily sales average" },
              { label: "Profit margin", value: `${data.advanced.grossMarginPercent}%`, tip: "Profit on each sale" },
              { label: "Money collected", value: `${data.advanced.collectionRate}%`, tip: "Paid vs total billed" },
              { label: "Expense vs sales", value: `${data.advanced.expenseRatio}%`, tip: "How much you spend vs earn" },
              { label: "Bills (30 days)", value: String(data.advanced.billsLast30d), tip: "Total invoices" }
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-navy/50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{kpi.label}</p>
                <p className="mt-1 text-lg font-bold text-gold">{kpi.value}</p>
                <p className="mt-1 text-[10px] text-cream/45">{kpi.tip}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="30-day money trend" hint="Gold = sales · Green area = profit · Red line = spending">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.profitTrend}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#f5f0e680" fontSize={9} interval={4} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="profit" name="Profit" fill="#00d1b2" fillOpacity={0.25} stroke="#00d1b2" strokeWidth={2} />
                  <Bar dataKey="sales" name="Sales" fill="#c9a227" radius={[2, 2, 0, 0]} barSize={8} />
                  <Line type="monotone" dataKey="spent" name="Spent" stroke="#e74c3c" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="30-day collection line" hint="Actual money received each day (sales + repair advance)">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.profitTrend}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#f5f0e680" fontSize={9} interval={4} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="collected" name="Collected" stroke="#38bdf8" strokeWidth={3} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#00d1b2" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="This week — sales, spend & profit" hint="Compare each day of the current week">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data.weekChart}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#f5f0e680" fontSize={11} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#c9a227" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#00d1b2" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="6-month business health" hint="Collected money vs expenses — profit line shows real gain">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data.monthChart}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#f5f0e680" fontSize={11} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="#00d1b2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Expenses" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="profit" name="Net profit" stroke="#c9a227" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Which weekday sells most?" hint="Based on last 30 days — plan stock for busy days">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.weekdayChart}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#f5f0e680" fontSize={11} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} labelFormatter={(_, p) => p?.[0]?.payload?.fullDay || ""} contentStyle={tooltipStyle} />
                  <Bar dataKey="sales" name="Sales" radius={[6, 6, 0, 0]}>
                    {data.weekdayChart.map((entry, i) => (
                      <Cell key={entry.day} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Category sales (30 days)" hint="Which product types earn the most money">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={categoryChartData} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#f5f0e680" fontSize={10} width={90} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="earned" name="Earned" fill="#c9a227" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="This month — money mix" hint="Sales vs repair income vs total expenses">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.businessMixChart}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#f5f0e680" fontSize={10} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                    {data.businessMixChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Payment methods" hint="How customers paid in last 30 days">
              {data.paymentSplit.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.paymentSplit} dataKey="amount" nameKey="method" innerRadius={55} outerRadius={95} paddingAngle={3} label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}>
                      {data.paymentSplit.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-cream/50">No payment data yet</p>
              )}
            </ChartCard>

            <ChartCard title="Repair job status" hint="How many repairs in each stage">
              {data.repairStatusChart.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.repairStatusChart} dataKey="count" nameKey="status" outerRadius={95} label={({ status, count }) => `${status}: ${count}`}>
                      {data.repairStatusChart.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-cream/50">No repairs yet</p>
              )}
            </ChartCard>

            <ChartCard title="Stock value by category" hint="Money locked in inventory (purchase cost)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.inventoryByCategory}>
                  <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                  <XAxis dataKey="category" stroke="#f5f0e680" fontSize={9} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Stock value" fill="#8b7cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Expenses this month" hint="Where shop money is going">
              {data.expenseBreakdown.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.expenseBreakdown}>
                    <CartesianGrid stroke="#2d4a6f" strokeDasharray="3 3" />
                    <XAxis dataKey="category" stroke="#f5f0e680" fontSize={10} />
                    <YAxis stroke="#f5f0e680" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => currency(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" name="Spent" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-cream/50">No expenses this month</p>
              )}
            </ChartCard>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-danger">
              <Wallet size={18} /> Pending money
            </h2>
            <p className="text-3xl font-bold text-cream">{currency(data.pendingMoney)}</p>
            <p className="mt-2 text-sm text-cream/60">Still to collect from customers & repairs</p>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Wrench size={18} className="text-accent" /> Open repairs
            </h2>
            <p className="text-3xl font-bold text-cream">{data.repairs.open}</p>
            <p className="mt-2 text-sm text-cream/50">{data.repairs.thisMonth} new this month</p>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Boxes size={18} className="text-gold" /> Stock
            </h2>
            <p className="text-3xl font-bold text-cream">{currency(data.counts.inventoryValue)}</p>
            <p className="mt-2 text-sm text-danger">{data.counts.lowStockCount} items low — restock soon</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-cream">Top selling items (30 days)</h2>
            <ul className="space-y-2">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 text-xs font-bold text-gold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-cream/50">{p.sold} sold · {currency(p.earned)}</p>
                  </div>
                </li>
              ))}
              {!data.topProducts.length && <p className="text-sm text-cream/50">No sales yet</p>}
            </ul>
          </Card>

          <Card className="border-accent/30 bg-accent/5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Lightbulb size={18} className="text-accent" /> Simple advice
            </h2>
            <ul className="space-y-3">
              {data.insights.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-cream/90">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-bold text-accent">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-danger">
              <Boxes size={18} /> Low stock
            </h2>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-cream/50">Stock levels are healthy</p>
            ) : (
              <ul className="space-y-2">
                {data.lowStock.map((item) => (
                  <li key={item._id} className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-danger">Only {item.left} left (need {item.minimum})</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold">Latest sales</h2>
            <div className="space-y-2">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between rounded-lg border border-line/40 bg-navy/40 px-3 py-2 text-sm">
                  <div>
                    <p className="font-mono text-gold">{sale.billNumber}</p>
                    <p className="text-xs text-cream/50">{sale.customerName} · {formatDateTime(sale.createdAt)}</p>
                  </div>
                  <span className="font-semibold">{currency(sale.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-cream/40">
          <Percent size={12} /> Live analytics · Updated {formatDateTime(data.generatedAt)}
        </p>
      </div>
    </PageShell>
  );
}
