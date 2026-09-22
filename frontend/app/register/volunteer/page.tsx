"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPath } from "@/lib/auth";
import { api, apiUpload } from "@/lib/api";
import { Button, Input, Label, HelpText } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { ErrorState } from "@/components/ui/page";
import type { AuthResponse, Gender, UploadedFileResponse } from "@/lib/types";
import { Activity, ArrowRight, Briefcase, FileCheck, FileText, Radio, Trash2, UploadCloud, UserPlus } from "lucide-react";

export default function RegisterVolunteerPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", nid: "", gender: "MALE" as Gender,
    profession: "",
    skills: "",
  });
  const [location, setLocation] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ name: string; email: string } | null>(null);

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Upload any selected certificates first
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiUpload<UploadedFileResponse>("/api/v1/uploads/certificate", fd);
        uploadedUrls.push(res.url);
      }

      // Backend expects `skills` as a comma-separated string, not an array.
      // Trim, drop empties, and re-join so the server gets a clean value.
      const skillsClean = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        nid: form.nid || null,
        gender: form.gender,
        divisionId: location.divisionId ?? null,
        districtId: location.districtId ?? null,
        thanaId: location.thanaId ?? null,
        skills: skillsClean,
        profession: form.profession.trim() || null,
        certificateDocuments: uploadedUrls,
      };
      const data = await api<AuthResponse>("/api/v1/auth/register/volunteer", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Self-registered volunteers go straight to PENDING_VERIFICATION and
      // don't get a token. Don't persist the session and don't redirect —
      // instead show a confirmation explaining the next step.
      if (data.accessToken) {
        setSession(data);
        router.push(dashboardPath(data.principal.role));
      } else {
        setPendingConfirmation({
          name: data.principal.name,
          email: data.principal.email,
        });
      }
    } catch (ex: any) {
      setError(ex.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Background grid + glows */}
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
        className="pointer-events-none absolute -top-32 right-1/4 h-[420px] w-[420px] rounded-full bg-emerald-600/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-red-600/15 blur-[140px]"
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
          <div className="hidden md:flex items-center gap-2 font-mono uppercase tracking-wider text-[11px] text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Volunteer intake
          </div>
          <Link
            href="/login"
            className="font-mono uppercase tracking-wider text-[11px] text-slate-400 transition hover:text-slate-100"
          >
            Already have an account →
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 container max-w-3xl py-12 lg:py-20">
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          <Radio className="h-3 w-3" />
          Register · Volunteer
        </div>

        <h1 className="mt-6 font-display text-4xl sm:text-5xl font-bold leading-[1.02] tracking-tight text-slate-100">
          Join the <span className="text-emerald-500">roster</span>.
        </h1>
        <p className="mt-3 max-w-xl text-base text-slate-400 leading-relaxed">
          Pick the Division, District, and Thana where you're based — that's
          how NGOs find you when an incident opens nearby. Add your skills so
          dispatch can match you to the right operation.
        </p>

        {pendingConfirmation ? (
          <PendingConfirmationPanel
            name={pendingConfirmation.name}
            email={pendingConfirmation.email}
          />
        ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-10">
          {/* Section 01 */}
          <section className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400">01</span>
                <span className="font-display text-lg font-bold text-slate-100">About you</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Identity
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Full name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => up("name", e.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => up("email", e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => up("phone", e.target.value)}
                  placeholder="+8801712345678"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <HelpText>Format: +8801XXXXXXXXX or 01XXXXXXXXX.</HelpText>
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => up("password", e.target.value)}
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <HelpText>8+ characters, with at least one number.</HelpText>
              </div>
              <div>
                <Label>NID (optional)</Label>
                <Input
                  value={form.nid}
                  onChange={(e) => up("nid", e.target.value)}
                  placeholder="National ID number"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <select
                  className="h-11 w-full appearance-none rounded-md border border-slate-700/80 bg-slate-900/60 px-4 pr-8 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={form.gender}
                  onChange={(e) => up("gender", e.target.value)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Profession</Label>
                <Input
                  value={form.profession}
                  onChange={(e) => up("profession", e.target.value)}
                  placeholder="e.g. Medical Doctor, Paramedic, Civil Engineer, Student, Teacher"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <HelpText>Your current occupation or field of study. Helps match you to relevant crisis operations.</HelpText>
              </div>
            </div>
          </section>

          {/* Section 02 */}
          <section className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400">02</span>
                <span className="font-display text-lg font-bold text-slate-100">Where you're based</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Geography
              </span>
            </div>
            <LocationCascade
              value={location}
              onChange={(v) => setLocation(v)}
              required
            />
          </section>

          {/* Section 03 */}
          <section className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400">03</span>
                <span className="font-display text-lg font-bold text-slate-100">What you can do</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Skills
              </span>
            </div>
            <div>
              <Label>Skills</Label>
              <Input
                value={form.skills}
                onChange={(e) => up("skills", e.target.value)}
                placeholder="first-aid, swimming, driving"
                className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <HelpText>Comma-separated. NGOs search by skill when events open.</HelpText>
            </div>
          </section>

          {/* Section 04: Certificates & Verification Documents */}
          <section className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400">04</span>
                <span className="font-display text-lg font-bold text-slate-100">Certificates & Verification Documents</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Credentials
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your certifications, training completion certificates, medical licenses, or first-aid credentials. You can select multiple documents (PDF, PNG, JPG, WEBP).
              </p>

              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700/80 bg-slate-900/30 p-6 text-center hover:border-emerald-500/50 transition">
                <UploadCloud className="h-8 w-8 text-emerald-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-600/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition">
                    Browse & select certificate documents
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="mt-2 text-[11px] text-slate-500 font-mono">
                  Supported formats: PDF, PNG, JPG, JPEG, WEBP (Max 10MB per file)
                </span>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5" /> Selected documents ({selectedFiles.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded border border-slate-800 bg-slate-900/80 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-slate-200 font-medium truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 transition"
                          title="Remove document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {error && <ErrorState title="Could not register" description={error} />}

          {/* Submit bar */}
          <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              By registering you agree to participate in verified disaster response events.
            </p>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="group h-12 rounded-md bg-gradient-to-r from-emerald-600 to-teal-500 px-6 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_28px_-6px_rgba(16,185,129,0.6)] transition-all hover:from-emerald-500 hover:to-teal-400 hover:shadow-[0_0_32px_-4px_rgba(16,185,129,0.8)]"
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account…" : "Create account"}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </span>
            </Button>
          </div>
        </form>
        )}

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Registering an organisation instead?{" "}
          <Link href="/register/ngo" className="text-red-400 hover:text-red-300">
            Submit your NGO →
          </Link>
        </p>
      </div>
    </main>
  );
}

function PendingConfirmationPanel({ name, email }: { name: string; email: string }) {
  return (
    <section className="mt-10 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
          <Radio className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            Application received
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-100">
            Welcome aboard, {name.split(" ")[0]}.
          </h2>
        </div>
      </div>

      <p className="text-base text-slate-300 leading-relaxed">
        Your volunteer application has been submitted and is now{" "}
        <span className="text-emerald-400 font-semibold">pending Super Admin review</span>.
        Most reviews complete within one business day.
      </p>

      <ul className="mt-6 space-y-2 text-sm text-slate-400">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span>
            We just sent a confirmation to{" "}
            <span className="font-mono text-slate-200">{email}</span> with what to expect next.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span>
            You'll receive another email the moment your account is approved. After that,
            you can sign in, browse open events, and join directly.
          </span>
        </li>
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 font-display text-sm font-bold text-white transition hover:bg-emerald-400"
        >
          Back to sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
