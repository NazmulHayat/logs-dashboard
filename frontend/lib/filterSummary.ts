// subtitles for the dashboard page

import type { Severity } from "./types";

function formatMonthDay(day: string): string | null {
  if (!day) return null;
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRangeLabel(startDay: string, endDay: string): string {
  const start = formatMonthDay(startDay);
  const end = formatMonthDay(endDay);
  if (start && end) return `${start}\u2013${end}`;
  if (start) return `Since ${start}`;
  if (end) return `Up to ${end}`;
  return "All dates";
}

export function formatSourceLabel(source: string): string {
  const s = source.trim();
  return s ? s : "All sources";
}

export function formatSeverityLabel(severity: Severity | ""): string {
  if (!severity) return "All";
  return severity === "WARNING" ? "WARN" : severity;
}

export function formatTrendSubtitle(opts: {
  startDate: string;
  endDate: string;
  source: string;
  severity: Severity | "";
  aggregation: "day" | "month";
}): string {
  const volume =
    opts.aggregation === "month" ? "Monthly log volume" : "Daily log volume";
  return [
    volume,
    `Severity: ${formatSeverityLabel(opts.severity)}`,
    `Source: ${formatSourceLabel(opts.source)}`,
    `Date: ${formatDateRangeLabel(opts.startDate, opts.endDate)}`,
  ].join(" | ");
}

export function formatTrendChartPrimary(opts: {
  startDate: string;
  endDate: string;
  source: string;
  aggregation: "day" | "month";
}): string {
  const volume =
    opts.aggregation === "month" ? "Monthly log volume" : "Daily log volume";
  return [
    volume,
    `Source: ${formatSourceLabel(opts.source)}`,
    `Date: ${formatDateRangeLabel(opts.startDate, opts.endDate)}`,
  ].join(" | ");
}

export const TREND_CHART_ONLY_NOTE =
  "Severity filter applies to this chart only";

export function formatHistogramSubtitle(opts: {
  startDate: string;
  endDate: string;
  source: string;
}): string {
  return [
    "Severity distribution",
    `Source: ${formatSourceLabel(opts.source)}`,
    `Date: ${formatDateRangeLabel(opts.startDate, opts.endDate)}`,
  ].join(" | ");
}

export function formatHistogramSectionMeta(opts: {
  startDate: string;
  endDate: string;
  source: string;
}): string {
  return [
    `Source: ${formatSourceLabel(opts.source)}`,
    `Date: ${formatDateRangeLabel(opts.startDate, opts.endDate)}`,
  ].join(" | ");
}

export const HISTOGRAM_SCOPE_NOTE = "All severities within selected filters";

export function formatTopSourcesSubtitle(): string {
  return "Based on selected date range and source";
}

