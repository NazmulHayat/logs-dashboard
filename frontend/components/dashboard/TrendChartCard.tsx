"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Severity, TrendPoint } from "@/lib/types";
import { SEVERITIES } from "@/lib/types";
import { formatSeverityLabel } from "@/lib/filterSummary";
import { buildTrendBuckets, xLabelIndices } from "@/lib/trendBuckets";

type Props = {
  points: TrendPoint[];
  startDate: string;
  endDate: string;
  loading: boolean;
  error: string | null;
  severity: Severity | "";
  onSeverityChange: (v: Severity | "") => void;
  subtitle: string;
  chartOnlyNote: string;
};

const SVG_H = 260;
const PAD_T = 28;
const PAD_B = 40;
const MIN_PX_PER_LABEL = 120;

function yTickValues(top: number, count = 5): number[] {
  if (top <= 0) return [0];
  const raw: number[] = [];
  for (let i = 0; i < count; i++) raw.push(Math.round((top * i) / (count - 1)));
  return [...new Set(raw)].sort((a, b) => a - b);
}

function yScaleTop(maxCount: number): number {
  return Math.max(4, Math.ceil(Math.max(maxCount, 1) * 1.12));
}

function SeveritySelect({ id, severity, onSeverityChange, disabled }: {
  id: string; severity?: Severity | ""; onSeverityChange?: (v: Severity | "") => void; disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-start justify-end gap-2">
      <div className="flex flex-col items-end gap-1">
        <label className="text-[0.6875rem] font-semibold uppercase tracking-[0.03em] text-muted" htmlFor={id}>Severity (chart only)</label>
        <select id={id} className="select min-w-[140px]" value={severity ?? ""}
          onChange={onSeverityChange ? (e) => onSeverityChange(e.target.value as Severity | "") : undefined}
          disabled={disabled} aria-label="Severity (chart only)">
          {disabled ? <option>…</option> : (
            <>
              <option value="">All</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{formatSeverityLabel(s)}</option>)}
            </>
          )}
        </select>
      </div>
    </div>
  );
}

export function TrendChartCard({ points, startDate, endDate, loading, error, severity, onSeverityChange, subtitle, chartOnlyNote }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [frameW, setFrameW] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);

  const frameRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!node) return;
    setFrameW(node.clientWidth);
    const ro = new ResizeObserver(() => setFrameW(node.clientWidth));
    ro.observe(node);
    roRef.current = ro;
  }, []);

  useEffect(() => () => { roRef.current?.disconnect(); }, []);

  const buckets = useMemo(() => buildTrendBuckets(points, startDate, endDate), [points, startDate, endDate]);

  if (error) {
    return (
      <section className="rounded-[10px] border border-border bg-surface px-[26px] py-[22px] shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Log volume over time</h2>
            <p className="mt-1.5 text-[0.8125rem] leading-[1.45] text-muted">{chartOnlyNote}</p>
          </div>
          <SeveritySelect id="trend-severity-error" severity={severity} onSeverityChange={onSeverityChange} />
        </div>
        <p className="mt-2 text-sm text-sev-error-text">{error}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-[10px] border border-border bg-surface px-[26px] py-[22px] shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Log volume over time</h2>
            <p className="text-[0.8125rem] text-muted">Loading…</p>
            <p className="mt-1.5 text-[0.8125rem] leading-[1.45] text-muted">{chartOnlyNote}</p>
          </div>
          <SeveritySelect id="trend-severity-loading" disabled />
        </div>
        <div className="rounded-lg border border-border bg-gradient-to-b from-[#f8f9fc] to-white p-[clamp(6px,1.2vw,10px)_clamp(8px,2vw,14px)]">
          <div className="relative w-full min-h-[200px]">
            <div className="skeleton absolute inset-0 min-h-[200px] rounded-md" />
          </div>
        </div>
      </section>
    );
  }

  if (points.length === 0 || buckets.length === 0) {
    return (
      <section className="rounded-[10px] border border-border bg-surface px-[26px] py-[22px] shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Log volume over time</h2>
            <p className="mt-1.5 text-[0.8125rem] leading-[1.45] text-muted">{chartOnlyNote}</p>
          </div>
          <SeveritySelect id="trend-severity-empty" severity={severity} onSeverityChange={onSeverityChange} />
        </div>
        <p className="py-10 text-center text-[0.9375rem] text-muted">No data for the selected filters.</p>
      </section>
    );
  }

  // calculate the y-axis scale and the width of the SVG
  const counts = buckets.map((b) => b.count);
  const yTop = yScaleTop(Math.max(...counts, 0));
  const svgW = frameW > 0 ? frameW : 960;
  const PAD_L = svgW < 400 ? 26 : svgW < 560 ? 32 : 40;
  const PAD_R = svgW < 400 ? 10 : svgW < 560 ? 16 : 24;
  const innerW = svgW - PAD_L - PAD_R;
  const innerH = SVG_H - PAD_T - PAD_B;
  const n = buckets.length;
  const baseY = PAD_T + innerH;
  const xAt = (i: number) => n <= 1 ? PAD_L + innerW / 2 : PAD_L + (innerW * i) / (n - 1);
  const yAt = (count: number) => PAD_T + innerH - (Math.min(count, yTop) / yTop) * innerH;

  const coords = buckets.map((b, i) => ({ x: xAt(i), y: yAt(b.count), ...b })); //list of SVG coord
  const lineD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" "); // SVG path data ~ line
  const firstX = coords[0].x;
  const lastX = coords[coords.length - 1].x;
  const areaD = n === 1
    ? `M ${(firstX - 48).toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${coords[0].y.toFixed(1)} L ${(firstX + 48).toFixed(1)} ${baseY} Z`
    : `${lineD} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;

  const gridLines = yTickValues(yTop, 5).map((val) => ({ y: PAD_T + innerH - (val / yTop) * innerH, val }));

  // determine the number of x-axis labels to show
  const maxLabels = Math.max(3, Math.floor(svgW / MIN_PX_PER_LABEL));
  const labelIndices = xLabelIndices(n, maxLabels);
  // calculate the width of each slot on the x-axis
  const slotWidth = n > 1 ? innerW / (n - 1) : innerW;

  return (
    <section className="rounded-[10px] border border-border bg-surface px-[26px] py-[22px] shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="mb-1 text-lg font-semibold tracking-[-0.02em]">Log volume over time</h2>
          <p className="text-[0.8125rem] text-muted">{subtitle}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-[1.45] text-muted">{chartOnlyNote}</p>
        </div>
        <SeveritySelect id="trend-severity" severity={severity} onSeverityChange={onSeverityChange} />
      </div>
      <div className="relative w-full rounded-lg border border-border bg-gradient-to-b from-[#f8f9fc] to-white p-[clamp(6px,1.2vw,10px)_clamp(8px,2vw,14px)]">
        <div className="relative w-full min-h-[200px]" ref={frameRef}>
          <svg className="block w-full" viewBox={`0 0 ${svgW} ${SVG_H}`} height={SVG_H}
            preserveAspectRatio="xMidYMid meet" role="img" aria-label="Log volume trend over time"
            onMouseLeave={() => setHovered(null)}>
            <defs>
              <linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-line)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-chart-line)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} rx="4" className="trend-chart-plot-bg" />
            {gridLines.map(({ y, val }) => (
              <g key={val}>
                <line className="trend-chart-grid" x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y} />
                <text x={PAD_L - 10} y={y + 4} textAnchor="end" className="trend-chart-tick">{val}</text>
              </g>
            ))}
            <line className="trend-chart-axis trend-chart-axis-x" x1={PAD_L} y1={baseY} x2={svgW - PAD_R} y2={baseY} />
            <line className="trend-chart-axis trend-chart-axis-y" x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={baseY} />
            <path className="trend-chart-area" d={areaD} />
            <path className="trend-chart-line" d={lineD} />
            {n === 1 && <line className="trend-chart-stem" x1={coords[0].x} y1={baseY} x2={coords[0].x} y2={coords[0].y} />}
            {coords.map((c, i) => (
              <circle key={c.id} className={`trend-chart-point${hovered === i ? " trend-chart-point-active" : ""}`} cx={c.x} cy={c.y} r={hovered === i ? 5.5 : 3.5} />
            ))}
            {coords.map((c, i) => (
              <rect key={`hit-${c.id}`} x={c.x - slotWidth / 2} y={PAD_T} width={slotWidth} height={innerH} fill="transparent" onMouseEnter={() => setHovered(i)} />
            ))}
            {hovered !== null && <line className="trend-chart-guide" x1={coords[hovered].x} y1={PAD_T} x2={coords[hovered].x} y2={baseY} />}
            {coords.map((c, i) => labelIndices.has(i) ? (
              <text key={`${c.id}-label`} x={c.x} y={SVG_H - 10}
                textAnchor={i === 0 ? "start" : i === coords.length - 1 ? "end" : "middle"}
                className="trend-chart-tick trend-chart-tick-x">{c.axisLabel}</text>
            ) : null)}
          </svg>
          {hovered !== null && (
            <div className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-[110%] flex-col gap-0.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-[0.8125rem] text-white shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
              style={{ left: `${(coords[hovered].x / svgW) * 100}%`, top: `${(coords[hovered].y / SVG_H) * 100}%` }}>
              <strong className="font-bold">{coords[hovered].tooltipLabel}</strong>
              <span className="font-mono text-xs opacity-80">{coords[hovered].count} logs</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
