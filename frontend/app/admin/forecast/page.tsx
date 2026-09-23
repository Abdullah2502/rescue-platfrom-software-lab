"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CloudRain 
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, StatCard, ErrorState } from "@/components/ui/page";
import { DivisionForecast } from "@/lib/types";
import { ForecastCard } from "@/components/forecast/ForecastCard";
import { ForecastDetail } from "@/components/forecast/ForecastDetail";

export default function AdminForecastPage() {
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
      setError(err?.message || "Failed to load demand forecasts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForecasts();
  }, []);

  // Compute aggregate platform statistics
  const totalPredictedVolunteers = forecasts.reduce((acc, f) => acc + (f.predictedVolunteersNeeded ?? 0), 0);
  const totalAvailableVolunteers = forecasts.reduce((acc, f) => acc + (f.volunteerSupply?.availableVolunteers ?? 0), 0);
  const criticalDivisionsCount = forecasts.filter((f) => f.overallRiskLevel === "CRITICAL" || f.overallRiskLevel === "HIGH").length;
  const highestRiskDiv = forecasts.length > 0 ? forecasts[0] : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PREDICTIVE INTELLIGENCE & DEMAND FORECASTING"
        title="National Disaster Demand & Bottleneck Forecast."
        description="Machine-assisted telemetry synthesizing historical disaster frequency, live Open-Meteo meteorological conditions, Bangladesh seasonal hazard calendars, and local volunteer supply-deficit ratios."
        actions={
          <button
            onClick={loadForecasts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-surface px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition hover:border-red-500/40 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
            {loading ? "Computing Models…" : "Recalculate Models"}
          </button>
        }
      />

      {error && (
        <ErrorState
          title="Demand Forecast Error"
          description={error}
          action={
            <button
              onClick={loadForecasts}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-red-700 dark:text-red-300 hover:bg-red-500/20"
            >
              Retry Computation
            </button>
          }
        />
      )}

      {loading && forecasts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-mist gap-3 font-mono text-sm">
          <Activity className="h-6 w-6 text-red-500 animate-spin" />
          <span>Polling live meteorological telemetry & synthesizing historical models…</span>
        </div>
      )}

      {!loading && forecasts.length > 0 && (
        <>
          {/* Top Aggregations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Territories Monitored"
              value={forecasts.length}
              hint="8 Administrative Divisions"
            />
            <StatCard
              label="High / Critical Alerts"
              value={criticalDivisionsCount}
              hint="Requires active pre-positioning"
            />
            <StatCard
              label="Projected Personnel Demand"
              value={totalPredictedVolunteers}
              hint="Predicted volunteer surge requirement"
            />
            <StatCard
              label="Available Active Responders"
              value={totalAvailableVolunteers}
              hint="National ready personnel"
            />
          </div>

          {/* Meteorological & Seasonal Banner */}
          <div className="glass-card p-6 rounded-2xl border border-ink-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  Live Meteorological Multiplier Active
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono border border-emerald-500/30 font-bold">
                  Open-Meteo REST API
                </span>
              </div>
              <p className="text-sm text-mist font-sans leading-relaxed max-w-3xl">
                Real-time rainfall, wind velocities, and thermal ground telemetry are continuously injected into regional risk algorithms to identify supply bottlenecks before catastrophic onset.
              </p>
            </div>
            {highestRiskDiv && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 shrink-0 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-mist block font-semibold">Peak Territory Alert</span>
                  <span className="font-display font-bold text-sm text-red-700 dark:text-red-400">
                    {highestRiskDiv.divisionName} • {highestRiskDiv.primaryThreat} ({((highestRiskDiv.overallRiskScore ?? 0.2) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Forecast Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                Division Vulnerability & Volunteer Demand Matrices
              </h2>
              <span className="text-xs font-mono text-mist font-medium">
                Sorted by Overall Risk Index
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

      {/* Detail Slideover / Modal */}
      {selectedForecast && (
        <ForecastDetail
          forecast={selectedForecast}
          onClose={() => setSelectedForecast(null)}
        />
      )}
    </div>
  );
}
