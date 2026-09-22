"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Send, 
  Eye, 
  X,
  FileCheck2,
  Calendar,
  Building
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { NgoResponse, PageResp, Location } from "@/lib/types";

export default function VolunteerNgosPage() {
  const [data, setData] = useState<PageResp<NgoResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divisions, setDivisions] = useState<Location[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedNgo, setSelectedNgo] = useState<NgoResponse | null>(null);

  // Load divisions for filter
  useEffect(() => {
    api<Location[]>("/api/v1/locations/divisions")
      .then(setDivisions)
      .catch(() => {});
  }, []);

  async function loadNgos() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "0",
        size: "50",
      });
      if (search.trim()) params.set("q", search.trim());
      if (selectedDivision) params.set("divisionId", selectedDivision);

      const resp = await api<PageResp<NgoResponse>>(`/api/v1/volunteer/ngos?${params.toString()}`);
      setData(resp);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNgos();
  }, [selectedDivision]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadNgos();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner NGOs Directory"
        description="Discover verified non-governmental organizations across Bangladesh. Inspect their operational base and propose coordinated disaster response events."
      />

      {/* Filters Bar */}
      <div className="nx-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist" />
            <Input
              type="text"
              placeholder="Search by NGO name or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-mist whitespace-nowrap">Filter Division:</span>
          <select
            className="h-10 rounded bg-surface border border-ink-300 px-3 text-sm text-ink focus:outline-none focus:border-signal"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.bnName ? `(${d.bnName})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NGO Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-mist">Loading verified NGOs...</div>
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10 mx-auto text-mist" />}
          title="No NGOs Found"
          description={
            search || selectedDivision
              ? "Try adjusting your search criteria or division filter."
              : "There are currently no approved partner NGOs visible."
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.content.map((ngo) => (
            <article
              key={ngo.id}
              className="nx-card flex flex-col justify-between hover:border-signal/50 transition-colors space-y-4"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-surface-raised border border-ink-300 flex items-center justify-center font-display font-bold text-signal text-lg">
                      {ngo.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-ink text-base line-clamp-1">
                        {ngo.name}
                      </h3>
                      <span className="text-xs text-mist font-mono">
                        Reg: {ngo.registrationNo}
                      </span>
                    </div>
                  </div>
                  <Badge tone="relief" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                </div>

                {/* Location Badge */}
                <div className="flex items-center gap-1.5 text-xs text-mist">
                  <MapPin className="h-3.5 w-3.5 text-signal shrink-0" />
                  <span className="truncate">
                    {[ngo.thana?.name, ngo.district?.name, ngo.division?.name]
                      .filter(Boolean)
                      .join(", ") || "Bangladesh"}
                  </span>
                </div>

                {/* Contacts Preview */}
                <div className="space-y-1 text-xs text-mist pt-1 border-t border-ink-300/40">
                  {ngo.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5 text-mist shrink-0" />
                      <span>{ngo.phone}</span>
                    </div>
                  )}
                  {ngo.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-mist shrink-0" />
                      <span>{ngo.email}</span>
                    </div>
                  )}
                  {ngo.website && (
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="h-3.5 w-3.5 text-mist shrink-0" />
                      <a
                        href={ngo.website.startsWith("http") ? ngo.website : `https://${ngo.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-signal hover:underline flex items-center gap-1 truncate"
                      >
                        {ngo.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3 inline shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-ink-300/50">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedNgo(ngo)}
                  className="flex items-center gap-1.5 text-xs flex-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Details
                </Button>
                <Link
                  href={`/volunteer/events/new?ngoId=${ngo.id}&ngoName=${encodeURIComponent(ngo.name)}`}
                  className="flex-1"
                >
                  <Button size="sm" variant="primary" className="w-full flex items-center gap-1.5 text-xs">
                    <Send className="h-3.5 w-3.5" /> Request Event
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* NGO Details Modal */}
      {selectedNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-ink-300 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-ink-300 flex items-center justify-between bg-surface-raised">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-signal/10 text-signal rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink text-base">
                    NGO Organization Profile
                  </h3>
                  <p className="text-xs text-mist">Verified Humanitarian Partner</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNgo(null)}
                className="p-1 rounded text-mist hover:text-ink hover:bg-surface transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-raised/60 border border-ink-300/50">
                <div className="h-16 w-16 rounded-xl bg-signal/15 border border-signal/30 flex items-center justify-center text-signal font-display font-bold text-2xl shrink-0">
                  {selectedNgo.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-ink text-lg leading-tight">
                    {selectedNgo.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge tone="relief" className="text-[10px]">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" /> Approved Partner
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Registration & Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-surface-raised rounded-lg border border-ink-300/40">
                  <span className="text-xs text-mist block mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-signal" /> Government Reg. No.
                  </span>
                  <span className="font-mono text-sm text-ink font-semibold">
                    {selectedNgo.registrationNo}
                  </span>
                </div>

                <div className="p-3 bg-surface-raised rounded-lg border border-ink-300/40">
                  <span className="text-xs text-mist block mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-signal" /> Partnership Active Since
                  </span>
                  <span className="text-xs text-ink">
                    {selectedNgo.approvedAt
                      ? formatDateTime(selectedNgo.approvedAt)
                      : selectedNgo.createdAt
                      ? formatDateTime(selectedNgo.createdAt)
                      : "Verified Member"}
                  </span>
                </div>
              </div>

              {/* Operational Headquarters */}
              <div className="p-4 bg-surface-raised rounded-lg border border-ink-300/40 space-y-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-signal" /> Operational Headquarters
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-mist block">Division</span>
                    <span className="text-ink font-medium">
                      {selectedNgo.division?.name || "—"}
                    </span>
                    {selectedNgo.division?.bnName && (
                      <span className="text-[10px] text-mist block">
                        ({selectedNgo.division.bnName})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-mist block">District</span>
                    <span className="text-ink font-medium">
                      {selectedNgo.district?.name || "—"}
                    </span>
                    {selectedNgo.district?.bnName && (
                      <span className="text-[10px] text-mist block">
                        ({selectedNgo.district.bnName})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-mist block">Thana</span>
                    <span className="text-ink font-medium">
                      {selectedNgo.thana?.name || "—"}
                    </span>
                    {selectedNgo.thana?.bnName && (
                      <span className="text-[10px] text-mist block">
                        ({selectedNgo.thana.bnName})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Communications */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink">Official Contact Channels</span>
                <div className="grid grid-cols-1 gap-2">
                  <a
                    href={`mailto:${selectedNgo.email}`}
                    className="flex items-center gap-3 p-3 bg-surface-raised rounded-lg border border-ink-300/40 hover:border-signal/50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-signal shrink-0" />
                    <div className="truncate">
                      <span className="text-xs text-mist block">Official Email</span>
                      <span className="text-xs text-ink font-medium truncate">
                        {selectedNgo.email}
                      </span>
                    </div>
                  </a>

                  {selectedNgo.phone && (
                    <a
                      href={`tel:${selectedNgo.phone}`}
                      className="flex items-center gap-3 p-3 bg-surface-raised rounded-lg border border-ink-300/40 hover:border-signal/50 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-signal shrink-0" />
                      <div className="truncate">
                        <span className="text-xs text-mist block">Phone Line</span>
                        <span className="text-xs text-ink font-medium">
                          {selectedNgo.phone}
                        </span>
                      </div>
                    </a>
                  )}

                  {selectedNgo.website && (
                    <a
                      href={selectedNgo.website.startsWith("http") ? selectedNgo.website : `https://${selectedNgo.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-surface-raised rounded-lg border border-ink-300/40 hover:border-signal/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Globe className="h-4 w-4 text-signal shrink-0" />
                        <div className="truncate">
                          <span className="text-xs text-mist block">Official Website</span>
                          <span className="text-xs text-signal font-medium truncate">
                            {selectedNgo.website}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-mist shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-ink-300 flex items-center justify-between bg-surface-raised">
              <Button variant="secondary" onClick={() => setSelectedNgo(null)}>
                Close
              </Button>
              <Link
                href={`/volunteer/events/new?ngoId=${selectedNgo.id}&ngoName=${encodeURIComponent(selectedNgo.name)}`}
              >
                <Button variant="primary" className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> Request Event to this NGO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

