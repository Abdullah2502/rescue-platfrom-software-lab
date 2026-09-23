"use client";

import React from "react";
import { Search, ArrowUpDown, Filter, RotateCcw } from "lucide-react";
import type { EventType, Severity, EventStatus } from "@/lib/types";

export type EventSortOption =
  | "startAt_asc"
  | "startAt_desc"
  | "title_asc"
  | "title_desc"
  | "severity_desc"
  | "severity_asc"
  | "participants_desc"
  | "participants_asc";

export interface EventFilterState {
  search: string;
  type: string;
  severity: string;
  status: string;
  sortBy: EventSortOption;
}

export const initialEventFilters: EventFilterState = {
  search: "",
  type: "ALL",
  severity: "ALL",
  status: "ALL",
  sortBy: "startAt_asc",
};

interface EventFiltersBarProps {
  filters: EventFilterState;
  onChange: (filters: EventFilterState) => void;
  statusOptions?: { value: string; label: string }[];
  totalResults?: number;
  showStatusFilter?: boolean;
}

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "FLOOD", label: "Flood" },
  { value: "CYCLONE", label: "Cyclone" },
  { value: "EARTHQUAKE", label: "Earthquake" },
  { value: "FIRE", label: "Fire" },
  { value: "PANDEMIC", label: "Pandemic" },
  { value: "OTHER", label: "Other" },
];

const SEVERITIES: { value: string; label: string }[] = [
  { value: "ALL", label: "All Severities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const DEFAULT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

const SORT_OPTIONS: { value: EventSortOption; label: string }[] = [
  { value: "startAt_asc", label: "Date: Soonest First" },
  { value: "startAt_desc", label: "Date: Latest First" },
  { value: "severity_desc", label: "Severity: Critical to Low" },
  { value: "severity_asc", label: "Severity: Low to Critical" },
  { value: "participants_desc", label: "Volunteers: Most Joined" },
  { value: "participants_asc", label: "Volunteers: Least Joined" },
  { value: "title_asc", label: "Title: A → Z" },
  { value: "title_desc", label: "Title: Z → A" },
];

export function EventFiltersBar({
  filters,
  onChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  totalResults,
  showStatusFilter = true,
}: EventFiltersBarProps) {
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.type !== "ALL" ||
    filters.severity !== "ALL" ||
    filters.status !== "ALL" ||
    filters.sortBy !== "startAt_asc";

  const update = (key: keyof EventFilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange({ ...initialEventFilters });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Top Row: Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search by title, location, or description..."
            className="h-10 w-full pl-9 pr-4 rounded-lg border border-slate-700/80 bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
          />
          {filters.search && (
            <button
              onClick={() => update("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-red-500" />
            <span className="hidden md:inline">Sort:</span>
          </div>
          <select
            value={filters.sortBy}
            onChange={(e) => update("sortBy", e.target.value as EventSortOption)}
            className="h-10 appearance-none rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 pr-8 text-xs font-medium text-slate-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Row: Filter Dropdowns and Quick Counts */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
          <Filter className="h-3 w-3 text-red-500" />
          <span>Filters:</span>
        </div>

        {/* Disaster Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => update("type", e.target.value)}
          className={`h-8.5 rounded-lg border px-2.5 text-xs transition cursor-pointer ${filters.type !== "ALL"
              ? "border-red-500/80 bg-red-500/10 text-red-400 font-semibold"
              : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
            }`}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity}
          onChange={(e) => update("severity", e.target.value)}
          className={`h-8.5 rounded-lg border px-2.5 text-xs transition cursor-pointer ${filters.severity !== "ALL"
              ? "border-red-500/80 bg-red-500/10 text-red-400 font-semibold"
              : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
            }`}
        >
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        {showStatusFilter && (
          <select
            value={filters.status}
            onChange={(e) => update("status", e.target.value)}
            className={`h-8.5 rounded-lg border px-2.5 text-xs transition cursor-pointer ${filters.status !== "ALL"
                ? "border-red-500/80 bg-red-500/10 text-red-400 font-semibold"
                : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
              }`}
          >
            {statusOptions.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        )}

        {/* Reset button if filters applied */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition ml-auto"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}

        {totalResults !== undefined && (
          <div className={`text-xs text-slate-500 ${!hasActiveFilters ? "ml-auto" : ""}`}>
            Showing <span className="font-semibold text-slate-300">{totalResults}</span> events
          </div>
        )}
      </div>
    </div>
  );
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function filterAndSortEvents<T extends {
  title: string;
  description?: string;
  type: EventType;
  severity: Severity;
  status: EventStatus;
  startAt: string;
  participantCount?: number;
  divisions?: { name: string }[];
  districts?: { name: string }[];
  thanas?: { name: string }[];
  organizerName?: string;
}>(events: T[], filters: EventFilterState): T[] {
  return events
    .filter((event) => {
      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(query);
        const descMatch = event.description?.toLowerCase().includes(query);
        const organizerMatch = event.organizerName?.toLowerCase().includes(query);
        const divMatch = event.divisions?.some((d) => d.name?.toLowerCase().includes(query));
        const distMatch = event.districts?.some((d) => d.name?.toLowerCase().includes(query));
        const thanaMatch = event.thanas?.some((t) => t.name?.toLowerCase().includes(query));

        if (!titleMatch && !descMatch && !organizerMatch && !divMatch && !distMatch && !thanaMatch) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== "ALL" && event.type !== filters.type) {
        return false;
      }

      // Severity filter
      if (filters.severity !== "ALL" && event.severity !== filters.severity) {
        return false;
      }

      // Status filter
      if (filters.status !== "ALL" && event.status !== filters.status) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "startAt_asc":
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        case "startAt_desc":
          return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        case "severity_desc":
          return (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
        case "severity_asc":
          return (SEVERITY_WEIGHT[a.severity] || 0) - (SEVERITY_WEIGHT[b.severity] || 0);
        case "participants_desc":
          return (b.participantCount || 0) - (a.participantCount || 0);
        case "participants_asc":
          return (a.participantCount || 0) - (b.participantCount || 0);
        default:
          return 0;
      }
    });
}

