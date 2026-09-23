"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  CloudRain, 
  Sparkles,
  MapPin
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, StatCard, ErrorState } from "@/components/ui/page";
import { DivisionForecast } from "@/lib/types";
import { ForecastCard } from "@/components/forecast/ForecastCard";
import { ForecastDetail } from "@/components/forecast/ForecastDetail";

export default function NgoForecastPage() {
  const [forecasts, setForecasts] = useState<DivisionForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<DivisionForecast | null>(null);

  async function loadForecasts() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<DivisionForecast[]>("/api/v1/forecast/divisions");
      setForecasts(data || []);
      if (selectedForecast) {
        const updated = (data || []).find((f) => f.divisionId === selectedForecast.divisionId);
        if (updated) setSelectedForecast(updated);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load national demand forecasts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForecasts();
  }, []);

  const userDivision = forecasts.find((f) => f.isUserDivision);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="OPERATIONAL INTELLIGENCE"
        title="National Demand & Logistics Forecasting."
        description="Country-wide predictive risk modeling for humanitarian NGOs. Your registered operational division is prioritized to streamline local volunteer deployments and resource pre-positioning."
        actions={
          <button
            onClick={loadForecasts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-surface px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition hover:border-amber-500/50 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-600 dark:text-amber-400" : ""}`} />
            {loading ? "Refreshing Models…" : "Refresh Forecast"}
          </button>
        }
      />

      {error && (
        <ErrorState
          title="Telemetry Feed Error"
          description={error}
          action={
            <button
              onClick={loadForecasts}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            >
              Retry
            </button>
          }
        />
      )}

      {loading && forecasts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-mist gap-3 font-mono text-sm">
          <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-spin" />
          <span>Synthesizing national meteorological feeds & division volunteer densities…</span>
        </div>
      )}

      {!loading && forecasts.length > 0 && (
        <>
          {/* User's Assigned Division Priority Highlight */}
          {userDivision ? (
            <div className="rounded-2xl border border-amber-500/50 bg-surface dark:bg-amber-950/20 p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-300 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-paper-200 dark:bg-slate-800 border border-ink-300 text-amber-600 dark:text-amber-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Primary Operational Territory
                      </span>
                      <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-mono border border-amber-500/30 font-semibold">
                        Priority Focus
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      {userDivision.divisionName} Division Risk Profile
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedForecast(userDivision)}
                  className="rounded-xl border border-ink-300 bg-surface px-3.5 py-1.5 font-mono text-xs font-semibold text-ink hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 shadow-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Inspect In-Depth Telemetry
                </button>
              </div>

              {/* Quick stats for user division */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="rounded-xl border border-ink-300 bg-paper-200/50 dark:bg-surface p-3.5 shadow-xs">
                  <span className="text-mist text-[11px] block">Overall Hazard Status</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1 block">
                    {userDivision.overallRiskLevel} ({((userDivision.overallRiskScore ?? 0.2) * 100).toFixed(0)}%)
                  </span>
                  <span className="text-[10px] text-mist mt-0.5 block uppercase font-semibold">
                    Primary: {userDivision.primaryThreat}
                  </span>
                </div>

                <div className="rounded-xl border border-ink-300 bg-paper-200/50 dark:bg-surface p-3.5 shadow-xs">
                  <span className="text-mist text-[11px] block">Live Weather Sensor</span>
                  <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400 mt-1 block">
                    {userDivision.weather ? `${(userDivision.weather.temperature ?? 0).toFixed(1)}°C • ${(userDivision.weather.precipitation ?? 0).toFixed(1)}mm` : "Sensors Active"}
                  </span>
                  <span className="text-[10px] text-mist mt-0.5 block truncate">
                    {userDivision.weather?.condition || "Fair / Operational"}
                  </span>
                </div>

                <div className="rounded-xl border border-ink-300 bg-paper-200/50 dark:bg-surface p-3.5 shadow-xs">
                  <span className="text-mist text-[11px] block">Predicted Personnel Need</span>
                  <span className="text-sm font-bold text-ink mt-1 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    {userDivision.predictedVolunteersNeeded ?? 0}
                  </span>
                  <span className="text-[10px] text-mist mt-0.5 block">Estimated responders</span>
                </div>

                <div className="rounded-xl border border-ink-300 bg-paper-200/50 dark:bg-surface p-3.5 shadow-xs">
                  <span className="text-mist text-[11px] block">Available Ready Pool</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {userDivision.volunteerSupply?.availableVolunteers ?? 0}
                  </span>
                  <span className="text-[10px] text-mist mt-0.5 block">
                    of {userDivision.volunteerSupply?.activeVolunteers ?? 0} registered
                  </span>
                </div>
              </div>

              {/* Recommendation snippet */}
              <p className="text-xs text-ink bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 leading-relaxed shadow-xs">
                <strong className="text-amber-700 dark:text-amber-300 font-mono">Directive: </strong>
                {userDivision.recommendation}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-300 bg-surface p-4 flex items-center gap-3 shadow-xs">
              <CloudRain className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <p className="text-xs text-ink">
                Displaying full national coverage. Your organization can monitor risk indicators across all 8 Bangladesh divisions.
              </p>
            </div>
          )}

          {/* Full Country Scope - All 8 Divisions Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                National Divisions Risk & Surge Forecast
              </h2>
              <span className="text-xs font-mono text-mist font-medium">
                All 8 Bangladesh Territorial Divisions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {forecasts.map((f) => (
                <ForecastCard
                  key={f.divisionId}
                  forecast={f}
                  isSelected={selectedForecast?.divisionId === f.divisionId}
                  onSelect={(item) => setSelectedForecast(item)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal Detail */}
      {selectedForecast && (
        <ForecastDetail
          forecast={selectedForecast}
          onClose={() => setSelectedForecast(null)}
        />
      )}
    </div>
  );
}
