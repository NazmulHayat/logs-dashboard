"use client";

import { useRouter } from "next/navigation";

import { formatDateTimeShort } from "@/lib/format";
import type { LogRecord, SortableField } from "@/lib/types";

import { SeverityBadge } from "./SeverityBadge";

type Props = {
  rows: LogRecord[];
  loading: boolean;
  error: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortableField) => void;
};

const wrapClass =
  "overflow-x-auto rounded-xl border border-border bg-surface shadow-card";

function TableState({ children, className }: { children: string; className?: string }) {
  return (
    <div className={wrapClass}>
      <p
        className={`px-4 py-10 text-center text-[0.9375rem] ${className ?? "text-muted"}`}
      >
        {children}
      </p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className={wrapClass}>
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-[42px] w-full" />
        <div className="skeleton h-[42px] w-full" />
        <div className="skeleton h-[42px] w-full" />
        <div className="skeleton h-[42px] w-full" />
        <div className="skeleton h-[42px] w-full" />
      </div>
    </div>
  );
}

const COLUMNS: { key: SortableField; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "timestamp", label: "Timestamp" },
  { key: "severity", label: "Severity" },
  { key: "source", label: "Source" },
];

const rowInteractive =
  "cursor-pointer transition-colors duration-[120ms] ease-in-out odd:bg-surface even:bg-[#fafbfc] hover:bg-[color-mix(in_srgb,var(--color-btn-primary)_4%,white)] even:hover:bg-[color-mix(in_srgb,var(--color-btn-primary)_5%,#fafbfc)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]";

export function DataTable({ rows, loading, error, sortBy, sortOrder, onSort }: Props) {
  const router = useRouter();
  const go = (id: number) => router.push(`/logs/${id}`);

  if (loading) return <SkeletonRows />;
  if (error)
    return (
      <TableState className="text-sev-error-text">{error}</TableState>
    );
  if (rows.length === 0)
    return (
      <TableState>No logs match the current filters.</TableState>
    );

  return (
    <div className={wrapClass}>
      <table
        className="w-full border-collapse text-[0.9375rem] [&_tbody_tr:last-child_td]:border-b-0"
      >
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const active = sortBy === col.key;
              const arrow = active ? (sortOrder === "asc" ? " \u2191" : " \u2193") : "";
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    onSort
                      ? "cursor-pointer select-none whitespace-nowrap border-b border-border bg-[#fbfcfe] px-4 py-[14px] text-left align-top text-xs font-bold uppercase tracking-[0.04em] text-muted transition-colors duration-[120ms] ease-in-out hover:text-primary"
                      : "select-none whitespace-nowrap border-b border-border bg-[#fbfcfe] px-4 py-[14px] text-left align-top text-xs font-bold uppercase tracking-[0.04em] text-muted"
                  }
                  onClick={onSort ? () => onSort(col.key) : undefined}
                  aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                >
                  {col.label}
                  {arrow}
                </th>
              );
            })}
            <th
              scope="col"
              className="select-none whitespace-nowrap border-b border-border bg-[#fbfcfe] px-4 py-[14px] text-left align-top text-xs font-bold uppercase tracking-[0.04em] text-muted"
            >
              Message
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((log) => (
            <tr
              key={log.id}
              className={rowInteractive}
              tabIndex={0}
              aria-label={`Open log ${log.id}`}
              onClick={() => go(log.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(log.id);
                }
              }}
            >
              <td className="border-b border-border px-4 py-[14px] text-left align-top">
                <span className="font-mono text-[#1f2a44] font-semibold tabular-nums">
                  {log.id}
                </span>
              </td>
              <td className="border-b border-border px-4 py-[14px] text-left align-top">
                <span className="font-mono whitespace-nowrap text-sm text-[#374151] tabular-nums">
                  {formatDateTimeShort(log.timestamp)}
                </span>
              </td>
              <td className="border-b border-border px-4 py-[14px] text-left align-top">
                <SeverityBadge severity={log.severity} />
              </td>
              <td className="border-b border-border px-4 py-[14px] text-left align-top">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-[#f2f4f7] px-1.5 font-mono text-xs font-medium text-[#4b5563]"
                    aria-hidden="true"
                  >
                    &gt;_
                  </span>
                  <span>{log.source}</span>
                </span>
              </td>
              <td
                className="max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-border px-4 py-[14px] text-left align-top text-[#202632]"
                title={log.message}
              >
                {log.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
