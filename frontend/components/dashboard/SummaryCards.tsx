import type { SummaryResponse } from "@/lib/types";

type Props = {
  summary: SummaryResponse | null;
  loading: boolean;
  error: string | null;
  layout?: "flow" | "dashboard";
};

type RowDef = {
  key: keyof SummaryResponse;
  label: string;
  format: (s: SummaryResponse) => string;
};

const ACCENT: Record<string, string> = {
  total_logs: "#94a3b8",
  error_logs: "#dc2626",
  error_rate: "#ea580c",
  unique_sources: "#16a34a",
};

const VALUE_COLOR: Record<string, string> = {
  total_logs: "#1e293b",
  error_logs: "#b91c1c",
  error_rate: "#c2410c",
  unique_sources: "#15803d",
};

const ROWS: RowDef[] = [
  { key: "total_logs", label: "Total logs", format: (s) => String(s.total_logs) },
  { key: "error_logs", label: "Error logs", format: (s) => String(s.error_logs) },
  { key: "error_rate", label: "Error rate", format: (s) => s.total_logs === 0 ? "—" : `${s.error_rate.toFixed(1)}%` },
  { key: "unique_sources", label: "Unique sources", format: (s) => String(s.unique_sources) },
];

export function SummaryCards({ summary, loading, error, layout = "flow" }: Props) {
  const isDash = layout === "dashboard";
  const gridCls = isDash
    ? "grid grid-cols-2 items-stretch gap-3.5 max-[420px]:grid-cols-1"
    : "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4";
  const cardExtra = isDash ? " flex min-h-[5.25rem] flex-col justify-center text-left" : "";

  if (error) {
    return <div className={gridCls}><p className="col-span-full text-sm text-sev-error-text">{error}</p></div>;
  }

  if (loading) {
    return (
      <div className={gridCls}>
        {ROWS.map(({ key }) => (
          <div key={key} className={`rounded-[10px] border border-border bg-surface p-[1.125rem] shadow-card border-l-[3px]${cardExtra}`} style={{ borderLeftColor: ACCENT[key] }}>
            <div className="skeleton h-3 w-20 mb-3" />
            <div className="skeleton h-7 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return <div className={gridCls}><p className="col-span-full py-10 text-center text-[0.9375rem] text-muted">No dashboard data for the selected filters.</p></div>;
  }

  return (
    <div className={gridCls}>
      {ROWS.map(({ key, label, format }) => (
        <div key={key} className={`rounded-[10px] border border-border bg-surface p-[1.125rem] shadow-card border-l-[3px]${cardExtra}`} style={{ borderLeftColor: ACCENT[key] }}>
          <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-subtle">{label}</div>
          <div className="mt-2 text-[1.625rem] font-bold leading-[1.1] tracking-[-0.03em] tabular-nums" style={{ color: VALUE_COLOR[key] }}>{format(summary)}</div>
        </div>
      ))}
    </div>
  );
}
