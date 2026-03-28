"use client";

import { useState } from "react";

import type { Severity } from "@/lib/types";
import { SEVERITIES, SORTABLE_FIELDS } from "@/lib/types";

export type LogsFilterValues = {
  search: string;
  severity: Severity | "";
  source: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const emptyLogs: LogsFilterValues = {
  search: "",
  severity: "",
  source: "",
  startDate: "",
  endDate: "",
  sortBy: "id",
  sortOrder: "desc",
};

export const getDefaultLogsFilters = (): LogsFilterValues => ({ ...emptyLogs });

export type DashboardFilterValues = {
  startDate: string;
  endDate: string;
  source: string;
};

export const getDefaultDashboardFilters = (): DashboardFilterValues => ({
  startDate: "",
  endDate: "",
  source: "",
});

const fieldClass = "flex min-w-0 flex-col gap-1.5";

const labelClass =
  "text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-subtle";

function severitySelect(
  id: string,
  value: Severity | "",
  onChange: (v: Severity | "") => void,
) {
  return (
    <select
      id={id}
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value as Severity | "")}
    >
      <option value="">All</option>
      {SEVERITIES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

const sortLabels: Record<string, string> = {
  timestamp: "Timestamp",
  severity: "Severity",
  source: "Source",
  created_at: "Created",
  id: "ID",
};

type LogsProps = {
  values: LogsFilterValues;
  onChange: (next: LogsFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
  error?: string | null;
};

export function FilterBar({
  values,
  onChange,
  onApply,
  onReset,
  disabled,
  error,
}: LogsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const p = (x: Partial<LogsFilterValues>) => onChange({ ...values, ...x });
  const activeAdvancedCount = [
    values.severity !== emptyLogs.severity,
    values.source !== emptyLogs.source,
    values.startDate !== emptyLogs.startDate,
    values.endDate !== emptyLogs.endDate,
    values.sortBy !== emptyLogs.sortBy,
    values.sortOrder !== emptyLogs.sortOrder,
  ].filter(Boolean).length;

  return (
    <div
      className="mb-7 grid gap-[14px] rounded-[10px] border border-border bg-surface px-6 py-5 shadow-card"
      role="search"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className={`${fieldClass} min-w-0 flex-[1_1_440px]`}>
          <label htmlFor="filter-search" className={labelClass}>
            Search logs
          </label>
          <input
            id="filter-search"
            className="input"
            type="search"
            value={values.search}
            onChange={(e) => p({ search: e.target.value })}
            placeholder="Search message text"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            className="btn btn-secondary min-w-[92px]"
            onClick={() => setShowAdvanced((open) => !open)}
            aria-expanded={showAdvanced}
          >
            Filters{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onApply}
            disabled={disabled}
          >
            Apply
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={disabled}
          >
            Reset
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-sev-error-text">{error}</p>
      ) : null}
      {showAdvanced ? (
        <div className="flex flex-wrap gap-3 pt-1">
          <div className={`${fieldClass} shrink grow-0 basis-[160px]`}>
            <label htmlFor="filter-severity" className={labelClass}>
              Severity
            </label>
            {severitySelect("filter-severity", values.severity, (severity) =>
              p({ severity }),
            )}
          </div>
          <div className={`${fieldClass} min-w-0 shrink grow basis-[180px]`}>
            <label htmlFor="filter-source" className={labelClass}>
              Source
            </label>
            <input
              id="filter-source"
              className="input"
              value={values.source}
              onChange={(e) => p({ source: e.target.value })}
              placeholder="Filter by source"
            />
          </div>
          <div className={`${fieldClass} shrink grow-0 basis-[160px]`}>
            <label htmlFor="filter-start" className={labelClass}>
              Start date
            </label>
            <input
              id="filter-start"
              className="input"
              type="date"
              value={values.startDate}
              onChange={(e) => p({ startDate: e.target.value })}
            />
          </div>
          <div className={`${fieldClass} shrink grow-0 basis-[160px]`}>
            <label htmlFor="filter-end" className={labelClass}>
              End date
            </label>
            <input
              id="filter-end"
              className="input"
              type="date"
              value={values.endDate}
              onChange={(e) => p({ endDate: e.target.value })}
            />
          </div>
          <div className={`${fieldClass} shrink grow-0 basis-[160px]`}>
            <label htmlFor="filter-sort" className={labelClass}>
              Sort by
            </label>
            <select
              id="filter-sort"
              className="select"
              value={values.sortBy}
              onChange={(e) => p({ sortBy: e.target.value })}
            >
              {SORTABLE_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {sortLabels[f]}
                </option>
              ))}
            </select>
          </div>
          <div className={`${fieldClass} shrink grow-0 basis-[140px]`}>
            <label htmlFor="filter-order" className={labelClass}>
              Order
            </label>
            <select
              id="filter-order"
              className="select"
              value={values.sortOrder}
              onChange={(e) => p({ sortOrder: e.target.value as "asc" | "desc" })}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type DashProps = {
  values: DashboardFilterValues;
  onChange: (next: DashboardFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
  error?: string | null;
};

export function DashboardFilterBar({
  values,
  onChange,
  onApply,
  onReset,
  disabled,
  error,
}: DashProps) {
  const p = (x: Partial<DashboardFilterValues>) => onChange({ ...values, ...x });
  return (
    <div
      className="mb-7 grid grid-cols-1 items-end gap-x-5 gap-y-4 rounded-[10px] border border-border bg-surface px-6 py-5 shadow-card min-[641px]:max-[1120px]:grid-cols-2 min-[1121px]:grid-cols-[minmax(140px,168px)_minmax(140px,168px)_minmax(220px,1fr)_auto]"
      role="search"
    >
      <div className={fieldClass}>
        <label htmlFor="dash-start" className={labelClass}>
          Start date
        </label>
        <input
          id="dash-start"
          className="input w-full"
          type="date"
          value={values.startDate}
          onChange={(e) => p({ startDate: e.target.value })}
        />
      </div>
      <div className={fieldClass}>
        <label htmlFor="dash-end" className={labelClass}>
          End date
        </label>
        <input
          id="dash-end"
          className="input w-full"
          type="date"
          value={values.endDate}
          onChange={(e) => p({ endDate: e.target.value })}
        />
      </div>
      <div
        className={`${fieldClass} min-[641px]:max-[1120px]:col-span-full max-[640px]:col-auto`}
      >
        <label htmlFor="dash-source" className={labelClass}>
          Filter by source
        </label>
        <input
          id="dash-source"
          className="input w-full"
          value={values.source}
          onChange={(e) => p({ source: e.target.value })}
          placeholder="Enter source"
        />
      </div>
      <div
        className="flex items-end justify-end max-[640px]:justify-start min-[641px]:max-[1120px]:col-span-full"
      >
        <div className="flex items-end gap-2 max-[640px]:flex-wrap min-[641px]:flex-nowrap">
          <button type="button" className="btn btn-primary" onClick={onApply} disabled={disabled}>
            Apply filters
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset} disabled={disabled}>
            Reset
          </button>
        </div>
      </div>
      {error ? (
        <p className="col-span-full mt-3 text-sm text-sev-error-text">{error}</p>
      ) : null}
    </div>
  );
}
