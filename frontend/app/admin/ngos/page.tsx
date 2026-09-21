"use client";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Trash2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { NgoStatusBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { NgoResponse, NgoStatus, PageResp } from "@/lib/types";

export default function AdminNgosPage() {
  const [status, setStatus] = useState<NgoStatus | "ALL">("PENDING");
  const [data, setData] = useState<PageResp<NgoResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<NgoResponse | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<NgoResponse | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      // Always build the query string from a single object so we never
      // accidentally emit "ngos&page=0" without a leading "?".
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      params.set("page", "0");
      params.set("size", "50");
      const d = await api<PageResp<NgoResponse>>(`/api/v1/admin/ngos?${params.toString()}`);
      setData(d);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load NGOs");
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  async function approve(id: number) {
    setBusyId(id);
    try {
      await api(`/api/v1/admin/ngos/${id}/approve`, { method: "POST", body: JSON.stringify({ approve: true }) });
      await load();
      toast("success", "NGO approved");
    } catch (e: any) { toast("error", "Could not approve", e.message); }
    finally { setBusyId(null); }
  }

  async function confirmReject() {
    if (!rejecting) return;
    if (reason.length < 10) {
      toast("error", "Reason is required", "Please provide at least 10 characters so the NGO knows why.");
      return;
    }
    setBusyId(rejecting.id);
    try {
      await api(`/api/v1/admin/ngos/${rejecting.id}/approve`, { method: "POST", body: JSON.stringify({ approve: false, reason }) });
      toast("info", "NGO rejected", `${rejecting.name} has been notified.`);
      setRejecting(null);
      setReason("");
      await load();
    } catch (e: any) { toast("error", "Could not reject", e.message); }
    finally { setBusyId(null); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    // Two-step confirmation: user must type the literal word DELETE to
    // arm the button. Destructive actions should never be one-click.
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast("error", "Confirmation required", 'Type "DELETE" exactly to confirm.');
      return;
    }
    setBusyId(deleting.id);
    try {
      const summary = await api<{
        deletedNgoId: number;
        removedEvents: number;
        removedInvitations: number;
        unlinkedVolunteers: number;
      }>(`/api/v1/admin/ngos/${deleting.id}`, { method: "DELETE" });
      toast(
        "info",
        "NGO deleted",
        `${deleting.name}: ${summary.removedEvents} event(s), ${summary.removedInvitations} invitation(s), ${summary.unlinkedVolunteers} volunteer link(s) removed.`,
      );
      setDeleting(null);
      setConfirmText("");
      await load();
    } catch (e: any) {
      toast("error", "Could not delete NGO", e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Approvals"
        title="NGO registrations."
        description="Approve or reject pending NGO applications. Approved NGOs can sign in immediately."
      />

      <div className="flex items-center gap-1 mb-6">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 h-8 text-sm rounded border ${status === s ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-ink-300 hover:bg-paper-200"}`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading && !data && (
        <div className="flex items-center gap-3 py-12 font-mono text-sm text-slate-400">
          <Activity className="h-4 w-4 animate-spin text-red-400" />
          Loading NGO applications…
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300">
          <div className="font-display text-base font-bold text-red-400">Could not load NGOs</div>
          <p className="mt-1 text-red-300/80">{loadError}</p>
        </div>
      )}

      {!loading && !loadError && data && data.content.length === 0 && (
        <EmptyState
          title={status === "PENDING" ? "No pending applications." : "No NGOs in this view."}
          description={
            status === "PENDING"
              ? "When new NGOs submit a registration application, they will appear here for your review."
              : undefined
          }
        />
      )}

      {!loading && data && data.content.length > 0 && (
        <div className="border border-ink-300 rounded bg-surface overflow-hidden">
          <table className="nx-table">
            <thead>
              <tr>
                <th>NGO</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((n) => (
                <tr key={n.id}>
                  <td className="font-medium text-ink">{n.name}</td>
                  <td className="text-xs">{n.email}</td>
                  <td className="text-xs font-mono">{n.phone}</td>
                  <td className="text-xs">{[n.thana?.name, n.district?.name, n.division?.name].filter(Boolean).join(", ")}</td>
                  <td><NgoStatusBadge status={n.status} /></td>
                  <td className="text-xs font-mono text-mist">{formatDateTime(n.createdAt)}</td>
                  <td className="space-x-1 text-right">
                    {n.status === "PENDING" && (
                      <>
                        <Button onClick={() => approve(n.id)} disabled={busyId === n.id} size="sm">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button variant="secondary" onClick={() => setRejecting(n)} disabled={busyId === n.id} size="sm">
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {/* Delete is always available — the confirm modal asks the
                        admin to type the literal word "DELETE" before firing. */}
                    <Button
                      variant="ghost"
                      onClick={() => setDeleting(n)}
                      disabled={busyId === n.id}
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
        </div>
      )}

      {/* Reject modal — replaces the prompt() call with a real dialog */}
      {rejecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40">
          <div className="bg-paper border border-ink-300 rounded shadow-panel p-6 w-full max-w-md">
            <div className="eyebrow mb-2">Reject {rejecting.name}</div>
            <h3 className="font-display text-xl text-ink mb-2">Tell them why.</h3>
            <p className="text-sm text-mist mb-4">
              The NGO will see this reason in their rejection email. Be specific.
            </p>
            <Label>Reason</Label>
            <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At least 10 characters." />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
              <Button onClick={confirmReject} disabled={busyId === rejecting.id}>
                {busyId === rejecting.id ? "Rejecting…" : "Reject NGO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal — typed confirmation prevents one-click data loss.
          Backend cascades the NGO's events and invitations, and unlinks the
          volunteers they recruited. The toast on success reports the counts. */}
      {deleting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40">
          <div className="bg-paper border border-red-500/40 rounded shadow-panel p-6 w-full max-w-md">
            <div className="eyebrow mb-2 text-red-400">Delete {deleting.name}</div>
            <h3 className="font-display text-xl text-ink mb-2">This cannot be undone.</h3>
            <p className="text-sm text-mist mb-4">
              Deleting this NGO will permanently remove every event they opened,
              every invitation they sent, and clear the recruiter link on any
              volunteers they added. Their account will be gone.
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
                {busyId === deleting.id ? "Deleting…" : "Delete NGO"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}