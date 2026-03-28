"use client";

import { useEffect, useState } from "react";
import { bulkCreateLogs } from "@/lib/logs-api";
import { SEVERITIES, type Severity } from "@/lib/types";
import { useToast } from "@/components/shared/Toast";

type ParsedCsvRow = { timestamp: string; severity: Severity; source: string; message: string };
type CsvError = { row: number; message: string };
type CsvSummary = { total: number; valid: ParsedCsvRow[]; errors: CsvError[] };

const REQUIRED_HEADERS = ["timestamp", "severity", "source", "message"] as const;

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
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<CsvSummary | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const resetState = () => { setAnalyzing(false); setImporting(false); setSummary(null); setSelectedFileName(""); setFileInputKey((k) => k + 1); };
  const handleClose = () => { resetState(); onClose(); };
  useEffect(() => { if (!open) resetState(); }, [open]);
  if (!open) return null;

  const handleSelectFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { toast.show("Please upload a .csv file."); return; }
    setSelectedFileName(file.name); setAnalyzing(true); setSummary(null);
    try { setSummary(parseAndValidateCsv(await file.text())); } finally { setAnalyzing(false); }
  };

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
        <div className="mt-3">
          <input key={fileInputKey} type="file" accept=".csv,text/csv" onChange={handleSelectFile} disabled={analyzing || importing} />
          {selectedFileName && <p className="mt-2 text-[0.9rem] opacity-80">Selected: {selectedFileName}</p>}
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
