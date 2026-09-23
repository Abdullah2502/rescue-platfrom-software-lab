"use client";

import React from "react";
import {
  X,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Users,
  Warehouse,
  ShieldAlert,
  Sparkles,
  Flame,
  Activity,
  Layers
} from "lucide-react";
import { DivisionForecast } from "@/lib/types";

interface ForecastDetailProps {
  forecast: DivisionForecast;
  onClose: () => void;
}

export function ForecastDetail({ forecast, onClose }: ForecastDetailProps) {
  const {
    divisionName,
    divisionBnName,
    overallRiskLevel,
    overallRiskScore,
    predictedVolunteersNeeded,
    primaryThreat,
    weather,
    volunteerSupply,
    resources,
    risks,
    recommendation,
    isUserDivision,
  } = forecast;

  const riskBadgeClass = {
    CRITICAL: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30",
    HIGH: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30",
    MODERATE: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    LOW: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  }[overallRiskLevel] || "bg-slate-500/10 text-mist border border-ink-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-ink-300 bg-surface shadow-2xl p-6 md:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto text-ink">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-mist hover:text-ink hover:bg-surface-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-ink tracking-tight">
              {divisionName} Division Risk Telemetry
            </h2>
            {divisionBnName && (
              <span className="text-sm font-sans text-mist">({divisionBnName})</span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider ${riskBadgeClass}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {overallRiskLevel} ({((overallRiskScore ?? 0.2) * 100).toFixed(0)}%)
            </span>
            {isUserDivision && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                Your Registered Division
              </span>
            )}
          </div>
          <p className="text-xs text-mist font-mono">
            AI Demand Forecast Model • Multi-Factor Historical & Meteorological Convergence
          </p>
        </div>

        {/* AI Actionable Recommendation */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 mt-0.5 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                Actionable Dispatch Advisory
              </h4>
              <p className="text-sm text-ink leading-relaxed font-sans font-medium">
                {recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Live Weather Telemetry (Open-Meteo Integration) */}
        {weather && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-mist flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                Real-Time Weather Telemetry (Open-Meteo Engine)
              </h3>
              <span className="text-[11px] font-mono text-mist font-semibold">
                Live Status: {weather.condition || "Operational"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-ink-300 bg-paper-200/60 dark:bg-surface p-3.5 shadow-xs">
                <div className="flex items-center gap-2 text-mist text-xs mb-1">
                  <Thermometer className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  <span>Temperature</span>
                </div>
                <div className="font-mono text-lg font-bold text-ink">
                  {(weather.temperature ?? 0).toFixed(1)}°C
                </div>
                <span className="text-[10px] text-mist font-mono">Ambient ground sensor</span>
              </div>

              <div className="rounded-xl border border-ink-300 bg-paper-200/60 dark:bg-surface p-3.5 shadow-xs">
                <div className="flex items-center gap-2 text-mist text-xs mb-1">
                  <CloudRain className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Precipitation</span>
                </div>
                <div className="font-mono text-lg font-bold text-cyan-700 dark:text-cyan-400">
                  {(weather.precipitation ?? 0).toFixed(1)} mm
                </div>
                <span className="text-[10px] text-mist font-mono">Current rainfall rate</span>
              </div>

              <div className="rounded-xl border border-ink-300 bg-paper-200/60 dark:bg-surface p-3.5 shadow-xs">
                <div className="flex items-center gap-2 text-mist text-xs mb-1">
                  <Wind className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Wind Velocity</span>
                </div>
                <div className="font-mono text-lg font-bold text-teal-700 dark:text-teal-400">
                  {(weather.windSpeed ?? 0).toFixed(1)} km/h
                </div>
                <span className="text-[10px] text-mist font-mono">10m anemometer speed</span>
              </div>

              <div className="rounded-xl border border-ink-300 bg-paper-200/60 dark:bg-surface p-3.5 shadow-xs">
                <div className="flex items-center gap-2 text-mist text-xs mb-1">
                  <Droplets className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Humidity</span>
                </div>
                <div className="font-mono text-lg font-bold text-ink">
                  {weather.relativeHumidity ?? 70}%
                </div>
                <span className="text-[10px] text-mist font-mono">Relative atmospheric</span>
              </div>
            </div>
          </div>
        )}

        {/* Threat Decomposition Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-mist flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Hazard Threat Matrix & Volunteer Demand Forecast
          </h3>

          <div className="overflow-x-auto rounded-xl border border-ink-300 bg-surface shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-ink-300 bg-paper-200 dark:bg-surface px-4 py-3 text-mist uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Disaster Vector</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Seasonal Factor</th>
                  <th className="p-3">Weather Factor</th>
                  <th className="p-3">Volunteer Deficit</th>
                  <th className="p-3 text-right">Predicted Need</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-300/60 text-ink">
                {(risks || []).map((r) => (
                  <tr key={r.eventType} className="hover:bg-surface-200/50 transition">
                    <td className="p-3 font-sans font-medium text-ink">
                      <div className="flex items-center gap-2">
                        {r.eventType === "FLOOD" && <CloudRain className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                        {r.eventType === "CYCLONE" && <Wind className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
                        {r.eventType === "FIRE" && <Flame className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
                        {r.eventType === "EARTHQUAKE" && <Activity className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                        {r.eventType === "PANDEMIC" && <ShieldAlert className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                        <span className="font-bold">{r.eventTypeName}</span>
                      </div>
                      <span className="text-[10px] text-mist font-mono block">
                        {r.historicalEventCount} historical disasters recorded
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.riskLevel === "CRITICAL" ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" :
                        r.riskLevel === "HIGH" ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" :
                        r.riskLevel === "MODERATE" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" :
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      }`}>
                        {r.riskLevel} ({((r.riskScore ?? 0.2) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold">{(r.seasonalMultiplier ?? 1).toFixed(2)}x</span>
                    </td>
                    <td className="p-3">
                      <span className={(r.weatherMultiplier ?? 1) > 1.1 ? "text-cyan-700 dark:text-cyan-400 font-bold" : "text-mist"}>
                        {(r.weatherMultiplier ?? 1).toFixed(2)}x
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={(r.volunteerGapRatio ?? 0) > 0.4 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-mist"}>
                        {((r.volunteerGapRatio ?? 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-ink">
                      {r.predictedVolunteersNeeded ?? 0} <span className="text-mist text-[10px] font-normal">pers.</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteer Supply & Resource Strain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Volunteer Demographics */}
          <div className="rounded-xl border border-ink-300 bg-paper-200/40 dark:bg-surface p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-mist flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Regional Volunteer Demographics
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-surface border border-ink-300 p-2 shadow-xs">
                <span className="text-[10px] text-mist block font-mono">Total Active</span>
                <span className="text-base font-mono font-bold text-ink">
                  {volunteerSupply?.activeVolunteers ?? 0}
                </span>
              </div>
              <div className="rounded-lg bg-surface border border-ink-300 p-2 shadow-xs">
                <span className="text-[10px] text-mist block font-mono">Deployed</span>
                <span className="text-base font-mono font-bold text-amber-700 dark:text-amber-400">
                  {volunteerSupply?.currentlyDeployed ?? 0}
                </span>
              </div>
              <div className="rounded-lg bg-surface border border-ink-300 p-2 shadow-xs">
                <span className="text-[10px] text-mist block font-mono">Available</span>
                <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {volunteerSupply?.availableVolunteers ?? 0}
                </span>
              </div>
            </div>

            {volunteerSupply?.topSkills && volunteerSupply.topSkills.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] text-mist block mb-1.5 font-medium">Dominant Regional Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {volunteerSupply.topSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded bg-surface border border-ink-300 px-2 py-0.5 text-[10px] font-mono text-cyan-800 dark:text-cyan-300 font-bold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Operational Infrastructure Capacity */}
          <div className="rounded-xl border border-ink-300 bg-paper-200/40 dark:bg-surface p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-mist flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Field Operations Readiness
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-surface border border-ink-300 p-2.5 shadow-xs">
                <span className="text-[10px] text-mist block font-mono">Open Shelters</span>
                <span className="text-base font-mono font-bold text-teal-700 dark:text-teal-400">
                  {resources?.openShelters ?? 0}{" "}
                  <span className="text-xs text-mist font-normal">/ {resources?.totalShelters ?? 0}</span>
                </span>
              </div>
              <div className="rounded-lg bg-surface border border-ink-300 p-2.5 shadow-xs">
                <span className="text-[10px] text-mist block font-mono">Available Beds</span>
                <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {resources?.availableBeds ?? 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-mist">Total Tracked Inventory Lines:</span>
              <span className="font-mono text-ink font-bold">{resources?.totalInventoryItems ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-mist">Low Stock Buffer Alerts:</span>
              <span className={`font-mono font-bold ${(resources?.lowStockItems ?? 0) > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                {resources?.lowStockItems ?? 0} items
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-ink-300">
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-300 bg-surface px-4 py-2 font-mono text-xs font-bold text-ink hover:bg-surface-200 transition shadow-xs"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
}
