"use client";
import { useEffect, useState } from "react";
import { Activity, Award, Briefcase, Calendar, CheckCircle2, CreditCard, ExternalLink, Eye, FileCheck, FileText, Mail, MapPin, Phone, Search, ShieldCheck, Trash2, User, X, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { VolunteerStatusBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { LocationCascade } from "@/components/ui/location-cascade";
import { toast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
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
  const [viewing, setViewing] = useState<VolunteerResponse | null>(null);
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
                  <td className="font-medium text-ink">
                    <div>{v.name}</div>
                    {v.profession && (
                      <span className="text-[11px] text-mist font-normal block">{v.profession}</span>
                    )}
                  </td>
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
                    <Button
                      variant="secondary"
                      onClick={() => setViewing(v)}
                      size="sm"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" /> Details
                    </Button>
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

      {/* Volunteer Details & Verification Modal */}
      {viewing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-paper border border-ink-300 rounded shadow-panel w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-ink-300 flex items-center justify-between bg-surface/50">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                  <span>Volunteer Verification Details</span>
                  <span className="font-mono text-mist">#{viewing.id}</span>
                </div>
                <h3 className="font-display text-xl text-ink font-bold mt-0.5">{viewing.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <VolunteerStatusBadge status={viewing.status} />
                <button
                  onClick={() => setViewing(null)}
                  className="text-mist hover:text-ink transition p-1 rounded hover:bg-paper-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              {/* Identity & Basic Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded border border-ink-300 bg-surface/40 space-y-1">
                  <div className="text-xs text-mist flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <CreditCard className="h-3.5 w-3.5 text-red-400" /> National ID (NID)
                  </div>
                  <div className="font-mono text-base font-semibold text-ink">
                    {viewing.nid ? viewing.nid : <span className="text-mist font-normal italic">Not provided</span>}
                  </div>
                </div>

                <div className="p-3.5 rounded border border-ink-300 bg-surface/40 space-y-1">
                  <div className="text-xs text-mist flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <Briefcase className="h-3.5 w-3.5 text-amber-400" /> Profession / Occupation
                  </div>
                  <div className="font-medium text-ink">
                    {viewing.profession ? viewing.profession : <span className="text-mist font-normal italic">Not specified</span>}
                  </div>
                </div>

                <div className="p-3.5 rounded border border-ink-300 bg-surface/40 space-y-1">
                  <div className="text-xs text-mist flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" /> Date of Birth & Gender
                  </div>
                  <div className="font-medium text-ink">
                    {viewing.dateOfBirth || "N/A"}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-ink-200 text-ink font-mono uppercase">
                      {viewing.gender}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded border border-ink-300 bg-surface/40 space-y-1">
                  <div className="text-xs text-mist flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Registered On
                  </div>
                  <div className="font-mono text-xs text-ink pt-0.5">
                    {viewing.createdAt ? formatDateTime(viewing.createdAt) : "N/A"}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded border border-ink-300 bg-surface/40 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-mist flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Contact Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-ink">
                    <Mail className="h-4 w-4 text-mist shrink-0" />
                    <a href={`mailto:${viewing.email}`} className="text-xs hover:underline truncate">
                      {viewing.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-ink">
                    <Phone className="h-4 w-4 text-mist shrink-0" />
                    <a href={`tel:${viewing.phone}`} className="text-xs font-mono hover:underline">
                      {viewing.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Territorial Hierarchy / Area */}
              <div className="p-4 rounded border border-ink-300 bg-surface/40 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-mist flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Registered Deployment Area
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-mist block">Division</span>
                    <span className="font-medium text-ink">
                      {viewing.division?.name || "—"}
                    </span>
                    {viewing.division?.bnName && (
                      <span className="text-[11px] text-mist block">{viewing.division.bnName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-mist block">District</span>
                    <span className="font-medium text-ink">
                      {viewing.district?.name || "—"}
                    </span>
                    {viewing.district?.bnName && (
                      <span className="text-[11px] text-mist block">{viewing.district.bnName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-mist block">Thana / Upazila</span>
                    <span className="font-medium text-ink">
                      {viewing.thana?.name || "—"}
                    </span>
                    {viewing.thana?.bnName && (
                      <span className="text-[11px] text-mist block">{viewing.thana.bnName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 rounded border border-ink-300 bg-surface/40 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-mist flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" /> Skills & Specializations
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {viewing.skills && viewing.skills.length > 0 ? (
                    viewing.skills.map((s) => (
                      <span key={s} className="nx-badge nx-badge-ink px-2.5 py-1 text-xs">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-mist italic">No specific skills declared</span>
                  )}
                </div>
              </div>

              {/* Submitted Certificates & Verification Documents */}
              <div className="p-4 rounded border border-ink-300 bg-surface/40 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-mist flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-blue-400" /> Submitted Certificates & Documents
                  </span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-ink-200 text-ink">
                    {viewing.certificateDocuments?.length || 0} attached
                  </span>
                </div>

                {viewing.certificateDocuments && viewing.certificateDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {viewing.certificateDocuments.map((docUrl, idx) => {
                      const rawName = docUrl.split("/").pop() || `Certificate-${idx + 1}`;
                      const cleanName = rawName.includes("_") ? rawName.substring(rawName.indexOf("_") + 1) : rawName;
                      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(docUrl);
                      const isPdf = /\.pdf$/i.test(docUrl);
                      const fullUrl = docUrl.startsWith("http")
                        ? docUrl
                        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${docUrl}`;

                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-between p-3 rounded border border-ink-300 bg-paper space-y-2 hover:border-emerald-500/40 transition"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded bg-surface border border-ink-300 text-emerald-400 shrink-0">
                              {isPdf ? <FileText className="h-5 w-5 text-red-400" /> : <FileCheck className="h-5 w-5 text-blue-400" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-ink text-xs truncate" title={cleanName}>
                                {cleanName}
                              </p>
                              <span className="text-[10px] font-mono text-mist uppercase">
                                {isPdf ? "PDF Document" : isImage ? "Image Document" : "Attachment"}
                              </span>
                            </div>
                          </div>

                          {isImage && (
                            <div className="relative h-24 w-full rounded border border-ink-300 overflow-hidden bg-surface flex items-center justify-center">
                              <img
                                src={fullUrl}
                                alt={cleanName}
                                className="h-full w-full object-contain p-1"
                              />
                            </div>
                          )}

                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded border border-ink-300 bg-surface hover:bg-paper-200 text-ink text-xs font-medium transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-mist" />
                            <span>View / Download Document</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-mist italic py-1">
                    No certificate documents submitted by this volunteer.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="px-6 py-4 border-t border-ink-300 bg-surface/50 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setViewing(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {viewing.status === "PENDING_VERIFICATION" && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const target = viewing;
                        setViewing(null);
                        setRejecting(target);
                      }}
                      disabled={busyId === viewing.id}
                    >
                      <XCircle className="h-4 w-4" /> Reject Application
                    </Button>
                    <Button
                      onClick={async () => {
                        await approve(viewing.id);
                        setViewing(null);
                      }}
                      disabled={busyId === viewing.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Volunteer
                    </Button>
                  </>
                )}
              </div>
            </div>
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