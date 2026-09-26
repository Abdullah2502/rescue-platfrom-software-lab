"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiUpload } from "@/lib/api";
import { Button, Input, Label, HelpText } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { ErrorState } from "@/components/ui/page";
import type { UploadedFileResponse } from "@/lib/types";
import {
  Activity, ArrowRight, Building2, CheckCircle2, ChevronRight,
  Clock, FileSignature, Globe2, MapPin, Phone, Radio, ShieldCheck,
  Users, Zap, UploadCloud, FileCheck, FileText, Trash2
} from "lucide-react";

export default function RegisterNgoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", registrationNo: "", phone: "", website: "",
  });
  const [location, setLocation] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<string>("");

  // Live Asia/Dhaka clock for the briefing panel header — grounds the
  // page in real time instead of a static screenshot feel.
  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Dhaka",
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Certificate file exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    setUploadingCert(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<UploadedFileResponse>("/api/v1/uploads/certificate", fd);
      setCertificateUrl(res.url);
      setCertificateFile(file);
    } catch (err: any) {
      setError(err.message || "Failed to upload certificate. Please try again.");
    } finally {
      setUploadingCert(false);
    }
  }

  function removeCertificate() {
    setCertificateFile(null);
    setCertificateUrl(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // Certificate is strictly required to join Nexora
      if (!certificateUrl) {
        setError("Please upload your organization's official government registration certificate. It is required to join.");
        setLoading(false);
        return;
      }
      // NGO DTO requires non-null division/district/thana IDs.
      if (!location.divisionId || !location.districtId || !location.thanaId) {
        setError("Please pick an operating division, district, and thana before submitting.");
        setLoading(false);
        return;
      }

      // Sanitize and validate mobile phone format (Bangladesh standard)
      let cleanPhone = form.phone.trim().replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.startsWith("880") && !cleanPhone.startsWith("+880")) {
        cleanPhone = "+" + cleanPhone;
      }
      const bdPhoneRegex = /^(\+880|0)1[3-9]\d{8}$/;
      if (!bdPhoneRegex.test(cleanPhone)) {
        setError("Please enter a valid Bangladesh mobile number (e.g. 01712345678 or +8801712345678).");
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        registrationNo: form.registrationNo.trim(),
        phone: cleanPhone,
        website: form.website?.trim() || null,
        registrationCertificateUrl: certificateUrl,
        divisionId: location.divisionId,
        districtId: location.districtId,
        thanaId: location.thanaId,
      };
      await api("/api/v1/auth/register/ngo", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess(
        "Registration received. Your NGO is pending Super Admin approval. You will receive an email when approved.",
      );
      setTimeout(() => router.push("/login"), 2800);
    } catch (ex: any) {
      setError(ex.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  // Section checkmarks — guide the user through what they've completed.
  const hasName = form.name.trim().length > 0;
  const hasReg = form.registrationNo.trim().length > 0;
  const hasContact = form.phone.trim().length > 0;
  const hasCredentials = form.email.trim().length > 0 && form.password.length >= 8;
  const hasLocation = !!location.divisionId && !!location.districtId && !!location.thanaId;
  const hasCertificate = !!certificateUrl;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Ambient background — slate grid + warm/cool glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-[460px] w-[460px] rounded-full bg-red-600/20 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-amber-600/12 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-0 h-[280px] w-[280px] rounded-full bg-rose-500/8 blur-[120px]"
      />

      {/* Top status bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_18px_-2px_rgba(239,68,68,0.6)] transition-transform group-hover:scale-105">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-100">
              Nexora<span className="text-red-500">.</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-2 font-mono uppercase tracking-wider text-[11px] text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Partner intake · approval required
          </div>
          <Link
            href="/login"
            className="font-mono uppercase tracking-wider text-[11px] text-slate-400 transition hover:text-slate-100"
          >
            Already have an account →
          </Link>
        </div>
      </header>

      <div className="relative z-10 container py-12 lg:py-16">
        {/* Eyebrow + headline */}
        <div className="mb-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            <Radio className="h-3 w-3 animate-pulse" />
            Onboarding · NGO Partner
          </div>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-tight text-slate-100">
            Stand up your{" "}
            <span className="text-red-500">
              dispatch command
            </span>
            .
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-400 leading-relaxed">
            Nexora partners with verified NGOs across Bangladesh. Submit your
            registration below — a Super Admin will review your credentials and
            unlock dispatch rights. Most approvals complete within one business
            day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
          {/* LEFT — Briefing panel */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/60 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                    Approval queue · live
                  </span>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">
                  {now || "—"} · Dhaka
                </span>
              </div>

              <div className="space-y-3">
                <Step
                  done={hasName}
                  index="01"
                  label="Legal entity"
                  icon={<Building2 className="h-3.5 w-3.5" />}
                />
                <Step
                  done={hasContact}
                  index="02"
                  label="Public contact"
                  icon={<Phone className="h-3.5 w-3.5" />}
                />
                <Step
                  done={hasCredentials}
                  index="03"
                  label="Sign-in credentials"
                  icon={<FileSignature className="h-3.5 w-3.5" />}
                />
                <Step
                  done={hasLocation}
                  index="04"
                  label="Operating territory"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
                <Step
                  done={hasCertificate}
                  index="05"
                  label="Registration certificate"
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed">
                <div className="font-mono uppercase tracking-wider text-[10px] text-amber-400 mb-1">
                  What happens next
                </div>
                Your application lands in the Super Admin queue. Once approved,
                you can sign in, recruit verified volunteers, and open dispatch
                events for disaster response.
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
                Why approval
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <Bullet icon={<ShieldCheck className="h-4 w-4 text-red-400" />} text="Credential verification against NGO Affairs Bureau records." />
                <Bullet icon={<Users className="h-4 w-4 text-amber-300" />} text="Confirm authorized signatory for the legal entity." />
                <Bullet icon={<Zap className="h-4 w-4 text-emerald-400" />} text="Activate dispatch rights once verified." />
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
                <span>Median review</span>
                <Clock className="h-3 w-3 text-slate-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-slate-100 tabular-nums">14h</span>
                <span className="text-xs text-slate-400">last 30 days</span>
              </div>
            </div>
          </aside>

          {/* RIGHT — Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <Fieldset index="01" title="Organisation" caption="Legal entity" icon={<Building2 className="h-4 w-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field icon={<Building2 className="h-3.5 w-3.5" />} label="NGO name" hint="As registered with the relevant authority">
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => up("name", e.target.value)}
                      placeholder="e.g. Brac, Red Crescent"
                      className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                  </Field>
                </div>
                <Field icon={<FileSignature className="h-3.5 w-3.5" />} label="Registration number">
                  <Input
                    required
                    value={form.registrationNo}
                    onChange={(e) => up("registrationNo", e.target.value)}
                    placeholder="e.g. 0123-2024-F"
                    className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  <HelpText>As registered with the relevant government authority.</HelpText>
                </Field>
                <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => up("phone", e.target.value)}
                    placeholder="+8801712345678"
                    className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field icon={<Globe2 className="h-3.5 w-3.5" />} label="Website" hint="Optional">
                    <Input
                      value={form.website}
                      onChange={(e) => up("website", e.target.value)}
                      placeholder="https://example.org"
                      className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                  </Field>
                </div>
              </div>
            </Fieldset>

            <Fieldset index="02" title="Primary contact" caption="Sign-in credentials" icon={<FileSignature className="h-4 w-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<span className="font-mono text-[10px]">@</span>} label="Email">
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => up("email", e.target.value)}
                    placeholder="contact@ngo.org"
                    className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </Field>
                <Field icon={<FileSignature className="h-3.5 w-3.5" />} label="Password">
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => up("password", e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  <HelpText>You'll use this to sign in once approved.</HelpText>
                </Field>
              </div>
            </Fieldset>

            <Fieldset index="03" title="Where you operate" caption="Headquarters" icon={<MapPin className="h-4 w-4" />}>
              <LocationCascade value={location} onChange={setLocation} required />
            </Fieldset>

            <Fieldset index="04" title="Official verification" caption="Required credentials" icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Government Registration Certificate <span className="text-red-400 font-bold">*</span>
                  </Label>
                  <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    Required to join
                  </span>
                </div>
                <HelpText>
                  Upload your official government registration certificate, NGO Affairs Bureau approval, or Social Welfare incorporation document (PDF, PNG, JPG, Max 10MB).
                </HelpText>

                <div className="mt-3">
                  {!certificateUrl ? (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition group">
                      <div className="p-3 rounded-full bg-slate-800/80 group-hover:bg-red-500/10 text-slate-400 group-hover:text-red-400 transition mb-3">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {uploadingCert ? "Uploading certificate…" : "Click or drag certificate here to upload"}
                      </span>
                      <span className="text-xs text-slate-500 mt-1 font-mono">
                        Supported formats: PDF, PNG, JPG, JPEG, WEBP (Max 10MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleCertificateUpload}
                        disabled={uploadingCert}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-slate-100 font-medium truncate">
                            {certificateFile?.name || "Official-Registration-Certificate"}
                          </p>
                          <a
                            href={certificateUrl.startsWith("http") ? certificateUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>View uploaded certificate</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCertificate}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition shrink-0"
                        title="Remove and re-upload"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Fieldset>

            {error && <ErrorState title="Could not submit" description={error} />}
            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>{success}</p>
              </div>
            )}

            {/* Submit bar */}
            <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <Clock className="h-3 w-3" />
                Account activates after Super Admin approval
              </div>
              <Button
                type="submit"
                disabled={loading || !!success}
                size="lg"
                className="group h-12 rounded-md bg-gradient-to-r from-red-600 to-amber-500 px-6 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_28px_-6px_rgba(239,68,68,0.6)] transition-all hover:from-red-500 hover:to-amber-400 hover:shadow-[0_0_32px_-4px_rgba(239,68,68,0.8)] disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {loading ? "Submitting…" : "Submit for approval"}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Volunteering instead?{" "}
          <Link href="/register/volunteer" className="text-emerald-400 hover:text-emerald-300">
            Register as a volunteer →
          </Link>
        </p>
      </div>
    </main>
  );
}

function Step({
  done, index, label, icon,
}: { done: boolean; index: string; label: string; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-3 rounded-md border px-3 py-2 transition ${done
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-slate-800/80 bg-slate-950/40"
      }`}>
      <div className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-[11px] font-bold ${done ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800/80 text-slate-500"
        }`}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index}
      </div>
      <div className="flex flex-1 items-center gap-2">
        <span className={done ? "text-emerald-300" : "text-slate-500"}>{icon}</span>
        <span className={`text-sm ${done ? "text-slate-200" : "text-slate-400"}`}>{label}</span>
      </div>
      {done ? (
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">done</span>
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
      )}
    </div>
  );
}

function Bullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

function Fieldset({
  index, title, caption, icon, children,
}: { index: string; title: string; caption: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
      {/* Left accent rail */}
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-red-500/60 via-rose-500/40 to-transparent"
      />
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/15 font-mono text-xs font-bold text-red-300 ring-1 ring-red-500/30">
            {index}
          </span>
          <div>
            <div className="font-display text-lg font-bold text-slate-100">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="hidden sm:block font-mono text-[10px] uppercase tracking-wider">{caption}</span>
          {icon}
        </div>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </section>
  );
}

function Field({
  icon, label, hint, children,
}: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <span className="text-slate-500">{icon}</span>
          {label}
        </Label>
        {hint && <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
