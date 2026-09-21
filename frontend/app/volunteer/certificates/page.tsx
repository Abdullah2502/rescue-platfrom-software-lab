"use client";
import { useEffect, useState } from "react";
import { Award, CalendarDays, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/page";
import type { CertificateResponse } from "@/lib/types";

export default function VolunteerCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateResponse | null>(null);

  useEffect(() => {
    api<CertificateResponse[]>("/api/v1/volunteer/certificates")
      .then(setCertificates)
      .catch(() => { });
  }, []);

  // Triggers print for a specific certificate
  const handlePrint = (cert: CertificateResponse) => {
    setSelectedCert(cert);
    // Give React a moment to render the print container, then trigger print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div>
      <PageHeader
        title="Your certificates."
        description="A permanent record of the disaster response events you joined. Print any certificate when you need it."
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-10 w-10 mx-auto" />}
          title="No certificates yet."
          description="Join an event. After the event, an admin can issue your certificate here."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="nx-card relative overflow-hidden">
              <div className="absolute right-5 top-5 rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                <Award className="h-5 w-5" />
              </div>
              <div className="eyebrow">Certificate of participation</div>
              <h2 className="mt-3 font-display text-2xl text-ink">{certificate.eventTitle}</h2>
              <p className="mt-2 text-sm text-mist">Issued to {certificate.volunteerName} by {certificate.organizerName}.</p>

              <div className="mt-5 flex items-center gap-2 text-xs text-mist">
                <CalendarDays className="h-4 w-4 text-signal" />
                Issued {new Date(certificate.issuedAt).toLocaleDateString()}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-mist">{certificate.certificateNumber}</span>
                <Button size="sm" variant="secondary" onClick={() => handlePrint(certificate)}>
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Hidden formal certificate layout that ONLY appears when printing */}
      {selectedCert && (
        <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-50 print:flex-col print:items-center print:justify-center print:p-12 print:text-black">
          <div className="border-8 border-double border-slate-800 p-12 text-center max-w-4xl w-full space-y-6">
            <div className="uppercase tracking-widest text-sm font-semibold text-slate-500">Certificate of Recognition</div>
            <h1 className="text-4xl font-serif font-bold tracking-wide">Nexora Disaster Response Platform</h1>
            <p className="text-sm italic text-slate-600">This certificate is proudly presented to</p>

            <div className="text-3xl font-bold font-serif border-b-2 border-slate-400 inline-block px-12 pb-2">
              {selectedCert.volunteerName}
            </div>

            <p className="text-base text-slate-700 max-w-xl mx-auto leading-relaxed">
              For dedicated service and active participation in response to the disaster event: <br />
              <strong className="text-xl text-black font-serif">{selectedCert.eventTitle}</strong>
            </p>

            <div className="grid grid-cols-2 gap-8 pt-12 text-sm border-t border-slate-300 mt-8">
              <div>
                <p className="font-semibold">{selectedCert.organizerName}</p>
                <p className="text-slate-500 text-xs">Organizing Authority</p>
              </div>
              <div>
                <p className="font-mono text-xs text-slate-500">ID: {selectedCert.certificateNumber}</p>
                <p className="text-slate-500 text-xs">Issued on {new Date(selectedCert.issuedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
