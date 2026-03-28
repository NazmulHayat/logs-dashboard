"use client";

import { useState } from "react";
import type { SeverityCount } from "@/lib/types";
import { SEVERITIES } from "@/lib/types";

type Props = { items: SeverityCount[]; loading: boolean; error: string | null };

const SEVERITY_COLORS: Record<string, string> = {
  DEBUG: "#64748b", INFO: "#2563eb", WARNING: "#d97706", ERROR: "#b91c1c",
};

function normalize(items: SeverityCount[]): SeverityCount[] {
  const map = new Map(items.map((i) => [i.severity, i.count]));
  return SEVERITIES.map((s) => ({ severity: s, count: map.get(s) ?? 0 }));
}

function yTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const step = Math.ceil(max / count);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step; v += step) {
    ticks.push(v);
    if (ticks.length > count + 1) break;
  }
  return ticks;
}

export function SeverityChart({ items, loading, error }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (error) return <p className="mt-2 text-sm text-sev-error-text">{error}</p>;
  if (loading) return <div className="w-full"><div className="skeleton mt-3 h-[180px]" /></div>;

  const data = normalize(items);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const ticks = yTicks(maxCount);
  const ceiling = ticks[ticks.length - 1] || 1;

  return (
    <div className="w-full">
      <div className="flex h-[280px]">
        <div className="flex min-w-8 flex-col justify-between pb-8 pr-3 text-right">
          {[...ticks].reverse().map((t) => (
            <span key={t} className="font-mono text-[0.6875rem] leading-none tabular-nums text-muted">{t}</span>
          ))}
        </div>
        <div className="relative flex flex-1 border-b border-l border-border">
          <div className="pointer-events-none absolute inset-0">
            {ticks.map((t) => (
              <div key={t} className="absolute left-0 right-0 h-px bg-[#eff0f3]" style={{ bottom: `${(t / ceiling) * 100}%` }} />
            ))}
          </div>
          {data.map((d) => {
            const heightPct = ceiling > 0 ? (d.count / ceiling) * 100 : 0;
            const color = SEVERITY_COLORS[d.severity] ?? "#9ca3af";
            const isHovered = hovered === d.severity;
            const isEmpty = d.count === 0;
            const barH = isEmpty ? 0 : Math.max(heightPct, 4);
            const tooltipBottom = isEmpty ? "calc(24px + 4px)" : `calc(${barH}% + 4px)`;
            return (
              <div key={d.severity} className={`relative flex flex-1 flex-col items-center${isHovered ? " hist-col-hover" : ""}`}
                onMouseEnter={() => setHovered(d.severity)} onMouseLeave={() => setHovered(null)}>
                <div className="relative flex min-h-0 w-full flex-1 flex-col justify-end px-1.5">
                  <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end">
                    <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-end">
                      <div className={`hist-hover-card${isHovered ? " hist-hover-card--open" : ""}`} role="tooltip" aria-hidden={!isHovered} style={{ bottom: tooltipBottom }}>
                        <span className="text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-subtle">{d.severity}</span>
                        <span className="text-xl font-bold leading-[1.15] tracking-[-0.03em] tabular-nums text-primary">{d.count}</span>
                        <span className="text-[0.625rem] font-medium text-subtle">logs</span>
                      </div>
                      {isEmpty ? <div className="hist-bar-empty" /> : <div className="hist-bar" style={{ height: `${barH}%`, backgroundColor: color }} />}
                    </div>
                  </div>
                </div>
                <span className="pt-2.5 text-center text-[0.625rem] font-bold uppercase tracking-[0.07em] text-subtle">{d.severity}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
