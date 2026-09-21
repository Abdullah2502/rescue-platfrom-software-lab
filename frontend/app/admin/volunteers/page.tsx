"use client";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { VolunteerStatusBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { LocationCascade } from "@/components/ui/location-cascade";
import { toast } from "@/components/ui/toast";
import type { PageResp, VolunteerResponse, VolunteerStatus } from "@/lib/types";

type Filter = VolunteerStatus | "ALL";

const TABS: { value: Filter; label: string; hint?: string }[] = [
  { value: "PENDING_VERIFICATION", label: "Pending", hint: "Awaiting approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ALL", label: "All" },
];

export default function AdminVolunteersPage() {
  const [location, setLocation] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("PENDING_VERIFICATION");
  const [data, setData] = useState<PageResp<VolunteerResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<VolunteerResponse | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<VolunteerResponse | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const sp = new URLSearchParams();
      if (location.divisionId) sp.set("divisionId", String(location.divisionId));
      if (location.districtId) sp.set("districtId", String(location.districtId));
      if (location.thanaId)    sp.set("thanaId", String(location.thanaId));
      if (q) sp.set("q", q);
      if (status !== "ALL") sp.set("status", status);
      sp.set("page", "0"); sp.set("size", "50");
      const d = await api<PageResp<VolunteerResponse>>(`/api/v1/admin/volunteers?${sp}`);
      setData(d);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load volunteers");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [location.divisionId, location.districtId, location.thanaId, status]);

  async function approve(id: number) {
    setBusyId(id);
    try {
      await api(`/api/v1/admin/volunteers/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ approve: true }),
      });
      await load();
      toast("success", "Volunteer approved", "They can now sign in and accept invitations.");
    } catch (e: any) {
      toast("error", "Could not approve", e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;
    if (reason.length < 10) {
      toast("error", "Reason is required", "Please provide at least 10 characters so the volunteer knows why.");
      return;
    }
    setBusyId(rejecting.id);
    try {
      await api(`/api/v1/admin/volunteers/${rejecting.id}/review`, {
        method: "POST",
        body: JSON.stringify({ approve: false, reason }),
      });
      toast("info", "Volunteer rejected", `${rejecting.name} has been notified.`);
      setRejecting(null);
      setReason("");
      await load();
    } catch (e: any) {
      toast("error", "Could not reject", e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    // Two-step confirmation: user must type the literal word DELETE to
    // arm the button. The backend will refuse if the volunteer still has
    // outstanding event invitations.
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast("error", "Confirmation required", 'Type "DELETE" exactly to confirm.');
      return;
    }
    setBusyId(deleting.id);
    try {
      await api(`/api/v1/admin/volunteers/${deleting.id}`, { method: "DELETE" });
      toast("info", "Volunteer deleted", `${deleting.name} has been removed.`);
      setDeleting(null);
      setConfirmText("");
      await load();
    } catch (e: any) {
      toast("error", "Could not delete volunteer", e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Volunteer Approvals"
        title="Approve volunteers & manage the roster."
        description="Pending applications need your review before volunteers can sign in. Approved volunteers can then be invited to disaster events by NGOs."
      />

      <div className="flex items-center gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-3 h-8 text-sm rounded border ${
              status === t.value
                ? "bg-ink text-paper border-ink"
                : "bg-paper text-ink border-ink-300 hover:bg-paper-200"
            }`}
          >
            {t.label}
            {t.hint && status === t.value && (
              <span className="ml-2 text-[10px] font-mono uppercase tracking-wider opacity-70">
                {t.hint}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="nx-card space-y-4 mb-6">
        <LocationCascade value={location} onChange={setLocation} />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Button variant="secondary" onClick={load}>Search</Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-3 py-12 font-mono text-sm text-slate-400">
          <Activity className="h-4 w-4 animate-spin text-red-400" />
          Loading volunteers…
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300">
          <div className="font-display text-base font-bold text-red-400">Could not load volunteers</div>
          <p className="mt-1 text-red-300/80">{loadError}</p>
        </div>
      )}

      {!loading && !loadError && data && data.content.length === 0 && (
        <EmptyState
          title={status === "PENDING_VERIFICATION" ? "No pending applications." : "No volunteers in this view."}
          description={
            status === "PENDING_VERIFICATION"
              ? "When new volunteers submit a registration application, they will appear here for your review."
              : undefined
          }
        />
      )}

      {!loading && data && data.content.length > 0 && (
        <div className="border border-ink-300 rounded bg-surface overflow-hidden">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Skills</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((v) => (
                <tr key={v.id}>
                  <td className="font-medium text-ink">{v.name}</td>
                  <td className="text-xs">{v.email}</td>
                  <td className="text-xs font-mono">{v.phone}</td>
                  <td className="text-xs">
                    {[v.thana?.name, v.district?.name, v.division?.name].filter(Boolean).join(", ")}
                  </td>
                  <td className="text-xs">
                    {v.skills.length
                      ? v.skills.map((s) => <span key={s} className="nx-badge nx-badge-ink mr-1">{s}</span>)
                      : <span className="text-mist">—</span>}
                  </td>
                  <td><VolunteerStatusBadge status={v.status} /></td>
                  <td className="space-x-1 text-right">
                    {v.status === "PENDING_VERIFICATION" && (
                      <>
                        <Button onClick={() => approve(v.id)} disabled={busyId === v.id} size="sm">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setRejecting(v)}
                          disabled={busyId === v.id}
                          size="sm"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {/* Delete is always available — confirm modal requires
                        typing "DELETE" before it fires, and the backend will
                        refuse if the volunteer still has open invitations. */}
                    <Button
                      variant="ghost"
                      onClick={() => setDeleting(v)}
                      disabled={busyId === v.id}
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-mist border-t border-ink-300 flex items-center justify-between">
            <span>{data.totalElements} volunteer{data.totalElements !== 1 && "s"}</span>
            <span>Page {data.page + 1} of {data.totalPages}</span>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40">
          <div className="bg-paper border border-ink-300 rounded shadow-panel p-6 w-full max-w-md">
            <div className="eyebrow mb-2">Reject {rejecting.name}</div>
            <h3 className="font-display text-xl text-ink mb-2">Tell them why.</h3>
            <p className="text-sm text-mist mb-4">
              The volunteer will see this reason in their rejection email. Be specific.
            </p>
            <Label>Reason</Label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="At least 10 characters."
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setRejecting(null); setReason(""); }}>
                Cancel
              </Button>
              <Button onClick={confirmReject} disabled={busyId === rejecting.id}>
                {busyId === rejecting.id ? "Rejecting…" : "Reject Volunteer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal — typed confirmation prevents one-click data loss.
          The backend will refuse if the volunteer still has outstanding
          event invitations (a clear error will surface as a toast). */}
      {deleting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40">
          <div className="bg-paper border border-red-500/40 rounded shadow-panel p-6 w-full max-w-md">
            <div className="eyebrow mb-2 text-red-400">Delete {deleting.name}</div>
            <h3 className="font-display text-xl text-ink mb-2">This cannot be undone.</h3>
            <p className="text-sm text-mist mb-4">
              Deleting this volunteer will permanently remove their account,
              profile, skills, and password. If they still have outstanding
              event invitations, you'll need to resolve those first.
            </p>
            <Label>Type <span className="font-mono text-red-400">DELETE</span> to confirm</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => { setDeleting(null); setConfirmText(""); }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={busyId === deleting.id || confirmText.trim().toUpperCase() !== "DELETE"}
                className="bg-red-500 hover:bg-red-400 text-paper border-red-500"
              >
                {busyId === deleting.id ? "Deleting…" : "Delete Volunteer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}