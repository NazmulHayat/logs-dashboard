import type { TrendPoint } from "./types";

export type TrendAggregation = "day" | "month";

export type TrendBucket = {
  id: string;
  count: number;
  tooltipLabel: string; // hover
  axisLabel: string; // x-axis
};

const MS_PER_DAY = 86_400_000;

export const MAX_X_AXIS_LABELS = 6;

function parseDay(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// number of calendar days between start and end (inclusive)
function inclusiveDaySpan(startDay: string, endDay: string): number {
  const a = parseDay(startDay);
  const b = parseDay(endDay);
  const diff = Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
  return Math.max(1, diff + 1);
}

function effectiveDayRange(
  points: TrendPoint[],
  startDate: string,
  endDate: string,
): { start: string; end: string } | null {
  if (!points.length) return null;
  const sortedDays = [...new Set(points.map((p) => p.day))].sort();
  const start = startDate || sortedDays[0];
  const end = endDate || sortedDays[sortedDays.length - 1];
  if (!start || !end) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}

function aggregationForSpan(spanDays: number): TrendAggregation {
  return spanDays <= 90 ? "day" : "month";
}

export function resolveTrendAggregation(
  points: TrendPoint[],
  startDate: string,
  endDate: string,
): TrendAggregation {
  const range = effectiveDayRange(points, startDate, endDate);
  if (!range) return "day";
  return aggregationForSpan(inclusiveDaySpan(range.start, range.end));
}

function formatDayLabel(day: string): string {
  try {
    return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return day;
  }
}

function formatMonthTooltip(ym: string): string {
  try {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1, 12, 0, 0, 0);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } catch {
    return ym;
  }
}

function formatMonthAxis(ym: string): string {
  try {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1, 12, 0, 0, 0);
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return ym;
  }
}

function buildDailyBuckets(
  counts: Map<string, number>,
  start: string,
  end: string,
): TrendBucket[] {
  const out: TrendBucket[] = [];
  let d = parseDay(start);
  const endD = parseDay(end);
  while (d.getTime() <= endD.getTime()) {
    const key = formatDayKey(d);
    const count = counts.get(key) ?? 0;
    const label = formatDayLabel(key);
    out.push({
      id: `d-${key}`,
      count,
      tooltipLabel: label,
      axisLabel: label,
    });
    d = addDays(d, 1);
  }
  return out;
}

function monthsInRange(start: string, end: string): string[] {
  const a = parseDay(start);
  const b = parseDay(end);
  let y = a.getFullYear();
  let mo = a.getMonth() + 1;
  const endY = b.getFullYear();
  const endMo = b.getMonth() + 1;
  const out: string[] = [];
  while (y < endY || (y === endY && mo <= endMo)) {
    out.push(`${y}-${String(mo).padStart(2, "0")}`);
    mo += 1;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
  }
  return out;
}

function buildMonthlyBuckets(
  counts: Map<string, number>,
  start: string,
  end: string,
): TrendBucket[] {
  return monthsInRange(start, end).map((ym) => {
    let total = 0;
    for (const [day, n] of counts) {
      if (day >= start && day <= end && day.slice(0, 7) === ym) {
        total += n;
      }
    }
    return {
      id: `m-${ym}`,
      count: total,
      tooltipLabel: formatMonthTooltip(ym),
      axisLabel: formatMonthAxis(ym),
    };
  });
}

export function buildTrendBuckets(
  points: TrendPoint[],
  startDate: string,
  endDate: string,
): TrendBucket[] {
  const range = effectiveDayRange(points, startDate, endDate);
  if (!range) return [];

  const counts = new Map<string, number>();
  for (const p of points) counts.set(p.day, p.count);

  const span = inclusiveDaySpan(range.start, range.end);
  const mode = aggregationForSpan(span);

  return mode === "day"
    ? buildDailyBuckets(counts, range.start, range.end)
    : buildMonthlyBuckets(counts, range.start, range.end);
}

export function xLabelIndices(
  totalBuckets: number,
  maxLabels = MAX_X_AXIS_LABELS,
): Set<number> {
  const n = totalBuckets;
  if (n <= 0) return new Set();
  if (n === 1) return new Set([0]);

  const k = Math.min(n, Math.max(2, maxLabels));
  const indices = new Set<number>();
  for (let j = 0; j < k; j++) {
    indices.add(Math.round((j * (n - 1)) / (k - 1)));
  }
  return indices;
}
