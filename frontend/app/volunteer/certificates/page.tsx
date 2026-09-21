"use client";
import { useEffect, useState } from "react";
import { Award, CalendarDays, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/page";
import type { CertificateResponse } from "@/lib/types";

export default function VolunteerCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  useEffect(() => { api<CertificateResponse[]>("/api/v1/volunteer/certificates").then(setCertificates).catch(() => {}); }, []);
  return <div><PageHeader title="Your certificates." description="A permanent record of the disaster response events you joined. Print any certificate when you need it." />{certificates.length === 0 ? <EmptyState icon={<Award className="h-10 w-10 mx-auto" />} title="No certificates yet." description="Join an event. After the event, an admin can issue your certificate here." /> : <div className="grid gap-5 md:grid-cols-2">{certificates.map((certificate) => <article key={certificate.id} className="nx-card relative overflow-hidden"><div className="absolute right-5 top-5 rounded-full bg-emerald-500/10 p-3 text-emerald-500"><Award className="h-5 w-5" /></div><div className="eyebrow">Certificate of participation</div><h2 className="mt-3 font-display text-2xl text-ink">{certificate.eventTitle}</h2><p className="mt-2 text-sm text-mist">Issued to {certificate.volunteerName} by {certificate.organizerName}.</p><div className="mt-5 flex items-center gap-2 text-xs text-mist"><CalendarDays className="h-4 w-4 text-signal" />Issued {new Date(certificate.issuedAt).toLocaleDateString()}</div><div className="mt-5 flex items-center justify-between gap-3"><span className="font-mono text-xs text-mist">{certificate.certificateNumber}</span><Button size="sm" variant="secondary" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button></div></article>)}</div>}</div>;
}
