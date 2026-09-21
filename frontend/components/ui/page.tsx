import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">{title}</h1>
          {description && (
            <p className="max-w-3xl text-sm text-slate-400 leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <hr className="border-slate-800" />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  className,
}: {
  eyebrow?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-1", className)}>
      {eyebrow && (
        <div className="font-mono text-xs font-bold text-red-500 uppercase tracking-wider">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold text-slate-100 tracking-tight">{title}</h2>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40 backdrop-blur-sm">
      {icon && <div className="mx-auto mb-4 w-12 h-12 text-slate-500 flex items-center justify-center">{icon}</div>}
      <div className="font-display text-xl font-bold text-slate-100">{title}</div>
      {description && <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-red-500/30 bg-red-950/20 rounded-2xl p-6 text-red-300">
      <div className="font-display text-lg font-bold text-red-400">{title}</div>
      {description && <p className="mt-1 text-sm text-red-300/80">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-2 border border-slate-800 relative overflow-hidden group">
      <div className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="font-display text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight group-hover:text-red-400 transition-colors">
        {value}
      </div>
      {hint && <div className="text-xs text-slate-500 font-mono">{hint}</div>}
    </div>
  );
}
