"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Label, HelpText } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { PageHeader, SectionTitle } from "@/components/ui/page";
import { toast, ToastHost } from "@/components/ui/toast";
import type { VolunteerResponse } from "@/lib/types";

export default function VolunteerProfilePage() {
  const [me, setMe] = useState<VolunteerResponse | null>(null);
  const [form, setForm] = useState({ phone: "", nid: "", skills: "" });
  const [location, setLocation] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<VolunteerResponse>("/api/v1/volunteer/dashboard").then((v) => {
      setMe(v);
      setForm({ phone: v.phone, nid: v.nid ?? "", skills: v.skills.join(", ") });
      setLocation({
        divisionId: v.division?.id,
        districtId: v.district?.id,
        thanaId: v.thana?.id,
      });
    }).catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<VolunteerResponse>("/api/v1/volunteer/profile", {
        method: "PUT",
        body: JSON.stringify({
          phone: form.phone,
          nid: form.nid,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          divisionId: location.divisionId ?? null,
          districtId: location.districtId ?? null,
          thanaId: location.thanaId ?? null,
        }),
      });
      setMe(r);
      toast("success", "Profile saved", "Your changes have been applied.");
    } catch (ex: any) {
      toast("error", "Could not save", ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (!me) return <p className="text-sm text-mist">Loading…</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Your details."
        description="Keep your phone, skills and area current so event details stay relevant."
      />

      <form onSubmit={save} className="space-y-10 max-w-3xl">
        <section>
          <SectionTitle eyebrow="Identity" title="Who you are" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full name</Label>
              <Input value={me.name} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={me.email} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>NID (optional)</Label>
              <Input value={form.nid} onChange={(e) => setForm((p) => ({ ...p, nid: e.target.value }))} />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Location" title="Where you're based" />
          <LocationCascade value={location} onChange={setLocation} required />
        </section>

        <section>
          <SectionTitle eyebrow="Capabilities" title="What you can do" />
          <div>
            <Label>Skills</Label>
            <Input
              value={form.skills}
              onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
              placeholder="first-aid, swimming, driving"
            />
            <HelpText>Comma-separated. NGOs filter by skill when events open.</HelpText>
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-ink-300 pt-6">
          <p className="text-xs text-mist">Last updated {me ? "just now" : "—"}</p>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      <ToastHost />
    </div>
  );
}
