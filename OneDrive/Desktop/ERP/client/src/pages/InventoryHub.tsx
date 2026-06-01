import { useState } from "react";
import { Inventory } from "./Inventory";
import { StockAlertsPanel } from "./inventory/StockAlertsPanel";
import { PageShell, Tabs } from "../components/ui";

export function InventoryHub() {
  const [tab, setTab] = useState("catalog");

  return (
    <PageShell>
      <Tabs
        active={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: "catalog", label: "All products" },
          { id: "alerts", label: "Stock alerts" }
        ]}
      />
      {tab === "catalog" && <Inventory embedded />}
      {tab === "alerts" && <StockAlertsPanel />}
    </PageShell>
  );
}
