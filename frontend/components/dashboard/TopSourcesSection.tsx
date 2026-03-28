"use client";

import type { TopSourceItem } from "@/lib/types";

type Props = {
  items: TopSourceItem[];
  loading: boolean;
  error: string | null;
  subtitle: string;
  sourceFilterActive: boolean;
  topN?: number;
};

export function TopSourcesSection({
  items, loading, error, subtitle, sourceFilterActive, topN = 3,
}: Props) {
  const max = items.length ? Math.max(...items.map((i) => i.count), 1) : 1;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-[0.9375rem] font-bold tracking-[-0.02em] text-primary">Top sources</h2>
          <p className="max-w-[52ch] text-xs leading-[1.45] text-subtle">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded border border-[#e8eaed] bg-[#fafbfc] px-[7px] py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.06em] text-subtle">
          Top {topN}
        </span>
      </div>

      {sourceFilterActive && (
        <p className="mb-3.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.8125rem] leading-[1.45] text-amber-900" role="status">
          Clear the source filter to compare top contributing sources.
        </p>
      )}

      {error ? (
        <p className="text-sm text-sev-error-text">{error}</p>
      ) : loading ? (
        <ul className="flex list-none flex-col gap-3.5" aria-busy="true">
          {Array.from({ length: topN }).map((_, i) => (
            <li key={i} className="flex items-start gap-2.5 py-0.5">
              <div className="skeleton mt-0.5 h-[22px] w-[22px] shrink-0 rounded-md" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="skeleton mb-2 h-3.5 w-[min(40%,160px)]" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No log sources in this range.</p>
      ) : (
        <ul className="flex list-none flex-col gap-3.5">
          {items.map((row, index) => {
            const pct = (row.count / max) * 100;
            const isLead = index === 0;
            return (
              <li key={row.source} className={isLead ? "flex items-start gap-2.5 rounded-lg bg-[#f8f9fb] px-2.5 py-2" : "flex items-start gap-2.5 py-0.5"}>
                <span className={`mt-[3px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[0.625rem] font-semibold tabular-nums text-subtle${isLead ? " bg-[#f1f3f5]" : ""}`} aria-hidden>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className={isLead ? "truncate text-[0.8125rem] font-semibold tracking-[-0.02em] text-primary" : "truncate text-[0.8125rem] font-medium tracking-[-0.01em] text-[#3d4450]"} title={row.source}>
                      {row.source}
                    </span>
                    <span className={`text-[0.875rem] font-semibold tabular-nums ${isLead ? "text-slate-600" : "text-subtle"}`}>
                      {row.count}
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-[#eef0f3]" aria-hidden>
                    <div className={`h-full min-w-1 rounded-[inherit] transition-[width] duration-[350ms] ease-out ${isLead ? "bg-[#4a6fa5]" : "bg-[#6b8cce]"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
