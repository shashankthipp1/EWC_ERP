import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Billing } from "./pages/Billing";
import { Customers } from "./pages/Customers";
import { Dashboard } from "./pages/Dashboard";
import { Finance } from "./pages/Finance";
import { Inventory } from "./pages/Inventory";
import { Login } from "./pages/Login";
import { Orders } from "./pages/Orders";
import { Repairs } from "./pages/Repairs";
import { Reports } from "./pages/Reports";
import { Notifications } from "./pages/Notifications";
import { Staff } from "./pages/Staff";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="billing" element={<Billing />} />
            <Route path="orders" element={<Orders />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="finance" element={<Finance />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="staff" element={<Staff />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
