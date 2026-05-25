import { Bell, CheckCircle2, TriangleAlert, X } from "lucide-react";
import { Card, SectionHeader } from "../components/ui";
import { useUiStore } from "../store/uiStore";

const toneClass = {
  critical: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-gold/40 bg-gold/10 text-gold",
  success: "border-brand/40 bg-brand/10 text-brand",
  info: "border-violet/40 bg-violet/10 text-violet"
};

export function Notifications() {
  const { notifications, dismissNotification } = useUiStore();
  return (
    <div>
      <SectionHeader eyebrow="Command center" title="Enterprise Notifications" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-line bg-white/[0.035] p-4">
                <div className="flex gap-4">
                  <div className={`grid h-11 w-11 place-items-center rounded-lg border ${toneClass[item.tone]}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.time} ago</p>
                  </div>
                </div>
                <button onClick={() => dismissNotification(item.id)} className="rounded-md p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Dismiss notification">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Bell size={18} /> Automation Rules</h2>
          {[
            ["Low stock alerts", "Trigger reorder suggestions by category threshold.", TriangleAlert],
            ["Repair completion", "Create delivery reminders for completed jobs.", CheckCircle2],
            ["Payment reminders", "Queue customer follow-ups for pending dues.", Bell]
          ].map(([title, detail, Icon]: any) => (
            <div key={title} className="mb-3 rounded-lg border border-line bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Icon size={16} className="text-brand" /> {title}</div>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
