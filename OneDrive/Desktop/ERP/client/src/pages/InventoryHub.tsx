import { useState } from "react";
import { Inventory } from "./Inventory";
import { StockAlertsPanel } from "./inventory/StockAlertsPanel";
import { SuppliersPanel } from "./inventory/SuppliersPanel";
import { Link } from "react-router-dom";
import { Button, PageShell, Tabs } from "../components/ui";

export function InventoryHub() {
  const [tab, setTab] = useState("catalog");

  return (
    <PageShell>
      <Tabs
        active={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { id: "catalog", label: "Catalog" },
          { id: "alerts", label: "Stock alerts" },
          { id: "suppliers", label: "Suppliers" },
          { id: "orders", label: "Purchase orders" }
        ]}
      />
      {tab === "catalog" && <Inventory embedded />}
      {tab === "alerts" && <StockAlertsPanel />}
      {tab === "suppliers" && <SuppliersPanel />}
      {tab === "orders" && (
        <div className="rounded-2xl border border-line bg-surface-2/50 p-8 text-center">
          <p className="text-muted">Full purchase order workspace with line items and exports.</p>
          <Link to="/orders" className="mt-4 inline-block">
            <Button>Open purchase orders</Button>
          </Link>
        </div>
      )}
    </PageShell>
  );
}
