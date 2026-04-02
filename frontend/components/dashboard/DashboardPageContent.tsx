"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { dayRangeToApiParams } from "@/lib/format";
import { fetchSeverityDistribution, fetchSummary, fetchTopSources, fetchTrend } from "@/lib/logs-api";
import { formatHistogramSectionMeta, formatTopSourcesSubtitle, formatTrendChartPrimary, HISTOGRAM_SCOPE_NOTE, TREND_CHART_ONLY_NOTE } from "@/lib/filterSummary";
import { validateDashboardFilters } from "@/lib/filterValidation";
import { resolveTrendAggregation } from "@/lib/trendBuckets";
import type { SeverityDistributionResponse, SummaryResponse, TopSourcesResponse, TrendResponse, Severity } from "@/lib/types";

import { DashboardFilterBar, getDefaultDashboardFilters, type DashboardFilterValues } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/Toast";
import { SeverityChart } from "./SeverityChart";
import { SummaryCards } from "./SummaryCards";
import { TopSourcesSection } from "./TopSourcesSection";
import { TrendChartCard } from "./TrendChartCard";

const SECTION = "mb-7 rounded-[10px] border border-border bg-surface p-6 shadow-card";

export function DashboardPageContent() {
  // state management
  const toast = useToast();
  const [draft, setDraft] = useState<DashboardFilterValues>(() => getDefaultDashboardFilters());
  const [applied, setApplied] = useState<DashboardFilterValues>(() => getDefaultDashboardFilters());
  const [trendSeverity, setTrendSeverity] = useState<Severity | "">("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [sevDist, setSevDist] = useState<SeverityDistributionResponse | null>(null);
  const [topSources, setTopSources] = useState<TopSourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const sharedParams = useMemo(() => {
    const range = dayRangeToApiParams(applied.startDate, applied.endDate);
    return { startDate: range.startDate, endDate: range.endDate, source: applied.source || undefined };
  }, [applied.endDate, applied.source, applied.startDate]);

  const trendParams = useMemo(() => ({ ...sharedParams, severity: trendSeverity }), [sharedParams, trendSeverity]);

  const loadShared = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const [s, sd, ts] = await Promise.all([fetchSummary(sharedParams), fetchSeverityDistribution(sharedParams), fetchTopSources({ ...sharedParams, limit: 3 })]);
      setSummary(s); setSevDist(sd); setTopSources(ts);
    } catch (e) {
      setSummary(null); setSevDist(null); setTopSources(null);
      setLoadError(e instanceof Error ? e.message : "Failed to load analytics.");
    } finally { setLoading(false); }
  }, [sharedParams]);

  const loadTrend = useCallback(async () => {
    setLoadError(null);
    try { setTrend(await fetchTrend(trendParams)); }
    catch (e) { setTrend(null); setLoadError(e instanceof Error ? e.message : "Failed to load analytics."); }
  }, [trendParams]);

  useEffect(() => { void loadShared(); void loadTrend(); }, [loadShared, loadTrend]);
  useEffect(() => { if (loadError) toast.show(loadError); }, [loadError, toast]);

  const validateAndNormalizeFilters = (v: DashboardFilterValues) => {
    const res = validateDashboardFilters({ startDate: v.startDate, endDate: v.endDate, source: v.source });
    if (!res.ok) return res;
    return { ok: true as const, value: { ...v, ...res.value } };
  };

  const onApply = () => {
    const res = validateAndNormalizeFilters(draft);
    if (!res.ok) { setFilterError(res.error); toast.show(res.error); return; }
    setFilterError(null); setDraft(res.value); setApplied(res.value);
  };
  const onReset = () => { const next = getDefaultDashboardFilters(); setDraft(next); setApplied(next); setFilterError(null); };

  const trendAggregation = useMemo(() => resolveTrendAggregation(trend?.points ?? [], applied.startDate, applied.endDate), [trend?.points, applied.startDate, applied.endDate]);
  const trendChartPrimary = formatTrendChartPrimary({ startDate: applied.startDate, endDate: applied.endDate, source: applied.source, aggregation: trendAggregation });
  const histogramMeta = formatHistogramSectionMeta({ startDate: applied.startDate, endDate: applied.endDate, source: applied.source });
  const topSourcesSubtitle = formatTopSourcesSubtitle();
  const sourceFilterActive = Boolean(applied.source?.trim());

  return (
    <div className="pb-2">
      <PageHeader title="Dashboard" description="Global filters apply to the whole dashboard. The trend chart has its own severity control." />
      <DashboardFilterBar values={draft} onChange={setDraft} onApply={onApply} onReset={onReset} disabled={loading} error={filterError} />

      <section className={SECTION}>
        <div className="grid grid-cols-1 items-stretch min-[901px]:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
          <div className="min-w-0 pr-0 min-[901px]:pr-6">
            <SummaryCards summary={summary} loading={loading} error={loadError} layout="dashboard" />
          </div>
          <aside className="mt-1 min-w-0 border-t border-border pt-5 min-[901px]:mt-0 min-[901px]:border-l min-[901px]:border-t-0 min-[901px]:pl-6 min-[901px]:pt-0">
            <TopSourcesSection items={topSources?.items ?? []} loading={loading} error={loadError} subtitle={topSourcesSubtitle} sourceFilterActive={sourceFilterActive} topN={3} />
          </aside>
        </div>
      </section>

      <section className={`${SECTION} border-t-0`}>
        <div className="mb-5">
          <h2 className="mb-1.5 text-[1.0625rem] font-bold tracking-tight text-primary">Severity distribution</h2>
          <p className="text-[0.8125rem] leading-normal text-muted">{histogramMeta}</p>
          <p className="mt-2 text-xs leading-[1.45] text-subtle">{HISTOGRAM_SCOPE_NOTE}</p>
        </div>
        <SeverityChart items={sevDist?.items ?? []} loading={loading} error={loadError} />
      </section>

      <section className={SECTION}>
        <div className="[&>section]:border-0 [&>section]:p-0 [&>section]:shadow-none [&>section]:rounded-none">
          <TrendChartCard points={trend?.points ?? []} startDate={applied.startDate} endDate={applied.endDate} loading={loading} error={loadError}
            severity={trendSeverity} onSeverityChange={setTrendSeverity} subtitle={trendChartPrimary} chartOnlyNote={TREND_CHART_ONLY_NOTE} />
        </div>
      </section>
    </div>
  );
}
