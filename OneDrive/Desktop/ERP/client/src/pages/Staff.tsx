import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ShieldCheck, UserCog, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/http";
import { Button, Card, MetricCard, SectionHeader } from "../components/ui";
import { compactDate } from "../utils/format";

export function Staff() {
  const queryClient = useQueryClient();
  const { data: staffData } = useQuery({ queryKey: ["staff"], queryFn: async () => (await api.get("/staff")).data });
  const { data: sessionData } = useQuery({ queryKey: ["device-sessions"], queryFn: async () => (await api.get("/staff/sessions")).data });
  const revoke = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/staff/sessions/${id}`)).data,
    onSuccess: () => {
      toast.success("Device session revoked");
      queryClient.invalidateQueries({ queryKey: ["device-sessions"] });
    }
  });
  const staff = staffData?.staff || [];
  const sessions = sessionData?.sessions || [];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Operations control" title="Staff Operations and Device Sessions" />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Staff Users" value={staff.length} detail="Admin, manager, staff roles" icon={UserCog} />
        <MetricCard label="Active Sessions" value={sessions.filter((s: any) => !s.revokedAt).length} detail="JWT device sessions" icon={ShieldCheck} tone="violet" />
        <MetricCard label="Operational Actions" value={staff.reduce((sum: number, user: any) => sum + user.salesCount + user.repairCount + user.expenseCount, 0)} detail="Sales, repairs, expenses" icon={Activity} tone="gold" />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Staff Productivity</h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-slate-400"><tr>{["Name", "Role", "Sales", "Repairs", "Expenses", "Sessions", "Last Login"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {staff.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-3 py-3"><p className="font-medium">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></td>
                  <td className="px-3 py-3"><span className="rounded-full bg-brand/10 px-2 py-1 text-xs uppercase text-brand">{user.role}</span></td>
                  <td className="px-3 py-3">{user.salesCount}</td>
                  <td className="px-3 py-3">{user.repairCount}</td>
                  <td className="px-3 py-3">{user.expenseCount}</td>
                  <td className="px-3 py-3">{user.activeSessions}</td>
                  <td className="px-3 py-3">{compactDate(user.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Device Sessions</h2>
        <div className="grid gap-3 xl:grid-cols-2">
          {sessions.map((session: any) => (
            <div key={session._id} className="flex items-start justify-between gap-4 rounded-lg border border-line bg-white/[0.035] p-4">
              <div>
                <p className="font-medium">{session.deviceName}</p>
                <p className="mt-1 text-sm text-slate-400">{session.user?.name || "User"} - {session.ip || "Unknown IP"}</p>
                <p className="mt-1 text-xs text-slate-500">Last active {compactDate(session.lastActiveAt)}</p>
                {session.revokedAt && <p className="mt-2 text-xs text-danger">Revoked {compactDate(session.revokedAt)}</p>}
              </div>
              {!session.revokedAt && <Button onClick={() => revoke.mutate(session._id)} className="bg-danger text-white hover:bg-danger/90"><X size={16} /> Revoke</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
