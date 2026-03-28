"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { dayRangeToApiParams } from "@/lib/format";
import { validateLogsFilters } from "@/lib/filterValidation";
import { fetchLogs } from "@/lib/logs-api";
import type { LogListResponse, LogRecord, SortableField } from "@/lib/types";
import {
  FilterBar,
  getDefaultLogsFilters,
  type LogsFilterValues,
} from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/Toast";
import { CsvImportDialog } from "./CsvImportDialog";
import { DataTable } from "./DataTable";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function buildCsvBlob(rows: LogRecord[]): Blob {
  const header = "timestamp,severity,source,message";
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      escape(r.timestamp),
      escape(r.severity),
      escape(r.source),
      escape(r.message),
    ].join(","),
  );
  return new Blob([header + "\n" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LogsPageContent() {
  const toast = useToast();
  const [draft, setDraft] = useState<LogsFilterValues>(() =>
    getDefaultLogsFilters(),
  );
  const [applied, setApplied] = useState<LogsFilterValues>(() =>
    getDefaultLogsFilters(),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<LogListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const validateAndNormalizeFilters = (v: LogsFilterValues) => {
    const res = validateLogsFilters({
      startDate: v.startDate,
      endDate: v.endDate,
      source: v.source,
      search: v.search,
    });
    if (!res.ok) return res;
    return {
      ok: true as const,
      value: { ...v, ...res.value },
    };
  };

  const filterParams = useMemo(() => {
    const range = dayRangeToApiParams(applied.startDate, applied.endDate);
    return {
      search: applied.search || undefined,
      severity: applied.severity,
      source: applied.source || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy: applied.sortBy as SortableField,
      sortOrder: applied.sortOrder,
    };
  }, [applied]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchLogs({ ...filterParams, page, pageSize }));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [filterParams, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (error) toast.show(error);
  }, [error, toast]);

  const onApply = () => {
    const res = validateAndNormalizeFilters(draft);
    if (!res.ok) {
      setFilterError(res.error);
      toast.show(res.error);
      return;
    }
    setFilterError(null);
    setDraft(res.value);
    setApplied(res.value);
    setPage(1);
  };

  const onReset = () => {
    const next = getDefaultLogsFilters();
    setDraft(next);
    setApplied(next);
    setFilterError(null);
    setPage(1);
  };

  const onSort = (field: SortableField) => {
    const nextOrder =
      applied.sortBy === field && applied.sortOrder === "desc" ? "asc" : "desc";
    const next = { ...applied, sortBy: field, sortOrder: nextOrder as "asc" | "desc" };
    setDraft(next);
    setApplied(next);
    setPage(1);
  };

  const exportAllCsv = async () => {
    setExporting(true);
    try {
      const all: LogRecord[] = [];
      let p = 1;
      while (true) {
        const res = await fetchLogs({ ...filterParams, page: p, pageSize: 100 });
        all.push(...res.items);
        if (all.length >= res.total || res.items.length === 0) break;
        p++;
      }
      triggerDownload(buildCsvBlob(all));
    } finally {
      setExporting(false);
    }
  };

  const total = data?.total ?? 0;
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = data !== null && page * pageSize < total;
  const hasRows = data !== null && data.items.length > 0;

  return (
    <>
      <PageHeader
        title="Logs"
        description="Browse, filter, and inspect log entries."
        action={
          <div className="flex gap-2">
            <Link href="/logs/new" className="btn btn-primary" prefetch={false}>
              Create single log
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setImportOpen(true)}
            >
              Import from CSV
            </button>
          </div>
        }
      />
      <CsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void load();
        }}
      />
      <FilterBar
        values={draft}
        onChange={setDraft}
        onApply={onApply}
        onReset={onReset}
        disabled={loading}
        error={filterError}
      />
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        error={error}
        sortBy={applied.sortBy}
        sortOrder={applied.sortOrder}
        onSort={onSort}
      />
      {!loading && !error && data ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>
            {total === 0
              ? "No results"
              : `Showing ${startIdx}\u2013${endIdx} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <label className="mr-1 flex items-center gap-1.5 border-r border-border pr-3 text-[0.8125rem] text-muted">
              Rows
              <select
                className="cursor-pointer rounded-lg border border-border bg-surface px-2 py-1 text-[0.8125rem] text-primary"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {hasRows ? (
              <button
                type="button"
                className="btn btn-secondary mr-1 border-r border-border pr-4"
                disabled={exporting}
                onClick={() => void exportAllCsv()}
              >
                {exporting ? "Exporting…" : `Export CSV (${total})`}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
