"use client";

import { useEffect, useRef, useState } from "react";
import { bulkCreateLogs } from "@/lib/logs-api";
import { SEVERITIES, type Severity } from "@/lib/types";
import { useToast } from "@/components/shared/Toast";

type ParsedCsvRow = { timestamp: string; severity: Severity; source: string; message: string };
type CsvError = { row: number; message: string };
type CsvSummary = { total: number; valid: ParsedCsvRow[]; errors: CsvError[] };

const REQUIRED_HEADERS = ["timestamp", "severity", "source", "message"] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseAndValidateCsv(contents: string): CsvSummary {
  const lines = contents.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { total: 0, valid: [], errors: [{ row: 0, message: "File is empty." }] };
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) return { total: 0, valid: [], errors: [{ row: 0, message: `Missing required column(s): ${missing.join(", ")}` }] };
  const idx = Object.fromEntries(REQUIRED_HEADERS.map((h) => [h, header.indexOf(h)])) as Record<(typeof REQUIRED_HEADERS)[number], number>;
  const valid: ParsedCsvRow[] = [];
  const errors: CsvError[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row = i;
    const timestamp = (cols[idx.timestamp] ?? "").trim();
    const severityRaw = (cols[idx.severity] ?? "").trim().toUpperCase();
    const source = (cols[idx.source] ?? "").trim();
    const message = (cols[idx.message] ?? "").trim();
    const rowErrors: string[] = [];
    if (!timestamp) rowErrors.push("missing timestamp");
    else if (Number.isNaN(new Date(timestamp).getTime())) rowErrors.push("invalid timestamp");
    if (!SEVERITIES.includes(severityRaw as Severity)) rowErrors.push("invalid severity");
    if (!source) rowErrors.push("missing source");
    if (!message) rowErrors.push("missing message");
    if (rowErrors.length > 0) { errors.push({ row, message: rowErrors.join("; ") }); continue; }
    valid.push({ timestamp, severity: severityRaw as Severity, source, message });
  }
  return { total: lines.length - 1, valid, errors };
}

type Props = { open: boolean; onClose: () => void; onImported: () => void };

export function CsvImportDialog({ open, onClose, onImported }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<CsvSummary | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const resetState = () => {
    setAnalyzing(false);
    setImporting(false);
    setSummary(null);
    setSelectedFileName("");
    setSelectedFileSize(null);
    setDragOver(false);
    setFileInputKey((k) => k + 1);
  };
  const handleClose = () => { resetState(); onClose(); };
  useEffect(() => { if (!open) resetState(); }, [open]);
  if (!open) return null;

  const processCsvFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.show("Please upload a .csv file.");
      return;
    }
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setAnalyzing(true);
    setSummary(null);
    try {
      setSummary(parseAndValidateCsv(await file.text()));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processCsvFile(file);
  };

  const clearSelectedFile = () => {
    setSummary(null);
    setSelectedFileName("");
    setSelectedFileSize(null);
    setFileInputKey((k) => k + 1);
  };

  const pickDisabled = analyzing || importing;

  const handleImport = async () => {
    if (!summary || summary.valid.length === 0) return;
    setImporting(true);
    try { const res = await bulkCreateLogs({ items: summary.valid }); toast.show(`Imported ${res.inserted} rows.`); onImported(); handleClose(); }
    catch (err) { toast.show(err instanceof Error ? err.message : "Import failed."); }
    finally { setImporting(false); }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] grid place-items-center bg-black/45 p-4" onClick={handleClose}>
      <div className="w-full max-w-[760px] rounded-xl border border-border bg-surface px-6 py-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1.5">Import logs from CSV</h2>
        <p className="text-[0.8125rem] text-muted">Required columns: <code>timestamp</code>, <code>severity</code>, <code>source</code>, <code>message</code></p>
        <ul className="mb-2 mt-1 list-disc pl-[1.1rem] text-[0.9rem]">
          <li><strong>timestamp</strong>: date and time (e.g. <code>2026-03-27T10:15:30</code>)</li>
          <li><strong>severity</strong>: <code>DEBUG</code>, <code>INFO</code>, <code>WARNING</code>, <code>ERROR</code> (uppercase)</li>
          <li><strong>source</strong>: any text (e.g. <code>auth-service</code>)</li>
          <li><strong>message</strong>: any text</li>
        </ul>
        <p className="text-[0.8125rem] text-muted">Invalid rows will be skipped and shown below.</p>
        
        <div className="mt-4">
          <input
            ref={fileInputRef}
            key={fileInputKey}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleSelectFile}
            disabled={pickDisabled}
          />
          {!selectedFileName ? (
            <button
              type="button"
              disabled={pickDisabled}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                if (!pickDisabled) setDragOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOver(false);
                if (pickDisabled) return;
                const file = e.dataTransfer.files?.[0];
                if (file) await processCsvFile(file);
              }}
              className={[
                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                pickDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                dragOver
                  ? "border-[var(--color-link)] bg-[color-mix(in_srgb,var(--color-link)_10%,var(--color-surface))]"
                  : "border-border bg-[color-mix(in_srgb,var(--color-page)_55%,var(--color-surface))] hover:border-[color-mix(in_srgb,var(--color-muted)_45%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-page)_85%,var(--color-surface))]",
              ].join(" ")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-border">
                <svg className="h-6 w-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 16V4m0 0l4 4m-4-4L8 8" />
                  <path d="M4 14v2a3 3 0 003 3h10a3 3 0 003-3v-2" />
                </svg>
              </span>
              <span className="text-[0.9375rem] font-medium text-primary">Drag a CSV file here</span>
              <span className="text-[0.8125rem] text-muted">or</span>
              <span className="text-[0.875rem] font-medium text-[var(--color-link)] underline decoration-[var(--color-link)]/35 underline-offset-2">
                Select from your computer
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page)_40%,var(--color-surface))] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-border">
                  <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[0.9rem] font-medium text-primary">{selectedFileName}</p>
                  {selectedFileSize != null && (
                    <p className="text-[0.75rem] text-muted">{formatFileSize(selectedFileSize)}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1.5 text-[0.8125rem] font-medium text-[var(--color-link)] hover:bg-[color-mix(in_srgb,var(--color-link)_8%,transparent)] disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pickDisabled}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-2.5 py-1.5 text-[0.8125rem]"
                    onClick={clearSelectedFile}
                    disabled={pickDisabled}
                    aria-label="Remove file"
                    title="Remove file"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
          )}

        </div>
        {analyzing && <p className="mt-3 font-semibold">Analyzing CSV...</p>}
        {summary && (
          <div className="mt-4 rounded-[10px] border border-border p-3.5 px-4">
            <p><strong>Result:</strong> {summary.total} rows found, {summary.valid.length} valid, {summary.errors.length} skipped.</p>
            {summary.errors.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-2 font-semibold">Errors</p>
                <ul className="m-0 max-h-[180px] list-disc overflow-y-auto pl-[1.15rem]">
                  {summary.errors.map((e) => (<li key={`${e.row}-${e.message}`} className="mb-0.5">row {e.row}: {e.message}</li>))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={importing}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => void handleImport()} disabled={importing || !summary || summary.valid.length === 0}>
            {importing ? "Importing..." : `Confirm import (${summary?.valid.length ?? 0})`}
          </button>
        </div>
      </div>
    </div>
  );
}
