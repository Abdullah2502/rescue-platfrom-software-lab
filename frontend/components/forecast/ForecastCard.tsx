"use client";

import React from "react";
import { 
  CloudRain, 
  Wind, 
  Flame, 
  Activity, 
  AlertTriangle, 
  Users, 
  Thermometer, 
  ShieldCheck, 
  Compass, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { DivisionForecast } from "@/lib/types";

interface ForecastCardProps {
  forecast: DivisionForecast;
  isSelected: boolean;
  onSelect: (forecast: DivisionForecast) => void;
}

export function ForecastCard({ forecast, isSelected, onSelect }: ForecastCardProps) {
  const {
    divisionName,
    divisionBnName,
    overallRiskLevel,
    overallRiskScore,
    predictedVolunteersNeeded,
    primaryThreat,
    isUserDivision,
    weather,
    volunteerSupply,
  } = forecast;

  const riskPercent = Math.min(100, Math.round((overallRiskScore ?? 0.2) * 100));

  const riskStyles = {
    CRITICAL: {
      badge: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30",
      bar: "bg-red-500",
      glow: "hover:border-red-500/50 shadow-red-500/5",
    },
    HIGH: {
      badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30",
      bar: "bg-orange-500",
      glow: "hover:border-orange-500/50 shadow-orange-500/5",
    },
    MODERATE: {
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
      bar: "bg-amber-500",
      glow: "hover:border-amber-500/50 shadow-amber-500/5",
    },
    LOW: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
      bar: "bg-emerald-500",
      glow: "hover:border-emerald-500/50 shadow-emerald-500/5",
    },
  }[overallRiskLevel] || {
    badge: "bg-slate-500/10 text-mist border border-ink-300",
    bar: "bg-slate-400",
    glow: "",
  };

  const threatIcon = () => {
    switch (primaryThreat?.toUpperCase()) {
      case "FLOOD":
        return <CloudRain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case "CYCLONE":
        return <Wind className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case "FIRE":
        return <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(forecast)}
      className={`glass-card p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden border ${
        isUserDivision
          ? "border-amber-500/70 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30"
          : isSelected
          ? "border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20"
          : "border-ink-300 hover:border-red-500/40 " + riskStyles.glow
      }`}
    >
      {/* Priority Banner for NGO user division */}
      {isUserDivision && (
        <div className="absolute -top-1 left-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-100 dark:bg-amber-500/20 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 shadow-xs">
          <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-300 animate-pulse" />
          <span>Your Division • Priority Focus</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg text-ink group-hover:text-signal transition-colors">
              {divisionName}
            </h3>
            {divisionBnName && (
              <span className="text-xs text-mist font-sans">({divisionBnName})</span>
            )}
          </div>
          <p className="text-xs text-mist flex items-center gap-1.5 mt-0.5 font-mono">
            <Compass className="h-3 w-3" />
            <span>Region Centroid Telemetry</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${riskStyles.badge}`}
          >
            <AlertTriangle className="h-3 w-3" />
            {overallRiskLevel}
          </span>
        </div>
      </div>

      {/* Live Weather Strip */}
      {weather && (
        <div className="mb-4 rounded-xl border border-ink-300 bg-paper-200/60 dark:bg-surface p-2.5 flex items-center justify-between text-xs text-ink font-mono shadow-xs">
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            <span className="font-bold">{(weather.temperature ?? 0).toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
            <CloudRain className="h-3.5 w-3.5" />
            <span className="font-bold">{(weather.precipitation ?? 0).toFixed(1)}mm</span>
          </div>
          <div className="flex items-center gap-1 text-teal-700 dark:text-teal-400">
            <Wind className="h-3.5 w-3.5" />
            <span className="font-bold">{(weather.windSpeed ?? 0).toFixed(0)} km/h</span>
          </div>
          <span className="text-[10px] text-mist truncate max-w-[90px]">{weather.condition || "Fair"}</span>
        </div>
      )}

      {/* Primary Threat & Risk Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-mist flex items-center gap-1.5 font-sans font-medium">
            {threatIcon()}
            Primary Risk: <strong className="text-ink uppercase font-mono font-bold">{primaryThreat || "FLOOD"}</strong>
          </span>
          <span className="font-mono text-ink font-bold">{riskPercent}% Index</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-200 dark:bg-slate-800 border border-ink-300/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${riskStyles.bar}`}
            style={{ width: `${riskPercent}%` }}
          />
        </div>
      </div>

      {/* Personnel Demand Forecast */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-300/80 text-xs">
        <div>
          <span className="text-mist text-[11px] block font-mono">Predicted Need</span>
          <span className="font-mono font-bold text-ink flex items-center gap-1 text-sm mt-0.5">
            <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            {predictedVolunteersNeeded ?? 0} <span className="text-[10px] text-mist font-normal font-sans">volunteers</span>
          </span>
        </div>
        <div>
          <span className="text-mist text-[11px] block font-mono">Active Available</span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-sm mt-0.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {volunteerSupply?.availableVolunteers ?? 0}{" "}
            <span className="text-[10px] text-mist font-normal font-sans">ready</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono font-bold text-mist group-hover:text-signal transition-colors pt-2">
        <span>Inspect Forecast Analysis</span>
        <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
