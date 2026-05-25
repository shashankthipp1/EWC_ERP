import { Bell, ShieldCheck, Wrench, Boxes, ReceiptText } from "lucide-react";
import { create } from "zustand";

export type EnterpriseNotification = {
  id: string;
  title: string;
  detail: string;
  tone: "critical" | "warning" | "success" | "info";
  time: string;
  icon: typeof Bell;
};

type UiState = {
  commandOpen: boolean;
  notifications: EnterpriseNotification[];
  toggleCommand: () => void;
  dismissNotification: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  notifications: [
    { id: "low-stock", title: "Low stock automation", detail: "12 SKUs need reorder review before closing.", tone: "warning", time: "Now", icon: Boxes },
    { id: "repair-ready", title: "Repair completion queue", detail: "4 jobs are ready for customer notification.", tone: "success", time: "12m", icon: Wrench },
    { id: "payment-due", title: "Pending collection", detail: "Rs 18.7K in dues should be followed up today.", tone: "critical", time: "28m", icon: ReceiptText },
    { id: "session", title: "Secure session active", detail: "JWT session persistence and protected routes enabled.", tone: "info", time: "1h", icon: ShieldCheck }
  ],
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
  dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) }))
}));
